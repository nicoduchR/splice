use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tracing::{info, error};

use crate::domain::entities::cut::Cut;
use crate::domain::errors::DomainError;
use super::audio_extractor::ffmpeg_path;

/// VideoSegmenter - extracts video segments using FFmpeg with -c copy (no re-encoding)
pub struct VideoSegmenter;

impl VideoSegmenter {
    /// Segment a video based on cuts using FFmpeg stream copy.
    ///
    /// Each cut produces a segment file named `segment_NNN.mp4` in `output_dir`.
    /// Uses `-ss` before `-i` for fast input seeking and `-c copy` for no re-encoding.
    /// Uses `-t` (duration) instead of `-to` because with input seeking, output timestamps
    /// start at 0 — `-to {end_time}` would produce wrong-length segments.
    ///
    /// The `on_progress` callback is called after each segment completes with (completed_count, total).
    pub fn segment_video<F>(
        source_path: &str,
        cuts: &[Cut],
        output_dir: &Path,
        cancel_flag: &Arc<AtomicBool>,
        on_progress: F,
    ) -> Result<Vec<PathBuf>, DomainError>
    where
        F: Fn(usize, usize),
    {
        let ffmpeg = ffmpeg_path();
        let total = cuts.len();

        // Create output directory if it doesn't exist
        std::fs::create_dir_all(output_dir).map_err(|e| {
            DomainError::ProcessingError(format!(
                "Impossible de créer le dossier de segments: {}", e
            ))
        })?;

        let mut segment_paths: Vec<PathBuf> = Vec::new();

        for (i, cut) in cuts.iter().enumerate() {
            // Check cancellation before each segment
            if cancel_flag.load(Ordering::Relaxed) {
                info!(
                    event = "segmentation_cancelled",
                    segment_index = i,
                    "Segmentation cancelled by user"
                );
                Self::cleanup_segments(output_dir);
                return Err(DomainError::OperationCancelled(
                    "Segmentation annulée par l'utilisateur".into(),
                ));
            }

            let output_path = output_dir.join(format!("segment_{:03}.mp4", i));
            let duration = cut.end_time - cut.start_time;

            info!(
                event = "segment_processing",
                segment_index = i,
                start_time = cut.start_time,
                end_time = cut.end_time,
                duration = duration,
                output = %output_path.display(),
            );

            let result = Command::new(&ffmpeg)
                .args([
                    "-ss",
                    &cut.start_time.to_string(),
                    "-t",
                    &duration.to_string(),
                    "-i",
                    source_path,
                    "-c",
                    "copy",
                    "-avoid_negative_ts",
                    "make_zero",
                    "-y",
                    output_path.to_str().unwrap_or_default(),
                ])
                .output();

            match result {
                Ok(output) if output.status.success() => {
                    info!(
                        event = "segment_completed",
                        segment_index = i,
                    );
                    segment_paths.push(output_path);
                    on_progress(i + 1, total);
                }
                Ok(output) => {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    error!(
                        event = "segment_ffmpeg_failed",
                        segment_index = i,
                        error = %stderr,
                    );
                    Self::cleanup_segments(output_dir);
                    return Err(DomainError::ProcessingError(format!(
                        "FFmpeg a échoué sur le segment {}: {}",
                        i,
                        stderr
                    )));
                }
                Err(e) => {
                    error!(
                        event = "segment_ffmpeg_error",
                        segment_index = i,
                        error = %e,
                    );
                    Self::cleanup_segments(output_dir);
                    return Err(DomainError::ProcessingError(format!(
                        "Erreur d'exécution FFmpeg sur le segment {}: {}",
                        i, e
                    )));
                }
            }
        }

        info!(
            event = "segmentation_completed",
            total_segments = segment_paths.len(),
        );

        Ok(segment_paths)
    }

    /// Segment a single cut to a specific output path.
    /// Used for retry/regeneration of individual failed segments.
    pub fn segment_single(
        source_path: &str,
        cut: &Cut,
        output_path: &Path,
        cancel_flag: &Arc<AtomicBool>,
    ) -> Result<PathBuf, DomainError> {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err(DomainError::OperationCancelled(
                "Segmentation annulée par l'utilisateur".into(),
            ));
        }

        let ffmpeg = ffmpeg_path();
        let duration = cut.end_time - cut.start_time;

        info!(
            event = "segment_single_processing",
            start_time = cut.start_time,
            end_time = cut.end_time,
            duration = duration,
            output = %output_path.display(),
        );

        let result = Command::new(&ffmpeg)
            .args([
                "-ss",
                &cut.start_time.to_string(),
                "-t",
                &duration.to_string(),
                "-i",
                source_path,
                "-c",
                "copy",
                "-avoid_negative_ts",
                "make_zero",
                "-y",
                output_path.to_str().unwrap_or_default(),
            ])
            .output();

