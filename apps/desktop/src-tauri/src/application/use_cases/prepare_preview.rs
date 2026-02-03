use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use tracing::{info, warn};
use serde::{Deserialize, Serialize};

use crate::domain::errors::DomainError;
use crate::infrastructure::adapters::video_concatenator::VideoConcatenator;
use crate::infrastructure::adapters::audio_extractor::ffmpeg_path;

/// Manifest for tracking preview cache validity
#[derive(Debug, Serialize, Deserialize)]
pub struct PreviewManifest {
    pub segments_hash: String,
    pub created_at: u64,
    pub preview_path: String,
}

/// PreparePreviewUseCase - creates or returns cached preview file from segments
pub struct PreparePreviewUseCase;

impl PreparePreviewUseCase {
    /// Compute a hash of segment paths to detect changes
    fn compute_segments_hash(segment_paths: &[String]) -> String {
        let mut hasher = DefaultHasher::new();
        for path in segment_paths {
            path.hash(&mut hasher);
        }
        format!("{:016x}", hasher.finish())
    }

    /// Get the preview directory for a project
    fn preview_dir(project_id: &str) -> Result<PathBuf, DomainError> {
        let home = dirs::home_dir().ok_or_else(|| {
            DomainError::ProcessingError("Impossible de trouver le répertoire home".into())
        })?;
        Ok(home.join(".splice").join("temp").join(project_id).join("preview"))
    }

    /// Read existing manifest if it exists
    fn read_manifest(manifest_path: &Path) -> Option<PreviewManifest> {
        std::fs::read_to_string(manifest_path)
            .ok()
            .and_then(|content| serde_json::from_str(&content).ok())
    }

    /// Write manifest to disk
    fn write_manifest(manifest_path: &Path, manifest: &PreviewManifest) -> Result<(), DomainError> {
        let content = serde_json::to_string_pretty(manifest).map_err(|e| {
            DomainError::ProcessingError(format!("Impossible de sérialiser le manifest: {}", e))
        })?;
        std::fs::write(manifest_path, content).map_err(|e| {
            DomainError::ProcessingError(format!("Impossible d'écrire le manifest: {}", e))
        })
    }

    /// Apply -movflags +faststart to optimize seeking (moov atom at beginning of file)
    fn apply_faststart(input_path: &Path, output_path: &Path) -> Result<(), DomainError> {
        let ffmpeg = ffmpeg_path();
        let result = std::process::Command::new(&ffmpeg)
            .args([
                "-i",
                input_path.to_str().ok_or_else(|| {
                    DomainError::ProcessingError("Chemin d'entrée contient des caractères invalides".into())
                })?,
                "-c",
                "copy",
                "-movflags",
                "+faststart",
                "-y",
                output_path.to_str().ok_or_else(|| {
                    DomainError::ProcessingError("Chemin de sortie contient des caractères invalides".into())
                })?,
            ])
            .output();

        match result {
            Ok(output) if output.status.success() => Ok(()),
            Ok(output) => {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(DomainError::ProcessingError(format!(
                    "FFmpeg faststart a échoué: {}",
                    stderr
                )))
            }
            Err(e) => Err(DomainError::ProcessingError(format!(
                "Erreur d'exécution FFmpeg faststart: {}",
                e
            ))),
        }
    }

