use std::path::{Path, PathBuf};
use std::process::Command;
use tracing::{info, warn, error};

use crate::domain::entities::segment_validation::SegmentValidation;
use crate::domain::errors::DomainError;

/// Resolve the path to the bundled ffprobe sidecar binary.
/// Same pattern as ffmpeg_path() in audio_extractor.rs.
pub fn ffprobe_path() -> PathBuf {
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()));

    if let Some(dir) = &exe_dir {
        let candidate = dir.join("ffprobe");
        if candidate.exists() {
            return candidate;
        }
    }

    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let target = format!("ffprobe-{}", std::env::consts::ARCH);
    let dev_path = PathBuf::from(manifest_dir)
        .join("binaries")
        .join(format!("{}-apple-darwin", target));
    if dev_path.exists() {
        return dev_path;
    }

    let universal = PathBuf::from(manifest_dir)
        .join("binaries")
        .join("ffprobe-universal-apple-darwin");
    if universal.exists() {
        return universal;
    }

    PathBuf::from("ffprobe")
}

/// SegmentValidator - validates video segments using FFprobe
pub struct SegmentValidator;

impl SegmentValidator {
    /// Validate a single segment file.
    ///
    /// Checks: file exists, FFprobe can read it, duration within tolerance,
    /// codec is H.264 or H.265.
    pub fn validate_segment(
        segment_path: &Path,
        expected_duration: f64,
    ) -> Result<SegmentValidation, DomainError> {
        info!(
            event = "segment_validation_start",
            path = %segment_path.display(),
            expected_duration = expected_duration,
        );

        // Check file exists
        if !segment_path.exists() {
            error!(
                event = "segment_validation_file_not_found",
                path = %segment_path.display(),
            );
            return Err(DomainError::FileNotFound(
                segment_path.display().to_string(),
            ));
        }

        // Run ffprobe
        let ffprobe = ffprobe_path();
        let segment_path_str = segment_path.to_str().ok_or_else(|| {
            DomainError::InvalidFilePath(format!(
                "Chemin non-UTF8: {:?}", segment_path
            ))
        })?;
        let output = Command::new(&ffprobe)
            .args([
                "-v", "error",
                "-show_format",
                "-show_streams",
                "-of", "json",
                segment_path_str,
            ])
            .output()
            .map_err(|e| {
                error!(
                    event = "segment_validation_ffprobe_error",
                    error = %e,
                );
                DomainError::ProcessingError(format!(
                    "Impossible d'exécuter FFprobe: {}", e
                ))
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!(
                event = "segment_validation_ffprobe_failed",
                path = %segment_path.display(),
                error = %stderr,
            );
            return Ok(SegmentValidation {
                path: segment_path.display().to_string(),
                duration: 0.0,
                codec: String::new(),
                width: 0,
                height: 0,
                frame_rate: String::new(),
                is_valid: false,
                error_message: Some(format!("FFprobe a échoué: {}", stderr)),
            });
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let json: serde_json::Value = serde_json::from_str(&stdout).map_err(|e| {
            DomainError::ProcessingError(format!(
                "Impossible de parser la sortie FFprobe: {}", e
            ))
        })?;

        // Extract format duration
        let duration = json["format"]["duration"]
            .as_str()
            .and_then(|s| s.parse::<f64>().ok())
            .unwrap_or(0.0);

        // Find video stream
        let streams = json["streams"].as_array();
        let video_stream = streams
            .and_then(|s| s.iter().find(|s| s["codec_type"].as_str() == Some("video")));

        let (codec, width, height, frame_rate) = match video_stream {
            Some(stream) => {
                let codec = stream["codec_name"]
                    .as_str()
                    .unwrap_or("")
                    .to_string();
                let width = stream["width"].as_u64().unwrap_or(0) as u32;
                let height = stream["height"].as_u64().unwrap_or(0) as u32;
                let frame_rate = stream["r_frame_rate"]
                    .as_str()
                    .unwrap_or("0/1")
                    .to_string();
                (codec, width, height, frame_rate)
            }
            None => {
                return Ok(SegmentValidation {
                    path: segment_path.display().to_string(),
                    duration,
                    codec: String::new(),
                    width: 0,
                    height: 0,
                    frame_rate: String::new(),
                    is_valid: false,
                    error_message: Some("Aucun flux vidéo trouvé dans le segment".into()),
                });
            }
        };

        // Validate codec
        let valid_codecs = ["h264", "hevc", "h265"];
        let codec_valid = valid_codecs.contains(&codec.as_str());

        // Validate duration (±0.5s tolerance)
        let duration_diff = (duration - expected_duration).abs();
        let duration_valid = duration_diff <= 0.5;

        let is_valid = codec_valid && duration_valid;
        let error_message = if !is_valid {
            let mut reasons = Vec::new();
            if !codec_valid {
                reasons.push(format!(
                    "Codec invalide: {} (attendu: H.264/H.265)", codec
                ));
            }
            if !duration_valid {
                reasons.push(format!(
                    "Durée hors tolérance: {:.2}s (attendu: {:.2}s, écart: {:.2}s)",
                    duration, expected_duration, duration_diff
                ));
            }
            Some(reasons.join("; "))
        } else {
            None
        };

        if is_valid {
            info!(
                event = "segment_validation_passed",
                path = %segment_path.display(),
                duration = duration,
                codec = %codec,
            );
        } else {
            warn!(
                event = "segment_validation_failed",
                path = %segment_path.display(),
                error = ?error_message,
            );
        }

        Ok(SegmentValidation {
            path: segment_path.display().to_string(),
            duration,
            codec,
            width,
            height,
            frame_rate,
            is_valid,
            error_message,
        })
    }

    /// Validate that all segments are compatible for concatenation.
    ///
    /// Checks: same codec, same resolution, same frame rate.
    pub fn validate_segments_compatible(
        segments: &[SegmentValidation],
    ) -> Result<(), DomainError> {
        if segments.len() < 2 {
            return Ok(());
        }

        let reference = &segments[0];
        for (i, segment) in segments.iter().enumerate().skip(1) {
            if segment.codec != reference.codec {
                return Err(DomainError::SegmentValidationFailed {
                    segment_index: i,
                    reason: format!(
                        "Codec incompatible: {} vs {} (segment 0)",
                        segment.codec, reference.codec
                    ),
                });
            }
            if segment.width != reference.width || segment.height != reference.height {
                return Err(DomainError::SegmentValidationFailed {
                    segment_index: i,
                    reason: format!(
                        "Résolution incompatible: {}x{} vs {}x{} (segment 0)",
                        segment.width, segment.height,
                        reference.width, reference.height
                    ),
                });
            }
            if segment.frame_rate != reference.frame_rate {
                return Err(DomainError::SegmentValidationFailed {
                    segment_index: i,
                    reason: format!(
                        "Frame rate incompatible: {} vs {} (segment 0)",
                        segment.frame_rate, reference.frame_rate
                    ),
                });
            }
        }

        info!(
            event = "segments_compatibility_validated",
            segment_count = segments.len(),
        );

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_validate_segment_file_not_found() {
        let result = SegmentValidator::validate_segment(
            Path::new("/nonexistent/segment.mp4"),
            5.0,
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::FileNotFound(path) => {
                assert!(path.contains("nonexistent"));
            }
            other => panic!("Expected FileNotFound, got: {:?}", other),
        }
    }

    #[test]
    fn test_validate_segment_valid_file() {
        // Use test fixture if available
        let fixture = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests/fixtures/test_video_5s.mp4");
        if !fixture.exists() {
            // In CI, this fixture should exist. Locally, skip gracefully.
            if std::env::var("CI").is_ok() {
                panic!("Test fixture test_video_5s.mp4 not found in CI — must be provided");
            }
            eprintln!("Skipping test: test_video_5s.mp4 fixture not found (set CI=1 to fail)");
            return;
        }

        let result = SegmentValidator::validate_segment(&fixture, 5.0);
        assert!(result.is_ok());
        let validation = result.unwrap();
        assert!(validation.is_valid, "Valid fixture should pass validation: {:?}", validation.error_message);
        assert!(validation.duration > 0.0);
        assert!(!validation.codec.is_empty());
    }

    #[test]
    fn test_validate_segment_duration_out_of_tolerance() {
        let fixture = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests/fixtures/test_video_5s.mp4");
        if !fixture.exists() {
            // In CI, this fixture should exist. Locally, skip gracefully.
            if std::env::var("CI").is_ok() {
                panic!("Test fixture test_video_5s.mp4 not found in CI — must be provided");
            }
            eprintln!("Skipping test: test_video_5s.mp4 fixture not found (set CI=1 to fail)");
            return;
        }

        // Expect 100s when file is 5s — way out of tolerance
        let result = SegmentValidator::validate_segment(&fixture, 100.0);
        assert!(result.is_ok());
        let validation = result.unwrap();
        assert!(!validation.is_valid);
        assert!(validation.error_message.as_deref().unwrap_or("").contains("Durée hors tolérance"));
    }

    #[test]
    fn test_validate_segments_compatible_same() {
        let segments = vec![
            SegmentValidation {
                path: "seg0.mp4".into(),
                duration: 5.0,
                codec: "h264".into(),
                width: 1920,
                height: 1080,
                frame_rate: "30/1".into(),
                is_valid: true,
                error_message: None,
            },
            SegmentValidation {
                path: "seg1.mp4".into(),
                duration: 3.0,
                codec: "h264".into(),
                width: 1920,
                height: 1080,
                frame_rate: "30/1".into(),
                is_valid: true,
                error_message: None,
            },
        ];

        assert!(SegmentValidator::validate_segments_compatible(&segments).is_ok());
    }

    #[test]
    fn test_validate_segments_compatible_different_resolution() {
        let segments = vec![
            SegmentValidation {
                path: "seg0.mp4".into(),
                duration: 5.0,
                codec: "h264".into(),
                width: 1920,
                height: 1080,
                frame_rate: "30/1".into(),
                is_valid: true,
                error_message: None,
            },
            SegmentValidation {
                path: "seg1.mp4".into(),
                duration: 3.0,
                codec: "h264".into(),
                width: 1280,
                height: 720,
                frame_rate: "30/1".into(),
                is_valid: true,
                error_message: None,
            },
        ];

        let result = SegmentValidator::validate_segments_compatible(&segments);
        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::SegmentValidationFailed { segment_index, reason } => {
                assert_eq!(segment_index, 1);
                assert!(reason.contains("Résolution incompatible"));
            }
            other => panic!("Expected SegmentValidationFailed, got: {:?}", other),
        }
    }

    #[test]
    fn test_validate_segments_single_segment() {
        let segments = vec![
            SegmentValidation {
                path: "seg0.mp4".into(),
                duration: 5.0,
                codec: "h264".into(),
                width: 1920,
                height: 1080,
                frame_rate: "30/1".into(),
                is_valid: true,
                error_message: None,
            },
        ];

        assert!(SegmentValidator::validate_segments_compatible(&segments).is_ok());
    }
}
