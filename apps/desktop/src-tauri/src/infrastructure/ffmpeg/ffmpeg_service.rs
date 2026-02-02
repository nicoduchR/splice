use crate::domain::errors::DomainError;
use crate::infrastructure::ffmpeg::video_metadata::VideoMetadata;
use serde_json::Value;
use std::path::Path;
use std::time::Duration;
use tauri_plugin_shell::ShellExt;
use tokio::time::timeout;
use tracing::{debug, error, info};

pub struct FfmpegService;

impl FfmpegService {
    pub fn new() -> Self {
        Self
    }

    pub async fn probe_video_format<R: tauri::Runtime>(
        &self,
        app: &tauri::AppHandle<R>,
        file_path: &str,
    ) -> Result<VideoMetadata, DomainError> {
        info!("Probing video format with FFmpeg: {}", file_path);

        // Validate file exists
        let path = Path::new(file_path);
        if !path.exists() {
            error!("File not found for FFprobe: {}", file_path);
            return Err(DomainError::FileNotFound(file_path.to_string()));
        }

        debug!("File exists, running FFprobe");

        // Run FFprobe command using sidecar with 10s timeout
        let shell = app.shell();

        let probe_future = async {
            shell
                .sidecar("ffprobe")
                .map_err(|e| {
                    error!("Failed to create ffprobe sidecar: {}", e);
                    DomainError::FfmpegNotAvailable {
                        message: format!("FFprobe sidecar not available: {}", e),
                    }
                })?
                .args(&[
                    "-v",
                    "quiet",
                    "-print_format",
                    "json",
                    "-show_format",
                    "-show_streams",
                    file_path,
                ])
                .output()
                .await
                .map_err(|e| {
                    error!("Failed to execute ffprobe: {}", e);
                    DomainError::FfmpegNotAvailable {
                        message: format!("Failed to run FFprobe: {}", e),
                    }
                })
        };

        let output = timeout(Duration::from_secs(10), probe_future)
            .await
            .map_err(|_| {
                error!("FFprobe timeout after 10 seconds");
                DomainError::VideoCorrupted {
                    details: "FFprobe timeout - file may be corrupted or too large".to_string(),
                }
            })??;

        debug!("FFprobe command executed, parsing output");

        // Check if command succeeded
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!("FFprobe failed: {}", stderr);
            return Err(DomainError::VideoCorrupted {
                details: format!("FFprobe failed: {}", stderr),
            });
        }

        // Parse JSON output
        let stdout = String::from_utf8(output.stdout).map_err(|e| {
            error!("Invalid UTF-8 in FFprobe output: {}", e);
            DomainError::VideoCorrupted {
                details: "Invalid FFprobe output encoding".to_string(),
            }
        })?;

        debug!("FFprobe output: {}", stdout);

        let json: Value = serde_json::from_str(&stdout).map_err(|e| {
            error!("Failed to parse FFprobe JSON: {}", e);
            DomainError::VideoCorrupted {
                details: format!("Invalid FFprobe JSON output: {}", e),
            }
        })?;

        // Extract video stream
        let streams = json["streams"].as_array().ok_or_else(|| {
            error!("No streams found in FFprobe output");
            DomainError::VideoCorrupted {
                details: "No streams found in video file".to_string(),
            }
        })?;

        let video_stream = streams
            .iter()
            .find(|s| s["codec_type"] == "video")
            .ok_or_else(|| {
                error!("No video stream found");
                DomainError::VideoCorrupted {
                    details: "No video stream found in file".to_string(),
                }
            })?;

        // Extract and validate codec
        let codec_name = video_stream["codec_name"]
            .as_str()
            .ok_or_else(|| {
                error!("Missing codec_name in video stream");
                DomainError::VideoCorrupted {
                    details: "Missing codec information".to_string(),
                }
            })?
            .to_string();

        debug!("Detected codec: {}", codec_name);

        // Validate codec is supported (H.264 or H.265/HEVC)
        let supported_codecs = vec!["h264", "hevc", "h265"];
        if !supported_codecs.contains(&codec_name.as_str()) {
            error!("Unsupported codec: {}", codec_name);
            return Err(DomainError::UnsupportedVideoCodec {
                codec: codec_name.clone(),
                supported: vec!["H.264".to_string(), "H.265/HEVC".to_string()],
            });
        }

        // Extract metadata
        let width = video_stream["width"].as_u64().map(|w| w as u32);
        let height = video_stream["height"].as_u64().map(|h| h as u32);

        debug!("Video resolution: {:?}x{:?}", width, height);

        // Extract duration from format section (more reliable)
        let duration = json["format"]["duration"]
            .as_str()
            .and_then(|d| d.parse::<f64>().ok())
            .or_else(|| {
                // Fallback to stream duration if format duration not available
                video_stream["duration"]
                    .as_str()
                    .and_then(|d| d.parse::<f64>().ok())
            })
            .ok_or_else(|| {
                error!("No duration found in FFprobe output");
                DomainError::VideoCorrupted {
                    details: "Missing video duration - file may be corrupted".to_string(),
                }
            })?;