    /// Prepare a preview file from segment paths.
    ///
    /// Returns the path to the preview file (cached or newly created).
    /// Uses cache based on segment paths hash to avoid unnecessary re-concatenation.
    pub fn execute(
        project_id: &str,
        segment_paths: &[String],
        cancel_flag: &Arc<AtomicBool>,
    ) -> Result<PathBuf, DomainError> {
        if segment_paths.is_empty() {
            return Err(DomainError::ProcessingError(
                "Aucun segment disponible pour le preview".into(),
            ));
        }

        let preview_dir = Self::preview_dir(project_id)?;
        std::fs::create_dir_all(&preview_dir).map_err(|e| {
            DomainError::ProcessingError(format!(
                "Impossible de créer le dossier preview: {}",
                e
            ))
        })?;

        let manifest_path = preview_dir.join("preview_manifest.json");
        let preview_path = preview_dir.join("preview.mp4");
        let segments_hash = Self::compute_segments_hash(segment_paths);

        // Check cache: if manifest exists, hash matches, and file exists → return cached
        if let Some(manifest) = Self::read_manifest(&manifest_path) {
            if manifest.segments_hash == segments_hash && preview_path.exists() {
                info!(
                    event = "preview_cache_hit",
                    project_id = %project_id,
                    hash = %segments_hash,
                );
                return Ok(preview_path);
            }
            info!(
                event = "preview_cache_miss",
                project_id = %project_id,
                old_hash = %manifest.segments_hash,
                new_hash = %segments_hash,
            );
        }

        // Cache miss: concatenate segments into preview file
        info!(
            event = "preview_concatenation_start",
            project_id = %project_id,
            segment_count = segment_paths.len(),
        );

        // First concatenate to a temp file
        let temp_concat_path = preview_dir.join("preview_temp.mp4");
        VideoConcatenator::concatenate(segment_paths, &temp_concat_path, cancel_flag)?;

        // Apply faststart for better seeking
        if let Err(e) = Self::apply_faststart(&temp_concat_path, &preview_path) {
            let _ = std::fs::remove_file(&temp_concat_path);
            return Err(e);
        }

        // Remove temp file
        let _ = std::fs::remove_file(&temp_concat_path);

        // Write manifest
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let manifest = PreviewManifest {
            segments_hash: segments_hash.clone(),
            created_at: now,
            preview_path: preview_path.to_string_lossy().to_string(),
        };
        Self::write_manifest(&manifest_path, &manifest)?;

        info!(
            event = "preview_ready",
            project_id = %project_id,
            preview_path = %preview_path.display(),
        );

        Ok(preview_path)
    }

    /// Invalidate the preview cache for a project
    pub fn invalidate_cache(project_id: &str) -> Result<(), DomainError> {
        let preview_dir = Self::preview_dir(project_id)?;
        if preview_dir.exists() {
            std::fs::remove_dir_all(&preview_dir).map_err(|e| {
                DomainError::ProcessingError(format!(
                    "Impossible de supprimer le cache preview: {}",
                    e
                ))
            })?;
            info!(
                event = "preview_cache_invalidated",
                project_id = %project_id,
            );
        }
        Ok(())
    }

    /// Validate preview file using FFprobe: check duration, stream presence, and basic sanity.
    ///
    /// Verifies:
    /// - File exists and has duration > 0
    /// - At least one video stream is present
    /// - Duration is reasonable given segment count (each segment should contribute > 0.05s)
    pub fn validate_preview(preview_path: &Path, expected_segment_count: usize) -> Result<(), DomainError> {
        use crate::infrastructure::adapters::segment_validator::ffprobe_path;

        if !preview_path.exists() {
            return Err(DomainError::ProcessingError(
                "Le fichier preview n'existe pas".into(),
            ));
        }

        let preview_path_str = preview_path.to_str().ok_or_else(|| {
            DomainError::ProcessingError("Chemin du preview contient des caractères invalides".into())
        })?;

        let ffprobe = ffprobe_path();
        let result = std::process::Command::new(&ffprobe)
            .args([
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-show_entries",
                "stream=codec_name,codec_type",
                "-of",
                "json",
                preview_path_str,
            ])
            .output();

        match result {
            Ok(output) if output.status.success() => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let json: serde_json::Value = serde_json::from_str(&stdout).map_err(|e| {
                    DomainError::ProcessingError(format!("FFprobe JSON invalide: {}", e))
                })?;

                // Check duration
                let duration: f64 = json["format"]["duration"]
                    .as_str()
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(0.0);

                if duration <= 0.0 {
                    return Err(DomainError::ProcessingError(
                        "Le fichier preview a une durée invalide (0s)".into(),
                    ));
                }

                // Sanity check: duration should be reasonable for segment count
                // Each segment should contribute at least ~0.05s
                if expected_segment_count > 0 {
                    let min_expected_duration = expected_segment_count as f64 * 0.05;
                    if duration < min_expected_duration {
                        warn!(
                            event = "preview_validation_duration_warning",
                            duration = duration,
                            expected_segments = expected_segment_count,
                            min_expected = min_expected_duration,
                            "Preview duration seems too short for segment count"
                        );
                    }
                }

                // Check that at least one video stream exists
                let has_video = json["streams"]
                    .as_array()
                    .map(|streams| {
                        streams.iter().any(|s| s["codec_type"].as_str() == Some("video"))
                    })
                    .unwrap_or(false);

                if !has_video {
                    return Err(DomainError::ProcessingError(
                        "Le fichier preview ne contient aucun flux vidéo".into(),
                    ));
                }

                info!(
                    event = "preview_validation_passed",
                    duration = duration,
                    expected_segments = expected_segment_count,
                    has_video = has_video,
                );

                Ok(())
            }
            Ok(output) => {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(DomainError::ProcessingError(format!(
                    "FFprobe validation échouée: {}",
                    stderr
                )))
            }
            Err(e) => {
                warn!(
                    event = "preview_validation_skipped",
                    error = %e,
                    "FFprobe non disponible, validation ignorée"
                );
                // Don't fail if ffprobe is unavailable - preview still works
                Ok(())
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_segments_hash_consistent() {
        let paths = vec!["/a/seg_000.mp4".to_string(), "/a/seg_001.mp4".to_string()];
        let h1 = PreparePreviewUseCase::compute_segments_hash(&paths);
        let h2 = PreparePreviewUseCase::compute_segments_hash(&paths);
        assert_eq!(h1, h2, "Same segments should produce same hash");
    }

    #[test]
    fn test_compute_segments_hash_different_for_different_segments() {
        let paths_a = vec!["/a/seg_000.mp4".to_string()];
        let paths_b = vec!["/a/seg_001.mp4".to_string()];
        let ha = PreparePreviewUseCase::compute_segments_hash(&paths_a);
        let hb = PreparePreviewUseCase::compute_segments_hash(&paths_b);
        assert_ne!(ha, hb, "Different segments should produce different hash");
    }

    #[test]
    fn test_compute_segments_hash_order_matters() {
        let paths_a = vec!["/a/seg_000.mp4".to_string(), "/a/seg_001.mp4".to_string()];
        let paths_b = vec!["/a/seg_001.mp4".to_string(), "/a/seg_000.mp4".to_string()];
        let ha = PreparePreviewUseCase::compute_segments_hash(&paths_a);
        let hb = PreparePreviewUseCase::compute_segments_hash(&paths_b);
        assert_ne!(ha, hb, "Different order should produce different hash");
    }

    #[test]
    fn test_preview_dir_contains_project_id() {
        let dir = PreparePreviewUseCase::preview_dir("test-project-123").unwrap();
        let dir_str = dir.to_string_lossy();
        assert!(dir_str.contains("test-project-123"), "Dir should contain project ID");
        assert!(dir_str.contains("preview"), "Dir should contain 'preview'");
    }

    #[test]
    fn test_execute_empty_segments_returns_error() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let result = PreparePreviewUseCase::execute("test", &[], &cancel_flag);
        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::ProcessingError(msg) => {
                assert!(msg.contains("Aucun segment"), "Got: {}", msg);
            }
            other => panic!("Expected ProcessingError, got: {:?}", other),
        }
    }

