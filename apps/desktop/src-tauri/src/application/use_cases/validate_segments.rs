use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use tracing::{info, warn, error};

use crate::domain::entities::cut::Cut;
use crate::domain::entities::segment_validation::SegmentValidation;
use crate::domain::errors::DomainError;
use crate::infrastructure::adapters::segment_validator::SegmentValidator;
use crate::infrastructure::adapters::video_segmenter::VideoSegmenter;

const MAX_RETRIES: usize = 2;

/// ValidateSegmentsUseCase - validates segments and retries failed ones
pub struct ValidateSegmentsUseCase;

impl ValidateSegmentsUseCase {
    /// Validate all segments, retrying failed ones up to MAX_RETRIES times.
    ///
    /// For each segment:
    /// 1. Validate with FFprobe
    /// 2. If invalid, regenerate using VideoSegmenter::segment_single
    /// 3. Re-validate after regeneration
    /// 4. After all segments validated, check compatibility
    pub fn execute<F>(
        segment_paths: &[String],
        cuts: &[Cut],
        source_path: &str,
        cancel_flag: &Arc<AtomicBool>,
        on_progress: F,
    ) -> Result<Vec<SegmentValidation>, DomainError>
    where
        F: Fn(usize, usize),
    {
        if segment_paths.len() != cuts.len() {
            return Err(DomainError::ProcessingError(format!(
                "Nombre de segments ({}) différent du nombre de cuts ({})",
                segment_paths.len(),
                cuts.len()
            )));
        }

        info!(
            event = "validate_segments_start",
            segment_count = segment_paths.len(),
        );

        let mut validations: Vec<SegmentValidation> = Vec::new();

        for (i, segment_path) in segment_paths.iter().enumerate() {
            // Check cancellation before each validation
            if cancel_flag.load(std::sync::atomic::Ordering::Relaxed) {
                info!(event = "validation_cancelled", segment_index = i);
                return Err(DomainError::OperationCancelled(
                    "Validation annulée par l'utilisateur".into(),
                ));
            }

            on_progress(i, segment_paths.len());

            let path = Path::new(segment_path);
            let expected_duration = cuts[i].end_time - cuts[i].start_time;

            let mut validation = SegmentValidator::validate_segment(path, expected_duration)?;

            // Retry logic for invalid segments
            if !validation.is_valid && i < cuts.len() {
                for attempt in 1..=MAX_RETRIES {
                    warn!(
                        event = "segment_regeneration_attempt",
                        segment_index = i,
                        attempt = attempt,
                        reason = ?validation.error_message,
                    );

                    // Regenerate
                    match VideoSegmenter::segment_single(
                        source_path,
                        &cuts[i],
                        path,
                        cancel_flag,
                    ) {
                        Ok(_) => {
                            // Re-validate
                            validation = SegmentValidator::validate_segment(path, expected_duration)?;
                            if validation.is_valid {
                                info!(
                                    event = "segment_regeneration_success",
                                    segment_index = i,
                                    attempt = attempt,
                                );
                                break;
                            }
                        }
                        Err(e) => {
                            error!(
                                event = "segment_regeneration_failed",
                                segment_index = i,
                                attempt = attempt,
                                error = %e,
                            );
                        }
                    }

                    if attempt == MAX_RETRIES && !validation.is_valid {
                        return Err(DomainError::SegmentRegenerationFailed {
                            segment_index: i,
                            attempts: MAX_RETRIES,
                        });
                    }
                }
            }

            validations.push(validation);
        }

        // Check compatibility between all valid segments
        SegmentValidator::validate_segments_compatible(&validations)?;

        on_progress(segment_paths.len(), segment_paths.len());

        info!(
            event = "validate_segments_completed",
            valid_count = validations.len(),
        );

        Ok(validations)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

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
    fn test_validate_nonexistent_segment_returns_error() {
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let paths = vec!["/nonexistent/segment_000.mp4".to_string()];
        let cuts = vec![make_cut(0, 0.0, 5.0)];

        let result = ValidateSegmentsUseCase::execute(
            &paths,
            &cuts,
            "/some/video.mp4",
            &cancel_flag,
            |_, _| {},
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            DomainError::FileNotFound(_) => {}
            other => panic!("Expected FileNotFound, got: {:?}", other),
        }
    }

    #[test]
    fn test_validate_valid_segments() {
        let fixture = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests/fixtures/test_video_5s.mp4");
        if !fixture.exists() {
            if std::env::var("CI").is_ok() {
                panic!("Test fixture test_video_5s.mp4 not found in CI — must be provided");
            }
            eprintln!("Skipping test: test_video_5s.mp4 fixture not found (set CI=1 to fail)");
            return;
        }

        let cancel_flag = Arc::new(AtomicBool::new(false));
        let paths = vec![fixture.to_string_lossy().to_string()];
        let cuts = vec![make_cut(0, 0.0, 5.0)];

        let result = ValidateSegmentsUseCase::execute(
            &paths,
            &cuts,
            &fixture.to_string_lossy(),
            &cancel_flag,
            |_, _| {},
        );

        assert!(result.is_ok());
        let validations = result.unwrap();
        assert_eq!(validations.len(), 1);
        assert!(validations[0].is_valid);
    }
}
