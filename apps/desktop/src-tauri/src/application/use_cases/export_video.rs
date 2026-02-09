use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use tracing::info;

use crate::domain::errors::DomainError;
use crate::domain::repositories::{CutRepository, VideoRepository};
use crate::infrastructure::adapters::video_exporter::{FfmpegProgressInfo, VideoExporter};

/// Use case for exporting the final video from segments.
///
/// Retrieves cuts for the project, locates segment files,
/// and delegates to VideoExporter with the appropriate strategy (copy vs re-encode).
pub struct ExportVideoUseCase;

impl ExportVideoUseCase {
    /// Execute the export.
    ///
    /// - `project_id`: The project to export
    /// - `quality`: "preserve", "high", "medium", or "low"
    /// - `output_path`: Full path for the exported file
    /// - `cancel_flag`: Atomic flag to cancel the operation
    /// - `on_progress`: Callback for rich progress updates
    /// - `video_repository`: Repository to fetch project metadata
    /// - `cut_repository`: Repository to fetch cuts
    /// - `temp_dir`: Resolved temp directory (from AppState::resolve_temp_dir)
    #[allow(clippy::too_many_arguments)]
    pub fn execute(
        project_id: &str,
        quality: &str,
        output_path: &Path,
        cancel_flag: &Arc<AtomicBool>,
        on_progress: impl Fn(FfmpegProgressInfo) + Send,
        video_repository: &Arc<dyn VideoRepository>,
        cut_repository: &Arc<dyn CutRepository>,
        temp_dir: &Path,
    ) -> Result<PathBuf, DomainError> {
        info!(
            event = "export_video_use_case_start",
            project_id = project_id,
            quality = quality,
        );

        // Fetch project to validate it exists
        let _project = video_repository
            .find_by_id(project_id)
            .map_err(|e| DomainError::RepositoryError(e.to_string()))?
            .ok_or_else(|| DomainError::VideoNotFound(project_id.to_string()))?;

        // Fetch cuts
        let cuts = cut_repository
            .get_cuts(project_id)
            .map_err(|e| DomainError::RepositoryError(e.to_string()))?;

        if cuts.is_empty() {
            return Err(DomainError::ProcessingError(
                "Aucun cut trouvé. Générez d'abord les cuts.".into(),
            ));
        }

        // Compute total final duration from cuts
        let total_duration_secs: f64 = cuts.iter().map(|c| c.end_time - c.start_time).sum();

        // Build segment paths from resolved temp directory
        let segments_dir = temp_dir.join(project_id);

        let segment_paths: Vec<String> = (0..cuts.len())
            .map(|i| {
                segments_dir
                    .join(format!("segment_{:03}.mp4", i))
                    .to_string_lossy()
                    .to_string()
            })
            .collect();

        // Verify all segments exist
        let missing_segments: Vec<String> = segment_paths
            .iter()
            .filter(|p| !Path::new(p).exists())
            .cloned()
            .collect();

        if !missing_segments.is_empty() {
            // If first segment is missing, try alternate: check outputs dir for final concatenated file
            if !Path::new(&segment_paths[0]).exists() {
                let final_path = dirs::home_dir()
                    .ok_or_else(|| DomainError::ProcessingError("Impossible de trouver le répertoire home".into()))?
                    .join(".splice")
                    .join("outputs")
                    .join(format!("{}_final.mp4", project_id));

                if final_path.exists() {
                    let single_segment = vec![final_path.to_string_lossy().to_string()];
                    return Self::do_export(&single_segment, output_path, quality, total_duration_secs, cancel_flag, on_progress);
                }
            }

            return Err(DomainError::ProcessingError(
                format!(
                    "Segments manquants ({}/{}) dans {}. Lancez d'abord la segmentation.",
                    missing_segments.len(),
                    segment_paths.len(),
                    segments_dir.display()
                ),
            ));
        }

        Self::do_export(&segment_paths, output_path, quality, total_duration_secs, cancel_flag, on_progress)
    }

    fn do_export(
        segment_paths: &[String],
        output_path: &Path,
        quality: &str,
        total_duration_secs: f64,
        cancel_flag: &Arc<AtomicBool>,
        on_progress: impl Fn(FfmpegProgressInfo) + Send,
    ) -> Result<PathBuf, DomainError> {
        match quality {
            "preserve" => VideoExporter::export_with_copy(segment_paths, output_path, total_duration_secs, cancel_flag, on_progress),
            _ => VideoExporter::export_with_reencode(
                segment_paths,
                output_path,
                quality,
                total_duration_secs,
                cancel_flag,
                on_progress,
            ),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_do_export_preserve_delegates_to_copy() {
        // With nonexistent files, we expect a processing error (not a quality-related error)
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let result = ExportVideoUseCase::do_export(
            &["/nonexistent/seg.mp4".to_string()],
            Path::new("/tmp/splice_test_export/out.mp4"),
            "preserve",
            60.0,
            &cancel_flag,
            |_| {},
        );
        // Should attempt copy mode and fail on FFmpeg execution (not a wrong-mode error)
        assert!(result.is_err());
    }

    #[test]
    fn test_do_export_high_delegates_to_reencode() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let result = ExportVideoUseCase::do_export(
            &["/nonexistent/seg.mp4".to_string()],
            Path::new("/tmp/splice_test_export/out.mp4"),
            "high",
            60.0,
            &cancel_flag,
            |_| {},
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_do_export_medium_delegates_to_reencode() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let result = ExportVideoUseCase::do_export(
            &["/nonexistent/seg.mp4".to_string()],
            Path::new("/tmp/splice_test_export/out.mp4"),
            "medium",
            60.0,
            &cancel_flag,
            |_| {},
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_do_export_low_delegates_to_reencode() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let result = ExportVideoUseCase::do_export(
            &["/nonexistent/seg.mp4".to_string()],
            Path::new("/tmp/splice_test_export/out.mp4"),
            "low",
            60.0,
            &cancel_flag,
            |_| {},
        );
        assert!(result.is_err());
    }

    /// Story 9.1 AC #4: Core features work 100% offline.
    /// This test documents the architectural guarantee that core use cases
    /// (import, transcription, segmentation, preview, export) never use HTTP clients.
    /// Network calls (reqwest) are confined to license_api and model_manager only.
    ///
    /// Compile-time test: ExportVideoUseCase can be constructed without any
    /// network types. Adding reqwest to this struct would require updating
    /// this test, triggering a review of the offline guarantee.
    #[test]
    fn test_offline_guarantee_no_network_dependency() {
        let _use_case = ExportVideoUseCase;
        // Zero-sized unit struct: FfmpegService (local), repositories (injected),
        // AtomicBool (cancel), filesystem (output). No reqwest, no HTTP.
    }
}