    #[test]
    fn test_execute_cancelled_returns_error() {
        let cancel_flag = Arc::new(AtomicBool::new(true));
        let segments = vec!["/nonexistent/seg.mp4".to_string()];
        let result = PreparePreviewUseCase::execute("test", &segments, &cancel_flag);
        assert!(result.is_err());
    }

    #[test]
    fn test_manifest_serialization_roundtrip() {
        let manifest = PreviewManifest {
            segments_hash: "abc123".to_string(),
            created_at: 1700000000,
            preview_path: "/tmp/preview.mp4".to_string(),
        };
        let json = serde_json::to_string(&manifest).unwrap();
        let deserialized: PreviewManifest = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.segments_hash, "abc123");
        assert_eq!(deserialized.created_at, 1700000000);
        assert_eq!(deserialized.preview_path, "/tmp/preview.mp4");
    }

    #[test]
    fn test_invalidate_cache_nonexistent_dir_is_ok() {
        // Should not fail when dir doesn't exist
        let result = PreparePreviewUseCase::invalidate_cache("nonexistent-project-xyz");
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_preview_nonexistent_file_returns_error() {
        let result = PreparePreviewUseCase::validate_preview(
            Path::new("/nonexistent/preview.mp4"),
            3,
        );
        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::ProcessingError(msg) => {
                assert!(msg.contains("n'existe pas"), "Got: {}", msg);
            }
            other => panic!("Expected ProcessingError, got: {:?}", other),
        }
    }

    #[test]
    fn test_read_manifest_nonexistent_returns_none() {
        let result = PreparePreviewUseCase::read_manifest(Path::new("/nonexistent/manifest.json"));
        assert!(result.is_none());
    }

    #[test]
    fn test_read_manifest_invalid_json_returns_none() {
        let temp_dir = std::env::temp_dir().join("splice_test_manifest_invalid");
        let _ = std::fs::create_dir_all(&temp_dir);
        let manifest_path = temp_dir.join("invalid_manifest.json");
        std::fs::write(&manifest_path, "not valid json").unwrap();

        let result = PreparePreviewUseCase::read_manifest(&manifest_path);
        assert!(result.is_none());

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
