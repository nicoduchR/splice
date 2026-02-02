use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use tracing::info;

use crate::domain::errors::DomainError;
use crate::domain::repositories::CutRepository;
use crate::infrastructure::adapters::video_segmenter::VideoSegmenter;

/// SegmentVideoUseCase - orchestrates video segmentation from stored cuts
pub struct SegmentVideoUseCase {
    cut_repository: Arc<dyn CutRepository>,
}

impl SegmentVideoUseCase {
    pub fn new(cut_repository: Arc<dyn CutRepository>) -> Self {
        Self { cut_repository }
    }

    /// Execute video segmentation for a project.
    ///
    /// 1. Retrieves cuts from repository
    /// 2. Validates cuts are not empty
    /// 3. Delegates to VideoSegmenter for FFmpeg processing
    /// 4. Returns list of segment file paths
    pub fn execute(
        &self,
        project_id: &str,
        source_path: &str,
        output_dir: &Path,
        cancel_flag: &Arc<AtomicBool>,
    ) -> Result<Vec<PathBuf>, DomainError> {
        info!(
            event = "segment_video_use_case",
            project_id = %project_id,
            source_path = %source_path,
        );

        // 1. Get cuts ordered by segment_index
        let cuts = self.cut_repository.get_cuts(project_id)?;

        // 2. Validate cuts exist
        if cuts.is_empty() {
            info!(
                event = "segment_video_no_cuts",
                project_id = %project_id,
                "No cuts found for segmentation"
            );
            return Err(DomainError::ProcessingError(
                "Aucun cut trouvé pour la segmentation. Générez d'abord les cuts.".into(),
            ));
        }

        info!(
            event = "segment_video_starting",
            project_id = %project_id,
            cut_count = cuts.len(),
        );

        // 3. Delegate to VideoSegmenter
        let segment_paths = VideoSegmenter::segment_video(
            source_path,
            &cuts,
            output_dir,
            cancel_flag,
            |_, _| {},
        )?;

        info!(
            event = "segment_video_completed",
            project_id = %project_id,
            segment_count = segment_paths.len(),
        );

        Ok(segment_paths)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::entities::cut::Cut;
    use std::sync::Mutex;

    struct MockCutRepo {
        cuts: Mutex<Vec<Cut>>,
    }

    impl MockCutRepo {
        fn new(cuts: Vec<Cut>) -> Self {
            Self { cuts: Mutex::new(cuts) }
        }
    }

    impl CutRepository for MockCutRepo {
        fn save_cuts(&self, _project_id: &str, cuts: Vec<Cut>) -> Result<(), DomainError> {
            *self.cuts.lock().unwrap() = cuts;
            Ok(())
        }
        fn get_cuts(&self, _project_id: &str) -> Result<Vec<Cut>, DomainError> {
            Ok(self.cuts.lock().unwrap().clone())
        }
        fn delete_cuts(&self, _project_id: &str) -> Result<(), DomainError> {
            self.cuts.lock().unwrap().clear();
            Ok(())
        }
    }

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
    fn test_no_cuts_returns_error() {
        let repo = Arc::new(MockCutRepo::new(vec![]));
        let uc = SegmentVideoUseCase::new(repo);
        let cancel_flag = Arc::new(AtomicBool::new(false));

        let result = uc.execute(
            "test-project",
            "/some/video.mp4",
            Path::new("/tmp/segments"),
            &cancel_flag,
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::ProcessingError(msg) => {
                assert!(msg.contains("Aucun cut"), "Should indicate no cuts: {}", msg);
            }
            other => panic!("Expected ProcessingError, got: {:?}", other),
        }
    }

    #[test]
    fn test_valid_cuts_delegates_to_segmenter() {
        // This test verifies the use case calls the segmenter.
        // Since segmenter calls FFmpeg which won't exist in test env,
        // we expect a ProcessingError from FFmpeg failure.
        let cuts = vec![
            make_cut(0, 0.0, 5.0),
            make_cut(1, 10.0, 15.0),
        ];
        let repo = Arc::new(MockCutRepo::new(cuts));
        let uc = SegmentVideoUseCase::new(repo);
        let cancel_flag = Arc::new(AtomicBool::new(false));

        let result = uc.execute(
            "test-project",
            "/nonexistent/video.mp4",
            Path::new("/tmp/splice_test_uc_segments"),
            &cancel_flag,
        );

        // Should fail because FFmpeg can't find the source file
        assert!(result.is_err());

        // Cleanup
        let _ = std::fs::remove_dir_all("/tmp/splice_test_uc_segments");
    }

    #[test]
    fn test_cancellation_mid_process() {
        let cuts = vec![make_cut(0, 0.0, 1.0)];
        let repo = Arc::new(MockCutRepo::new(cuts));
        let uc = SegmentVideoUseCase::new(repo);
        let cancel_flag = Arc::new(AtomicBool::new(true)); // Pre-cancelled

        let result = uc.execute(
            "test-project",
            "/some/video.mp4",
            Path::new("/tmp/splice_test_uc_cancel"),
            &cancel_flag,
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::OperationCancelled(_) => {} // Expected
            other => panic!("Expected OperationCancelled, got: {:?}", other),
        }
    }
}
