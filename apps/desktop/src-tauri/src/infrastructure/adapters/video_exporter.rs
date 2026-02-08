use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Instant;
use tracing::{info, error};

use crate::domain::errors::DomainError;
use super::audio_extractor::ffmpeg_path;

/// Rich progress info parsed from FFmpeg stderr
#[derive(Debug, Clone)]
pub struct FfmpegProgressInfo {
    pub percent: f64,
    pub current_time: f64,
    pub speed: f64,
    pub current_frame: Option<u64>,
    pub total_frames: Option<u64>,
    pub fps: Option<f64>,
    pub file_size_bytes: Option<u64>,
    pub elapsed_secs: f64,
    pub eta_secs: Option<f64>,
    pub estimated_total_bytes: Option<u64>,
}

/// VideoExporter - exports video using FFmpeg concat demuxer with copy or re-encode modes
pub struct VideoExporter;

/// FFmpeg encoding parameters per quality level
struct EncodingParams {
    crf: u32,
    preset: &'static str,
}

impl VideoExporter {
    /// Export segments using stream copy (no re-encoding). Fast, preserves original quality.
    /// Supports cancellation during FFmpeg execution and cleans up partial files.
    pub fn export_with_copy(
        segment_paths: &[String],
        output_path: &Path,
        total_duration_secs: f64,
        cancel_flag: &Arc<AtomicBool>,
        on_progress: impl Fn(FfmpegProgressInfo) + Send,
    ) -> Result<PathBuf, DomainError> {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err(DomainError::OperationCancelled(
                "Export annulé par l'utilisateur".into(),
            ));
        }

        if segment_paths.is_empty() {
            return Err(DomainError::ProcessingError(
                "Aucun segment à exporter".into(),
            ));
        }

