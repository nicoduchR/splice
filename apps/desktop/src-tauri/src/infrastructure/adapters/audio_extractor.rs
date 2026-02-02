use std::path::{Path, PathBuf};
use std::process::Command;

/// Resolve the path to the bundled ffmpeg sidecar binary.
/// In dev mode: uses the binaries/ directory relative to CARGO_MANIFEST_DIR.
/// In production: uses the binary next to the current executable.
pub fn ffmpeg_path() -> PathBuf {
    // Try production path first (next to the running binary)
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()));

    if let Some(dir) = &exe_dir {
        let candidate = dir.join("ffmpeg");
        if candidate.exists() {
            return candidate;
        }
    }

    // Dev mode: resolve from CARGO_MANIFEST_DIR
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let target = format!("ffmpeg-{}", std::env::consts::ARCH);
    let dev_path = PathBuf::from(manifest_dir)
        .join("binaries")
        .join(format!("{}-apple-darwin", target));
    if dev_path.exists() {
        return dev_path;
    }

    // Fallback: universal binary
    let universal = PathBuf::from(manifest_dir)
        .join("binaries")
        .join("ffmpeg-universal-apple-darwin");
    if universal.exists() {
        return universal;
    }

    // Last resort: hope it's on PATH
    PathBuf::from("ffmpeg")
}

/// AudioExtractor - handles audio extraction from video files using FFmpeg
pub struct AudioExtractor;

impl AudioExtractor {

    /// Extract audio from video file to WAV format (16kHz mono PCM s16le)
    pub async fn extract_audio(
        video_path: &Path,
        output_path: &Path,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if !video_path.exists() {
            return Err(format!("Le fichier vidéo n'existe pas: {}", video_path.display()).into());
        }

        if !video_path.is_file() {
            return Err(format!("Le chemin vidéo n'est pas un fichier: {}", video_path.display()).into());
        }

        let valid_extensions = ["mp4", "mov", "avi", "mkv", "webm", "flv"];
        let extension = video_path.extension()
            .and_then(|ext| ext.to_str())
            .map(|s| s.to_lowercase());

        if !extension.as_ref().map(|e| valid_extensions.contains(&e.as_str())).unwrap_or(false) {
            return Err(format!(
                "Extension de fichier vidéo non supportée. Extensions valides: {}",
                valid_extensions.join(", ")
            ).into());
        }

        tracing::info!(
            event = "audio_extraction_started",
            video_path = %video_path.display(),
            output_path = %output_path.display(),
        );

        let video_path_str = video_path.to_string_lossy().to_string();
        let output_path_str = output_path.to_string_lossy().to_string();

        let ffmpeg = ffmpeg_path();
        tokio::task::spawn_blocking(move || {
            let output = Command::new(&ffmpeg)
                .args([
                    "-i",
                    &video_path_str,
                    "-vn",
                    "-acodec",
                    "pcm_s16le",
                    "-ac",
                    "1",
                    "-ar",
                    "16000",
                    "-y",
                    &output_path_str,
                ])
                .output()?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("FFmpeg extraction failed: {}", stderr).into());
            }

            tracing::info!(
                event = "audio_extraction_completed",
                output_path = %output_path_str,
            );

            Ok::<_, Box<dyn std::error::Error + Send + Sync>>(())
        })
        .await
        .map_err(|e| format!("Audio extraction task failed: {}", e))??;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_extract_audio_from_video() {
        let test_video = PathBuf::from("tests/fixtures/test_video_5s.mp4");

        if !test_video.exists() {
            eprintln!("Skipping test: test video fixture not found");
            return;
        }

        let output_wav = PathBuf::from("/tmp/test_audio_extract.wav");

        let result = AudioExtractor::extract_audio(&test_video, &output_wav).await;
        assert!(result.is_ok(), "Audio extraction should succeed");

        assert!(
            output_wav.exists(),
            "Output WAV file should exist after extraction"
        );

        std::fs::remove_file(&output_wav).ok();
    }
}