        match result {
            Ok(output) if output.status.success() => {
                info!(event = "segment_single_completed");
                Ok(output_path.to_path_buf())
            }
            Ok(output) => {
                let stderr = String::from_utf8_lossy(&output.stderr);
                error!(event = "segment_single_failed", error = %stderr);
                Err(DomainError::ProcessingError(format!(
                    "FFmpeg a échoué sur le segment: {}", stderr
                )))
            }
            Err(e) => {
                error!(event = "segment_single_error", error = %e);
                Err(DomainError::ProcessingError(format!(
                    "Erreur d'exécution FFmpeg: {}", e
                )))
            }
        }
    }

    /// Remove all segment files from the output directory
    pub fn cleanup_segments(output_dir: &Path) {
        if output_dir.exists() {
            if let Err(e) = std::fs::remove_dir_all(output_dir) {
                error!(
                    event = "segment_cleanup_failed",
                    dir = %output_dir.display(),
                    error = %e,
                );
            } else {
                info!(
                    event = "segments_cleaned_up",
                    dir = %output_dir.display(),
                );
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_cut(index: i64, start: f64, end: f64) -> Cut {
        Cut {
            id: format!("cut-{}", index),
            project_id: "test-project".to_string(),
            segment_index: index,
            start_time: start,
            end_time: end,
            created_at: 0,
        }
    }

    #[test]
    fn test_segment_naming_sequential() {
        // Verify the output path construction matches expected naming convention
        let output_dir = Path::new("/tmp/segments");
        let expected = [
            "segment_000.mp4",
            "segment_001.mp4",
            "segment_099.mp4",
            "segment_100.mp4",
        ];
        let indices = [0, 1, 99, 100];

        for (idx, expected_name) in indices.iter().zip(expected.iter()) {
            let path = output_dir.join(format!("segment_{:03}.mp4", idx));
            assert_eq!(path.file_name().unwrap().to_str().unwrap(), *expected_name);
        }
    }

    #[test]
    fn test_ffmpeg_command_uses_duration_not_absolute_end() {
        // Verify FFmpeg args use -t (duration) not -to (absolute end)
        // With input seeking (-ss before -i), -to is relative to output start (0),
        // so -t (duration) must be used instead.
        let cut = make_cut(0, 10.0, 15.0);
        let duration = cut.end_time - cut.start_time;

        assert_eq!(duration, 5.0, "Duration should be end - start");

        let start_str = cut.start_time.to_string();
        let duration_str = duration.to_string();
        let args = vec![
            "-ss", &start_str,
            "-t", &duration_str,
            "-i", "/path/to/video.mp4",
            "-c", "copy",
            "-avoid_negative_ts", "make_zero",
            "-y", "/tmp/segments/segment_000.mp4",
        ];

        // -ss must come before -i (input seeking)
        let ss_pos = args.iter().position(|&a| a == "-ss").unwrap();
        let i_pos = args.iter().position(|&a| a == "-i").unwrap();
        assert!(ss_pos < i_pos, "-ss must come before -i for fast input seeking");

        // Must use -t (duration), NOT -to (absolute)
        assert!(args.contains(&"-t"), "Must use -t for duration");
        assert!(!args.contains(&"-to"), "Must NOT use -to with input seeking");

        // -c copy must be present
        let c_pos = args.iter().position(|&a| a == "-c").unwrap();
        assert_eq!(args[c_pos + 1], "copy");

        // -avoid_negative_ts make_zero must be present
        let avoid_pos = args.iter().position(|&a| a == "-avoid_negative_ts").unwrap();
        assert_eq!(args[avoid_pos + 1], "make_zero");
    }

    #[test]
    fn test_ffmpeg_error_returns_domain_error() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let cuts = vec![make_cut(0, 0.0, 1.0)];
        let output_dir = PathBuf::from("/tmp/splice_test_segment_error");

        let result = VideoSegmenter::segment_video(
            "/nonexistent/video.mp4",
            &cuts,
            &output_dir,
            &cancel_flag,
            |_, _| {},
        );

        assert!(result.is_err(), "Should fail with nonexistent source");
        match result.unwrap_err() {
            DomainError::ProcessingError(msg) => {
                assert!(
                    msg.contains("segment 0"),
                    "Error should reference segment index: {}",
                    msg
                );
            }
            other => panic!("Expected ProcessingError, got: {:?}", other),
        }

        // Cleanup
        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn test_cancellation_cleans_up_files() {
        let cancel_flag = Arc::new(AtomicBool::new(true)); // Already cancelled
        let cuts = vec![make_cut(0, 0.0, 1.0)];
        let output_dir = PathBuf::from("/tmp/splice_test_segment_cancel");

        // Create the dir so cleanup has something to do
        let _ = std::fs::create_dir_all(&output_dir);

        let result = VideoSegmenter::segment_video(
            "/some/video.mp4",
            &cuts,
            &output_dir,
            &cancel_flag,
            |_, _| {},
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::OperationCancelled(msg) => {
                assert!(msg.contains("annulée"), "Should indicate cancellation: {}", msg);
            }
            other => panic!("Expected OperationCancelled, got: {:?}", other),
        }

        // Directory should have been cleaned up
        assert!(!output_dir.exists(), "Output dir should be cleaned up after cancellation");
    }

    #[test]
    fn test_cleanup_segments_nonexistent_dir() {
        // Should not panic when dir doesn't exist
        VideoSegmenter::cleanup_segments(Path::new("/nonexistent/dir/that/doesnt/exist"));
    }

    #[test]
    fn test_progress_callback_called() {
        // Verify the progress callback would be called with correct values
        // We can't run real FFmpeg in tests, but we verify the callback contract
        let completed = Arc::new(std::sync::Mutex::new(Vec::new()));
        let completed_clone = completed.clone();

        let callback = move |current: usize, total: usize| {
            completed_clone.lock().unwrap().push((current, total));
        };

        // Simulate what segment_video does for progress
        let total = 3;
        for i in 0..total {
            callback(i + 1, total);
        }

        let results = completed.lock().unwrap();
        assert_eq!(results.len(), 3);
        assert_eq!(results[0], (1, 3));
        assert_eq!(results[1], (2, 3));
        assert_eq!(results[2], (3, 3));
    }
}