        // Create output directory if needed
        if let Some(parent) = output_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| DomainError::ProcessingError(
                format!("Impossible de créer le dossier de sortie: {}", e),
            ))?;
        }

        let filelist_path = output_path.with_extension("filelist.txt");
        let filelist_content = Self::build_filelist(segment_paths);

        info!(
            event = "export_copy_start",
            segment_count = segment_paths.len(),
            output = %output_path.display(),
        );

        std::fs::write(&filelist_path, &filelist_content).map_err(|e| {
            DomainError::ProcessingError(format!("Impossible d'écrire le fichier filelist: {}", e))
        })?;

        if cancel_flag.load(Ordering::Relaxed) {
            let _ = std::fs::remove_file(&filelist_path);
            return Err(DomainError::OperationCancelled(
                "Export annulé par l'utilisateur".into(),
            ));
        }

        let ffmpeg = ffmpeg_path();
        let output_str = output_path.to_str().unwrap_or_default();
        let filelist_str = filelist_path.to_str().unwrap_or_default();

        let mut child = Command::new(&ffmpeg)
            .args([
                "-f", "concat",
                "-safe", "0",
                "-i", filelist_str,
                "-c", "copy",
                "-map_metadata", "0",
                "-movflags", "+faststart",
                "-y", output_str,
            ])
            .stderr(Stdio::piped())
            .stdout(Stdio::null())
            .spawn()
            .map_err(|e| {
                let _ = std::fs::remove_file(&filelist_path);
                DomainError::ProcessingError(format!("Erreur de lancement FFmpeg: {}", e))
            })?;

        // Parse stderr for progress and support cancellation during execution
        let start_time = Instant::now();
        let mut last_emit = Instant::now() - std::time::Duration::from_secs(1); // ensure first emit
        let mut last_stderr_lines: Vec<String> = Vec::new();
        if let Some(stderr) = child.stderr.take() {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if cancel_flag.load(Ordering::Relaxed) {
                    let _ = child.kill();
                    let _ = child.wait();
                    let _ = std::fs::remove_file(&filelist_path);
                    let _ = std::fs::remove_file(output_path);
                    return Err(DomainError::OperationCancelled(
                        "Export annulé par l'utilisateur".into(),
                    ));
                }

                if let Ok(line) = line {
                    let elapsed = start_time.elapsed().as_secs_f64();
                    if let Some(info) = Self::parse_progress_line_rich(&line, total_duration_secs, elapsed) {
                        // Throttle: emit at most every 500ms
                        if last_emit.elapsed() >= std::time::Duration::from_millis(500) {
                            on_progress(info);
                            last_emit = Instant::now();
                        }
                    }
                    // Keep last 5 stderr lines for error diagnosis
                    last_stderr_lines.push(line);
                    if last_stderr_lines.len() > 5 {
                        last_stderr_lines.remove(0);
                    }
                }
            }
        }

        let status = child.wait().map_err(|e| {
            let _ = std::fs::remove_file(&filelist_path);
            DomainError::ProcessingError(format!("Erreur d'attente FFmpeg: {}", e))
        })?;

        // Always clean up filelist
        let _ = std::fs::remove_file(&filelist_path);

        if cancel_flag.load(Ordering::Relaxed) {
            let _ = std::fs::remove_file(output_path);
            return Err(DomainError::OperationCancelled(
                "Export annulé par l'utilisateur".into(),
            ));
        }

        if status.success() {
            info!(event = "export_copy_completed", output = %output_path.display());
            Ok(output_path.to_path_buf())
        } else {
            // Clean up partial output file on failure
            let _ = std::fs::remove_file(output_path);
            let stderr_tail = last_stderr_lines.join("\n");
            error!(event = "export_copy_ffmpeg_failed", code = ?status.code(), stderr = %stderr_tail);
            Err(DomainError::ProcessingError(
                format!("FFmpeg export copy a échoué (code: {:?}): {}", status.code(), stderr_tail),
            ))
        }
    }

    /// Export segments with re-encoding using H.264 High profile.
    /// Parses FFmpeg stderr for progress reporting.
    pub fn export_with_reencode(
        segment_paths: &[String],
        output_path: &Path,
        quality: &str,
        total_duration_secs: f64,
        cancel_flag: &Arc<AtomicBool>,
        on_progress: impl Fn(FfmpegProgressInfo) + Send,
    ) -> Result<PathBuf, DomainError> {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err(DomainError::OperationCancelled(
                "Export annulé par l'utilisateur".into(),
            ));
        }

        if segment_paths.is_empty() {
            return Err(DomainError::ProcessingError(
                "Aucun segment à exporter".into(),
            ));
        }

        // Create output directory if needed
        if let Some(parent) = output_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| DomainError::ProcessingError(
                format!("Impossible de créer le dossier de sortie: {}", e),
            ))?;
        }

        let params = Self::encoding_params(quality);

        let filelist_path = output_path.with_extension("filelist.txt");
        let filelist_content = Self::build_filelist(segment_paths);

        info!(
            event = "export_reencode_start",
            segment_count = segment_paths.len(),
            quality = quality,
            crf = params.crf,
            preset = params.preset,
            output = %output_path.display(),
        );

        std::fs::write(&filelist_path, &filelist_content).map_err(|e| {
            DomainError::ProcessingError(format!("Impossible d'écrire le fichier filelist: {}", e))
        })?;

        if cancel_flag.load(Ordering::Relaxed) {
            let _ = std::fs::remove_file(&filelist_path);
            return Err(DomainError::OperationCancelled(
                "Export annulé par l'utilisateur".into(),
            ));
        }

        let ffmpeg = ffmpeg_path();
        let output_str = output_path.to_str().unwrap_or_default();
        let filelist_str = filelist_path.to_str().unwrap_or_default();
        let crf_str = params.crf.to_string();

        let mut child = Command::new(&ffmpeg)
            .args([
                "-f", "concat",
                "-safe", "0",
                "-i", filelist_str,
                "-c:v", "libx264",
                "-profile:v", "high",
                "-level", "4.1",
                "-crf", &crf_str,
                "-preset", params.preset,
                "-c:a", "aac",
                "-b:a", "192k",
                "-map_metadata", "0",
                "-movflags", "+faststart",
                "-y", output_str,
            ])
            .stderr(Stdio::piped())
            .stdout(Stdio::null())
            .spawn()
            .map_err(|e| {
                let _ = std::fs::remove_file(&filelist_path);
                DomainError::ProcessingError(format!("Erreur de lancement FFmpeg: {}", e))
            })?;

        // Parse stderr for progress
        let start_time = Instant::now();
        let mut last_emit = Instant::now() - std::time::Duration::from_secs(1);
        let mut last_stderr_lines: Vec<String> = Vec::new();
        if let Some(stderr) = child.stderr.take() {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if cancel_flag.load(Ordering::Relaxed) {
                    let _ = child.kill();
                    let _ = child.wait();
                    let _ = std::fs::remove_file(&filelist_path);
                    let _ = std::fs::remove_file(output_path);
                    return Err(DomainError::OperationCancelled(
                        "Export annulé par l'utilisateur".into(),
                    ));
                }

                if let Ok(line) = line {
                    let elapsed = start_time.elapsed().as_secs_f64();
                    if let Some(info) = Self::parse_progress_line_rich(&line, total_duration_secs, elapsed) {
                        if last_emit.elapsed() >= std::time::Duration::from_millis(500) {
                            on_progress(info);
                            last_emit = Instant::now();
                        }
                    }
                    // Keep last 5 stderr lines for error diagnosis
                    last_stderr_lines.push(line);
                    if last_stderr_lines.len() > 5 {
                        last_stderr_lines.remove(0);
                    }
                }
            }
        }

        let status = child.wait().map_err(|e| {
            let _ = std::fs::remove_file(&filelist_path);
            DomainError::ProcessingError(format!("Erreur d'attente FFmpeg: {}", e))
        })?;

        // Always clean up filelist
        let _ = std::fs::remove_file(&filelist_path);

        if cancel_flag.load(Ordering::Relaxed) {
            let _ = std::fs::remove_file(output_path);
            return Err(DomainError::OperationCancelled(
                "Export annulé par l'utilisateur".into(),
            ));
        }

        if status.success() {
            info!(event = "export_reencode_completed", output = %output_path.display());
            Ok(output_path.to_path_buf())
        } else {
            // Clean up partial output file on failure
            let _ = std::fs::remove_file(output_path);
            let stderr_tail = last_stderr_lines.join("\n");
            error!(event = "export_reencode_ffmpeg_failed", code = ?status.code(), stderr = %stderr_tail);
            Err(DomainError::ProcessingError(
                format!("FFmpeg export ré-encodage a échoué (code: {:?}): {}", status.code(), stderr_tail),
            ))
        }
    }

    /// Parse a line of FFmpeg stderr output to extract progress info.
    /// Returns (current_time_secs, speed) if parseable (legacy API).
    pub fn parse_progress_line(line: &str, _total_duration: f64) -> Option<(f64, f64)> {
        if !line.contains("time=") {
            return None;
        }

        let current_time = Self::extract_time(line)?;
        let speed = Self::extract_speed(line).unwrap_or(0.0);

        Some((current_time, speed))
    }

    /// Parse a line of FFmpeg stderr output to extract rich progress info.
    pub fn parse_progress_line_rich(line: &str, total_duration: f64, elapsed_secs: f64) -> Option<FfmpegProgressInfo> {
        if !line.contains("time=") {
            return None;
        }

        let current_time = Self::extract_time(line)?;
        let speed = Self::extract_speed(line).unwrap_or(0.0);
        let percent = if total_duration > 0.0 {
            (current_time / total_duration * 100.0).min(100.0)
        } else {
            0.0
        };

        let current_frame = Self::extract_frame(line);
        let fps = Self::extract_fps(line);
        let file_size_bytes = Self::extract_size(line);

        // ETA based on percent and elapsed time
        let eta_secs = if percent > 0.0 && elapsed_secs > 0.0 {
            Some((elapsed_secs / percent * (100.0 - percent)).max(0.0))
        } else {
            None
        };

        // Estimated total bytes based on current size and progress
        let estimated_total_bytes = file_size_bytes.and_then(|size| {
            if percent > 1.0 {
                Some((size as f64 / percent * 100.0) as u64)
            } else {
                None
            }
        });

        // Estimated total frames based on current frame and progress
        let total_frames = current_frame.and_then(|frame| {
            if percent > 1.0 {
                Some((frame as f64 / percent * 100.0) as u64)
            } else {
                None
            }
        });

        Some(FfmpegProgressInfo {
            percent,
            current_time,
            speed,
            current_frame,
            total_frames,
            fps,
            file_size_bytes,
            elapsed_secs,
            eta_secs,
            estimated_total_bytes,
        })
    }

    /// Extract time=HH:MM:SS.xx from an FFmpeg line and convert to seconds.
    fn extract_time(line: &str) -> Option<f64> {
        let time_idx = line.find("time=")?;
        let after_time = &line[time_idx + 5..];
        let end = after_time.find(' ').unwrap_or(after_time.len());
        let time_str = &after_time[..end];

        // Parse HH:MM:SS.xx
        let parts: Vec<&str> = time_str.split(':').collect();
        if parts.len() != 3 {
            return None;
        }

        let hours: f64 = parts[0].parse().ok()?;
        let minutes: f64 = parts[1].parse().ok()?;
        let seconds: f64 = parts[2].parse().ok()?;

        Some(hours * 3600.0 + minutes * 60.0 + seconds)
    }

    /// Extract speed=X.XXx from an FFmpeg line.
    fn extract_speed(line: &str) -> Option<f64> {
        let speed_idx = line.find("speed=")?;
        let after_speed = &line[speed_idx + 6..];
        let end = after_speed.find('x').unwrap_or(after_speed.len());
        let speed_str = after_speed[..end].trim();
        speed_str.parse().ok()
    }

    /// Extract frame= NNN from an FFmpeg line.
    fn extract_frame(line: &str) -> Option<u64> {
        let idx = line.find("frame=")?;
        let after = &line[idx + 6..];
        let trimmed = after.trim_start();
        let end = trimmed.find(|c: char| !c.is_ascii_digit()).unwrap_or(trimmed.len());
        if end == 0 { return None; }
        trimmed[..end].parse().ok()
    }

    /// Extract fps= NN.N from an FFmpeg line.
    fn extract_fps(line: &str) -> Option<f64> {
        let idx = line.find("fps=")?;
        let after = &line[idx + 4..];
        let trimmed = after.trim_start();
        let end = trimmed.find(|c: char| !c.is_ascii_digit() && c != '.').unwrap_or(trimmed.len());
        if end == 0 { return None; }
        trimmed[..end].parse().ok()
    }

    /// Extract size= NNNkB from an FFmpeg line (returns bytes).
    fn extract_size(line: &str) -> Option<u64> {
        let idx = line.find("size=")?;
        let after = &line[idx + 5..];
        let trimmed = after.trim_start();
        let end = trimmed.find(|c: char| !c.is_ascii_digit()).unwrap_or(trimmed.len());
        if end == 0 { return None; }
        let kb: u64 = trimmed[..end].parse().ok()?;
        Some(kb * 1024)
    }

    /// Get encoding parameters for the given quality level.
    fn encoding_params(quality: &str) -> EncodingParams {
        match quality {
            "high" => EncodingParams { crf: 18, preset: "medium" },
            "medium" => EncodingParams { crf: 23, preset: "medium" },
            _ => EncodingParams { crf: 28, preset: "fast" }, // low
        }
    }

    /// Build the content of a concat demuxer filelist.
    pub fn build_filelist(segment_paths: &[String]) -> String {
        segment_paths
            .iter()
            .map(|p| format!("file '{}'", p))
            .collect::<Vec<_>>()
            .join("\n")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_filelist_single() {
        let paths = vec!["/tmp/segment_000.mp4".to_string()];
        let result = VideoExporter::build_filelist(&paths);
        assert_eq!(result, "file '/tmp/segment_000.mp4'");
    }

    #[test]
    fn test_build_filelist_multiple() {
        let paths = vec![
            "/tmp/segment_000.mp4".to_string(),
            "/tmp/segment_001.mp4".to_string(),
        ];
        let result = VideoExporter::build_filelist(&paths);
        assert_eq!(result, "file '/tmp/segment_000.mp4'\nfile '/tmp/segment_001.mp4'");
    }

    #[test]
    fn test_export_with_copy_empty_segments() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let result = VideoExporter::export_with_copy(
            &[],
            Path::new("/tmp/output.mp4"),
            60.0,
            &cancel_flag,
            |_| {},
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Aucun segment"));
    }

    #[test]
    fn test_export_with_copy_cancelled() {
        let cancel_flag = Arc::new(AtomicBool::new(true));
        let result = VideoExporter::export_with_copy(
            &["/tmp/seg.mp4".to_string()],
            Path::new("/tmp/output.mp4"),
            60.0,
            &cancel_flag,
            |_| {},
        );
        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::OperationCancelled(_) => {}
            other => panic!("Expected OperationCancelled, got: {:?}", other),
        }
    }

    #[test]
    fn test_export_with_reencode_empty_segments() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let result = VideoExporter::export_with_reencode(
            &[],
            Path::new("/tmp/output.mp4"),
            "high",
            60.0,
            &cancel_flag,
            |_| {},
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Aucun segment"));
    }

    #[test]
    fn test_export_with_reencode_cancelled() {
        let cancel_flag = Arc::new(AtomicBool::new(true));
        let result = VideoExporter::export_with_reencode(
            &["/tmp/seg.mp4".to_string()],
            Path::new("/tmp/output.mp4"),
            "high",
            60.0,
            &cancel_flag,
            |_| {},
        );
        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::OperationCancelled(_) => {}
            other => panic!("Expected OperationCancelled, got: {:?}", other),
        }
    }

    #[test]
    fn test_parse_progress_line_rich_full() {
        let line = "frame= 1234 fps=45.2 q=28.0 size=   12345kB time=00:01:23.45 bitrate=1234.5kbits/s speed=1.23x";
        let result = VideoExporter::parse_progress_line_rich(line, 120.0, 30.0);
        assert!(result.is_some());
        let info = result.unwrap();
        assert!((info.current_time - 83.45).abs() < 0.01);
        assert!((info.speed - 1.23).abs() < 0.01);
        assert_eq!(info.current_frame, Some(1234));
        assert!((info.fps.unwrap() - 45.2).abs() < 0.1);
        assert_eq!(info.file_size_bytes, Some(12345 * 1024));
        assert!((info.elapsed_secs - 30.0).abs() < 0.01);
        assert!(info.eta_secs.is_some());
        assert!(info.estimated_total_bytes.is_some());
        // Verify total_frames is calculated from current_frame and percent
        assert!(info.total_frames.is_some());
        // percent ≈ 69.5% (83.45/120*100), so total_frames ≈ 1234 / 0.695 ≈ 1775
        let total = info.total_frames.unwrap();
        assert!(total > 1700 && total < 1850, "total_frames {} should be ~1775", total);
    }

    #[test]
    fn test_parse_progress_line_rich_no_time() {
        let line = "configuration: --enable-libx264";
        let result = VideoExporter::parse_progress_line_rich(line, 120.0, 5.0);
        assert!(result.is_none());
    }

    #[test]
    fn test_extract_frame() {
        assert_eq!(VideoExporter::extract_frame("frame= 1234 fps=30"), Some(1234));
        assert_eq!(VideoExporter::extract_frame("no frame here"), None);
    }

    #[test]
    fn test_extract_fps() {
        assert!((VideoExporter::extract_fps("fps=45.2 q=28").unwrap() - 45.2).abs() < 0.01);
        assert!(VideoExporter::extract_fps("no fps").is_none());
    }

    #[test]
    fn test_extract_size() {
        assert_eq!(VideoExporter::extract_size("size=   12345kB time="), Some(12345 * 1024));
        assert!(VideoExporter::extract_size("no size").is_none());
    }

    #[test]
    fn test_eta_calculation() {
        let line = "frame= 500 fps=30 size= 1000kB time=00:01:00.00 speed=2.00x";
        let info = VideoExporter::parse_progress_line_rich(line, 120.0, 30.0).unwrap();
        // 50% done in 30s → ETA ~30s
        assert!(info.eta_secs.is_some());
        assert!((info.eta_secs.unwrap() - 30.0).abs() < 1.0);
    }

    #[test]
    fn test_throttling_logic() {
        // Test that the throttling logic correctly tracks elapsed time
        let throttle_interval = std::time::Duration::from_millis(500);
        let mut last_emit = Instant::now() - std::time::Duration::from_secs(1); // First emit always allowed

        // First call should be allowed (more than 500ms since init)
        assert!(last_emit.elapsed() >= throttle_interval, "First emit should be allowed");
        last_emit = Instant::now();

        // Immediate second call should be blocked
        assert!(last_emit.elapsed() < throttle_interval, "Immediate second emit should be blocked");

        // After waiting, call should be allowed again
        std::thread::sleep(std::time::Duration::from_millis(510));
        assert!(last_emit.elapsed() >= throttle_interval, "Emit after 500ms+ should be allowed");
    }

    #[test]
    fn test_parse_progress_line_valid() {
        let line = "frame= 1234 fps=45.2 q=28.0 size=   12345kB time=00:01:23.45 bitrate=1234.5kbits/s speed=1.23x";
        let result = VideoExporter::parse_progress_line(line, 120.0);
        assert!(result.is_some());
        let (time, speed) = result.unwrap();
        assert!((time - 83.45).abs() < 0.01);
        assert!((speed - 1.23).abs() < 0.01);
    }

    #[test]
    fn test_parse_progress_line_no_time() {
        let line = "configuration: --enable-libx264";
        let result = VideoExporter::parse_progress_line(line, 120.0);
        assert!(result.is_none());
    }

    #[test]
    fn test_parse_progress_line_no_speed() {
        let line = "frame= 100 fps=30 time=00:00:10.00 bitrate=1000kbits/s";
        let result = VideoExporter::parse_progress_line(line, 60.0);
        assert!(result.is_some());
        let (time, speed) = result.unwrap();
        assert!((time - 10.0).abs() < 0.01);
        assert!((speed - 0.0).abs() < 0.01); // no speed= in line
    }

    #[test]
    fn test_encoding_params_high() {
        let params = VideoExporter::encoding_params("high");
        assert_eq!(params.crf, 18);
        assert_eq!(params.preset, "medium");
    }

    #[test]
    fn test_encoding_params_medium() {
        let params = VideoExporter::encoding_params("medium");
        assert_eq!(params.crf, 23);
        assert_eq!(params.preset, "medium");
    }

    #[test]
    fn test_encoding_params_low() {
        let params = VideoExporter::encoding_params("low");
        assert_eq!(params.crf, 28);
        assert_eq!(params.preset, "fast");
    }

    #[test]
    fn test_extract_time_valid() {
        assert!((VideoExporter::extract_time("time=00:01:30.50 ").unwrap() - 90.5).abs() < 0.01);
    }

    #[test]
    fn test_extract_time_zero() {
        assert!((VideoExporter::extract_time("time=00:00:00.00 ").unwrap() - 0.0).abs() < 0.01);
    }

    #[test]
    fn test_extract_speed_valid() {
        assert!((VideoExporter::extract_speed("speed=2.50x").unwrap() - 2.5).abs() < 0.01);
    }
}