        // Validate duration is positive
        if duration <= 0.0 {
            error!("Invalid duration: {}", duration);
            return Err(DomainError::VideoCorrupted {
                details: format!("Invalid video duration: {}s", duration),
            });
        }

        debug!("Video duration: {}s", duration);

        // Extract file size
        let file_size = json["format"]["size"]
            .as_str()
            .and_then(|s| s.parse::<u64>().ok())
            .ok_or_else(|| {
                error!("No file size found in FFprobe output");
                DomainError::VideoCorrupted {
                    details: "Missing file size - FFprobe output incomplete".to_string(),
                }
            })?;

        // Validate file size is positive
        if file_size == 0 {
            error!("File size is 0 bytes");
            return Err(DomainError::VideoCorrupted {
                details: "File size is 0 bytes - file may be empty or corrupted".to_string(),
            });
        }

        debug!("File size: {} bytes", file_size);

        info!(
            "Successfully probed video: codec={}, duration={}s",
            codec_name, duration
        );

        Ok(VideoMetadata {
            codec_name,
            codec_type: "video".to_string(),
            width,
            height,
            duration,
            file_size,
        })
    }
}

impl Default for FfmpegService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_FIXTURES_DIR: &str = "test-assets/fixtures";

    #[tokio::test]
    async fn test_probe_video_format_file_not_found() {
        let service = FfmpegService::new();
        let app = tauri::test::mock_app();
        let app_handle = app.handle();

        let result = service.probe_video_format(app_handle, "/nonexistent/video.mp4").await;

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), DomainError::FileNotFound(_)));
    }

    #[tokio::test]
    async fn test_probe_video_format_h264_success() {
        let service = FfmpegService::new();
        let app = tauri::test::mock_app();
        let app_handle = app.handle();

        let fixture_path = format!("{}/sample-h264.mp4", TEST_FIXTURES_DIR);
        let result = service.probe_video_format(app_handle, &fixture_path).await;

        assert!(result.is_ok(), "H.264 validation should succeed");
        let metadata = result.unwrap();
        assert_eq!(metadata.codec_name, "h264", "Codec should be h264");
        assert!(metadata.duration > 0.0, "Duration should be positive");
        assert!(metadata.file_size > 0, "File size should be positive");
        assert_eq!(metadata.width, Some(320), "Width should be 320");
        assert_eq!(metadata.height, Some(240), "Height should be 240");
    }

    #[tokio::test]
    async fn test_probe_video_format_h265_mov_success() {
        let service = FfmpegService::new();
        let app = tauri::test::mock_app();

        let fixture_path = format!("{}/sample-h265.mov", TEST_FIXTURES_DIR);
        let result = service.probe_video_format(&app, &fixture_path).await;

        assert!(result.is_ok(), "H.265 MOV validation should succeed");
        let metadata = result.unwrap();
        // FFmpeg reports H.265 as "hevc"
        assert!(
            metadata.codec_name == "hevc" || metadata.codec_name == "h265",
            "Codec should be hevc or h265, got: {}",
            metadata.codec_name
        );
        assert!(metadata.duration > 0.0, "Duration should be positive");
        assert!(metadata.file_size > 0, "File size should be positive");
    }

    #[tokio::test]
    async fn test_probe_video_format_h265_mp4_success() {
        let service = FfmpegService::new();
        let app = tauri::test::mock_app();

        let fixture_path = format!("{}/sample-h265.mp4", TEST_FIXTURES_DIR);
        let result = service.probe_video_format(&app, &fixture_path).await;

        assert!(result.is_ok(), "H.265 MP4 validation should succeed");
        let metadata = result.unwrap();
        assert!(
            metadata.codec_name == "hevc" || metadata.codec_name == "h265",
            "Codec should be hevc or h265"
        );
    }

    #[tokio::test]
    async fn test_probe_video_format_unsupported_codec_vp9() {
        let service = FfmpegService::new();
        let app = tauri::test::mock_app();

        let fixture_path = format!("{}/sample-vp9.webm", TEST_FIXTURES_DIR);
        let result = service.probe_video_format(&app, &fixture_path).await;

        assert!(result.is_err(), "VP9 should be rejected");
        match result.unwrap_err() {
            DomainError::UnsupportedVideoCodec { codec, supported } => {
                assert_eq!(codec, "vp9", "Codec should be vp9");
                assert!(supported.contains(&"H.264".to_string()));
                assert!(supported.contains(&"H.265/HEVC".to_string()));
            }
            other => panic!("Expected UnsupportedVideoCodec, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_probe_video_format_corrupted_file() {
        let service = FfmpegService::new();
        let app = tauri::test::mock_app();

        let fixture_path = format!("{}/corrupted.mp4", TEST_FIXTURES_DIR);
        let result = service.probe_video_format(&app, &fixture_path).await;

        assert!(result.is_err(), "Corrupted file should be rejected");
        assert!(
            matches!(result.unwrap_err(), DomainError::VideoCorrupted { .. }),
            "Should return VideoCorrupted error"
        );
    }

    #[test]
    fn test_ffmpeg_service_creation() {
        let service = FfmpegService::new();
        // Test basique pour vérifier la création du service
        assert_eq!(std::mem::size_of_val(&service), 0); // Zero-sized type
    }
}
