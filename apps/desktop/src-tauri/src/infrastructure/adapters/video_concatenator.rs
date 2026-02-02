use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tracing::{info, error};

use crate::domain::errors::DomainError;
use super::audio_extractor::ffmpeg_path;

/// VideoConcatenator - concatenates video segments using FFmpeg concat demuxer (no re-encoding)
pub struct VideoConcatenator;

impl VideoConcatenator {
    /// Concatenate multiple video segments into a single output file.
    ///
    /// Uses FFmpeg concat demuxer (`-f concat -safe 0 -c copy`) for lossless concatenation.
    /// Creates a temporary `filelist.txt` in the same directory as the output, then cleans it up.
    pub fn concatenate(
        segment_paths: &[String],
        output_path: &Path,
        cancel_flag: &Arc<AtomicBool>,
    ) -> Result<PathBuf, DomainError> {
        if cancel_flag.load(Ordering::Relaxed) {
            return Err(DomainError::OperationCancelled(
                "Concaténation annulée par l'utilisateur".into(),
            ));
        }

        if segment_paths.is_empty() {
            return Err(DomainError::ConcatenationFailed {
                reason: "Aucun segment à concaténer".into(),
            });
        }

        // Create output directory if needed
        if let Some(parent) = output_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| DomainError::ConcatenationFailed {
                reason: format!("Impossible de créer le dossier de sortie: {}", e),
            })?;
        }

        // Build filelist.txt in the output directory
        let filelist_path = output_path.with_extension("filelist.txt");
        let filelist_content = Self::build_filelist(segment_paths);

        info!(
            event = "concatenation_start",
            segment_count = segment_paths.len(),
            output = %output_path.display(),
        );

        std::fs::write(&filelist_path, &filelist_content).map_err(|e| {
            DomainError::ConcatenationFailed {
                reason: format!("Impossible d'écrire le fichier filelist: {}", e),
            }
        })?;

        // Check cancellation before FFmpeg
        if cancel_flag.load(Ordering::Relaxed) {
            let _ = std::fs::remove_file(&filelist_path);
            return Err(DomainError::OperationCancelled(
                "Concaténation annulée par l'utilisateur".into(),
            ));
        }

        let ffmpeg = ffmpeg_path();
        let result = Command::new(&ffmpeg)
            .args([
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                filelist_path.to_str().unwrap_or_default(),
                "-c",
                "copy",
                "-y",
                output_path.to_str().unwrap_or_default(),
            ])
            .output();

        // Always clean up filelist
        let _ = std::fs::remove_file(&filelist_path);

        match result {
            Ok(output) if output.status.success() => {
                info!(
                    event = "concatenation_completed",
                    output = %output_path.display(),
                );
                Ok(output_path.to_path_buf())
            }
            Ok(output) => {
                let stderr = String::from_utf8_lossy(&output.stderr);
                error!(
                    event = "concatenation_ffmpeg_failed",
                    error = %stderr,
                );
                Err(DomainError::ConcatenationFailed {
                    reason: format!("FFmpeg concat a échoué: {}", stderr),
                })
            }
            Err(e) => {
                error!(
                    event = "concatenation_ffmpeg_error",
                    error = %e,
                );
                Err(DomainError::ConcatenationFailed {
                    reason: format!("Erreur d'exécution FFmpeg: {}", e),
                })
            }
        }
    }

    /// Build the content of a concat demuxer filelist.
    fn build_filelist(segment_paths: &[String]) -> String {
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
        let result = VideoConcatenator::build_filelist(&paths);
        assert_eq!(result, "file '/tmp/segment_000.mp4'");
    }

    #[test]
    fn test_build_filelist_multiple() {
        let paths = vec![
            "/tmp/segment_000.mp4".to_string(),
            "/tmp/segment_001.mp4".to_string(),
            "/tmp/segment_002.mp4".to_string(),
        ];
        let result = VideoConcatenator::build_filelist(&paths);
        assert_eq!(
            result,
            "file '/tmp/segment_000.mp4'\nfile '/tmp/segment_001.mp4'\nfile '/tmp/segment_002.mp4'"
        );
    }

    #[test]
    fn test_concatenate_empty_segments_returns_error() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let result = VideoConcatenator::concatenate(
            &[],
            Path::new("/tmp/output.mp4"),
            &cancel_flag,
        );
        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::ConcatenationFailed { reason } => {
                assert!(reason.contains("Aucun segment"), "Got: {}", reason);
            }
            other => panic!("Expected ConcatenationFailed, got: {:?}", other),
        }
    }

    #[test]
    fn test_concatenate_cancelled_before_start() {
        let cancel_flag = Arc::new(AtomicBool::new(true));
        let result = VideoConcatenator::concatenate(
            &["/tmp/seg.mp4".to_string()],
            Path::new("/tmp/output.mp4"),
            &cancel_flag,
        );
        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::OperationCancelled(_) => {}
            other => panic!("Expected OperationCancelled, got: {:?}", other),
        }
    }

    #[test]
    fn test_concatenate_ffmpeg_error_with_nonexistent_files() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let output_dir = PathBuf::from("/tmp/splice_test_concat_error");
        let output_path = output_dir.join("output.mp4");

        let result = VideoConcatenator::concatenate(
            &["/nonexistent/segment_000.mp4".to_string()],
            &output_path,
            &cancel_flag,
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::ConcatenationFailed { reason } => {
                assert!(!reason.is_empty(), "Should have error reason");
            }
            other => panic!("Expected ConcatenationFailed, got: {:?}", other),
        }

        // Cleanup
        let _ = std::fs::remove_dir_all(&output_dir);
    }
}
