use std::path::{Path, PathBuf};
use std::process::Command;
use tracing::{info, error};
use super::audio_extractor::ffmpeg_path;

/// ProxyGenerator - generates lightweight 720p proxy videos for smooth playback
pub struct ProxyGenerator;

impl ProxyGenerator {

    /// Generate a 720p proxy video for smooth playback.
    /// Returns None if video is already ≤720p or if generation fails (graceful fallback).
    pub async fn generate_proxy(
        video_path: &Path,
        project_id: &str,
        _width: Option<u32>,
        height: Option<u32>,
        app_data_dir: &Path,
    ) -> Result<Option<PathBuf>, String> {
        // AC #6: No proxy needed if video is already ≤720p
        // When height is unknown, assume large video and generate proxy (safer default)
        if height.unwrap_or(u32::MAX) <= 720 {
            info!(
                event = "proxy_skipped",
                project_id = %project_id,
                height = ?height,
                "Video is ≤720p, no proxy needed"
            );
            return Ok(None);
        }

        let proxies_dir = app_data_dir.join("proxies");
        if let Err(e) = std::fs::create_dir_all(&proxies_dir) {
            error!(event = "proxy_dir_creation_failed", error = %e);
            return Ok(None);
        }

        let proxy_path = proxies_dir.join(format!("{}_proxy.mp4", project_id));

        let video_path_str = video_path.to_string_lossy().to_string();
        let proxy_path_str = proxy_path.to_string_lossy().to_string();
        let project_id_owned = project_id.to_string();

        info!(
            event = "proxy_generation_started",
            project_id = %project_id,
            video_path = %video_path.display(),
            proxy_path = %proxy_path.display(),
        );

        let ffmpeg = ffmpeg_path();
        let result = tokio::task::spawn_blocking(move || {
            let output = Command::new(&ffmpeg)
                .args([
                    "-i",
                    &video_path_str,
                    "-vf",
                    "scale=-2:720",
                    "-c:v",
                    "libx264",
                    "-preset",
                    "fast",
                    "-crf",
                    "28",
                    "-c:a",
                    "copy",
                    "-y",
                    &proxy_path_str,
                ])
                .output();

            match output {
                Ok(out) if out.status.success() => {
                    info!(
                        event = "proxy_generation_completed",
                        project_id = %project_id_owned,
                        proxy_path = %proxy_path_str,
                    );
                    Ok(Some(PathBuf::from(proxy_path_str)))
                }
                Ok(out) => {
                    let stderr = String::from_utf8_lossy(&out.stderr);
                    error!(
                        event = "proxy_generation_failed",
                        project_id = %project_id_owned,
                        error = %stderr,
                    );
                    // AC #7: Graceful fallback - return None instead of error
                    Ok(None)
                }
                Err(e) => {
                    error!(
                        event = "proxy_ffmpeg_error",
                        project_id = %project_id_owned,
                        error = %e,
                    );
                    Ok(None)
                }
            }
        })
        .await
        .map_err(|e| format!("Proxy generation task failed: {}", e))?;

        result
    }

    /// Clean up proxy file for a given project
    pub fn cleanup_proxy(project_id: &str, app_data_dir: &Path) -> Result<(), String> {
        let proxy_path = app_data_dir
            .join("proxies")
            .join(format!("{}_proxy.mp4", project_id));

        if proxy_path.exists() {
            std::fs::remove_file(&proxy_path).map_err(|e| {
                error!(event = "proxy_cleanup_failed", project_id = %project_id, error = %e);
                format!("Failed to delete proxy: {}", e)
            })?;
            info!(event = "proxy_cleaned_up", project_id = %project_id);
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_proxy_skipped_for_720p_or_less() {
        let result = ProxyGenerator::generate_proxy(
            Path::new("/fake/video.mp4"),
            "test-id",
            Some(1280),
            Some(720),
            Path::new("/tmp"),
        )
        .await;

        assert!(result.is_ok());
        assert!(result.unwrap().is_none(), "Should skip proxy for 720p video");
    }

    #[tokio::test]
    async fn test_proxy_skipped_for_less_than_720p() {
        let result = ProxyGenerator::generate_proxy(
            Path::new("/fake/video.mp4"),
            "test-id",
            Some(640),
            Some(480),
            Path::new("/tmp"),
        )
        .await;

        assert!(result.is_ok());
        assert!(result.unwrap().is_none(), "Should skip proxy for 480p video");
    }

    #[tokio::test]
    async fn test_proxy_attempted_when_height_unknown() {
        // When height is unknown, proxy generation should be attempted (not skipped)
        // since the video might be >720p. It will gracefully fail due to invalid path.
        let result = ProxyGenerator::generate_proxy(
            Path::new("/nonexistent/unknown_height.mp4"),
            "test-unknown-height",
            None,
            None,
            Path::new("/tmp/splice_test_unknown_height"),
        )
        .await;

        // Should attempt generation and gracefully return None on FFmpeg failure
        assert!(result.is_ok());
        assert!(result.unwrap().is_none(), "Should gracefully return None on FFmpeg failure");

        // Cleanup
        let _ = std::fs::remove_dir_all("/tmp/splice_test_unknown_height");
    }

    #[tokio::test]
    async fn test_proxy_graceful_failure_invalid_path() {
        let result = ProxyGenerator::generate_proxy(
            Path::new("/nonexistent/video.mp4"),
            "test-id",
            Some(3840),
            Some(2160),
            Path::new("/tmp/splice_test_proxies"),
        )
        .await;

        // AC #7: Should return Ok(None) on failure, not an error
        assert!(result.is_ok());
        assert!(result.unwrap().is_none(), "Should gracefully return None on FFmpeg failure");

        // Cleanup
        let _ = std::fs::remove_dir_all("/tmp/splice_test_proxies");
    }

    #[test]
    fn test_cleanup_proxy_nonexistent_file() {
        let result = ProxyGenerator::cleanup_proxy("nonexistent-id", Path::new("/tmp"));
        assert!(result.is_ok(), "Cleanup should succeed even if file doesn't exist");
    }
}
