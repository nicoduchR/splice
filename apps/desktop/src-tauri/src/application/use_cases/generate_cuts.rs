use crate::domain::entities::cut::Cut;
use crate::domain::errors::DomainError;
use crate::domain::repositories::{CutRepository, SelectionRepository};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::info;

/// Margin in seconds added before/after each selection for natural transitions (FR20)
const MARGIN_SECONDS: f64 = 0.1;

/// GenerateCuts Use Case - convert text selections into video cut segments
pub struct GenerateCutsUseCase {
    selection_repository: Arc<dyn SelectionRepository>,
    cut_repository: Arc<dyn CutRepository>,
}

impl GenerateCutsUseCase {
    pub fn new(
        selection_repository: Arc<dyn SelectionRepository>,
        cut_repository: Arc<dyn CutRepository>,
    ) -> Self {
        Self {
            selection_repository,
            cut_repository,
        }
    }

    pub fn execute(&self, project_id: &str) -> Result<Vec<Cut>, DomainError> {
        info!(
            event = "generate_cuts_use_case",
            project_id = %project_id,
        );

        // 1. Get selections ordered by start_word_index ASC
        let selections = self.selection_repository.get_selections(project_id)?;

        if selections.is_empty() {
            info!(
                event = "generate_cuts_empty",
                project_id = %project_id,
                "No selections found, clearing existing cuts"
            );
            self.cut_repository.save_cuts(project_id, vec![])?;
            return Ok(vec![]);
        }

        // 2. Convert selections to raw cuts with margins
        let mut raw_cuts: Vec<(f64, f64)> = selections
            .iter()
            .map(|s| {
                let start = (s.start_time - MARGIN_SECONDS).max(0.0);
                let end = s.end_time + MARGIN_SECONDS;
                (start, end)
            })
            .collect();

        // 3. Merge overlapping/adjacent cuts
        let mut merged: Vec<(f64, f64)> = Vec::new();
        for (start, end) in raw_cuts.drain(..) {
            if let Some(last) = merged.last_mut() {
                if last.1 >= start {
                    // Overlapping or adjacent — merge
                    last.1 = last.1.max(end);
                    continue;
                }
            }
            merged.push((start, end));
        }

        // 4. Build Cut entities with sequential segment_index
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        let cuts: Vec<Cut> = merged
            .into_iter()
            .enumerate()
            .map(|(i, (start, end))| Cut {
                id: uuid::Uuid::new_v4().to_string(),
                project_id: project_id.to_string(),
                segment_index: i as i64,
                start_time: start,
                end_time: end,
                created_at: now,
            })
            .collect();

        info!(
            event = "cuts_generated",
            project_id = %project_id,
            selection_count = selections.len(),
            cut_count = cuts.len(),
        );

        // 5. Save cuts (atomic bulk replace)
        self.cut_repository.save_cuts(project_id, cuts.clone())?;

        Ok(cuts)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::entities::selection::Selection;
    use std::sync::Mutex;

    struct MockSelectionRepo {
        selections: Mutex<Vec<Selection>>,
    }

    impl MockSelectionRepo {
        fn new(selections: Vec<Selection>) -> Self {
            Self { selections: Mutex::new(selections) }
        }
    }

    impl SelectionRepository for MockSelectionRepo {
        fn save_selections(&self, _project_id: &str, selections: Vec<Selection>) -> Result<(), DomainError> {
            *self.selections.lock().unwrap() = selections;
            Ok(())
        }
        fn get_selections(&self, _project_id: &str) -> Result<Vec<Selection>, DomainError> {
            Ok(self.selections.lock().unwrap().clone())
        }
        fn delete_selection(&self, _id: &str) -> Result<(), DomainError> { Ok(()) }
        fn delete_all_selections(&self, _project_id: &str) -> Result<(), DomainError> { Ok(()) }
    }

    struct MockCutRepo {
        cuts: Mutex<Vec<Cut>>,
    }

    impl MockCutRepo {
        fn new() -> Self {
            Self { cuts: Mutex::new(vec![]) }
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

    fn make_selection(start_time: f64, end_time: f64) -> Selection {
        Selection {
            id: uuid::Uuid::new_v4().to_string(),
            project_id: "project-1".to_string(),
            start_word_index: 0,
            end_word_index: 5,
            start_time,
            end_time,
            created_at: 1706745600,
        }
    }

    #[test]
    fn test_single_selection_produces_cut_with_margins() {
        let sel_repo = Arc::new(MockSelectionRepo::new(vec![
            make_selection(1.0, 3.0),
        ]));
        let cut_repo = Arc::new(MockCutRepo::new());
        let uc = GenerateCutsUseCase::new(sel_repo, cut_repo.clone());

        let cuts = uc.execute("project-1").unwrap();
        assert_eq!(cuts.len(), 1);
        assert!((cuts[0].start_time - 0.9).abs() < f64::EPSILON);
        assert!((cuts[0].end_time - 3.1).abs() < f64::EPSILON);
        assert_eq!(cuts[0].segment_index, 0);
    }

    #[test]
    fn test_margin_clamped_to_zero() {
        let sel_repo = Arc::new(MockSelectionRepo::new(vec![
            make_selection(0.05, 1.0),
        ]));
        let cut_repo = Arc::new(MockCutRepo::new());
        let uc = GenerateCutsUseCase::new(sel_repo, cut_repo);

        let cuts = uc.execute("project-1").unwrap();
        assert_eq!(cuts.len(), 1);
        assert!((cuts[0].start_time - 0.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_non_overlapping_selections_produce_separate_cuts() {
        let sel_repo = Arc::new(MockSelectionRepo::new(vec![
            make_selection(1.0, 2.0),
            make_selection(5.0, 6.0),
        ]));
        let cut_repo = Arc::new(MockCutRepo::new());
        let uc = GenerateCutsUseCase::new(sel_repo, cut_repo);

        let cuts = uc.execute("project-1").unwrap();
        assert_eq!(cuts.len(), 2);
        assert_eq!(cuts[0].segment_index, 0);
        assert_eq!(cuts[1].segment_index, 1);
        assert!((cuts[0].start_time - 0.9).abs() < f64::EPSILON);
        assert!((cuts[1].start_time - 4.9).abs() < f64::EPSILON);
    }

    #[test]
    fn test_overlapping_selections_merge_into_one_cut() {
        // Selections close enough that margins cause overlap
        let sel_repo = Arc::new(MockSelectionRepo::new(vec![
            make_selection(1.0, 2.0),
            make_selection(2.05, 3.0), // After margins: cut1 ends at 2.1, cut2 starts at 1.95 → overlap
        ]));
        let cut_repo = Arc::new(MockCutRepo::new());
        let uc = GenerateCutsUseCase::new(sel_repo, cut_repo);

        let cuts = uc.execute("project-1").unwrap();
        assert_eq!(cuts.len(), 1);
        assert!((cuts[0].start_time - 0.9).abs() < f64::EPSILON);
        assert!((cuts[0].end_time - 3.1).abs() < f64::EPSILON);
    }

    #[test]
    fn test_no_selections_returns_empty() {
        let sel_repo = Arc::new(MockSelectionRepo::new(vec![]));
        let cut_repo = Arc::new(MockCutRepo::new());
        let uc = GenerateCutsUseCase::new(sel_repo, cut_repo);

        let cuts = uc.execute("project-1").unwrap();
        assert_eq!(cuts.len(), 0);
    }

    #[test]
    fn test_performance_100_selections_under_1s() {
        let selections: Vec<Selection> = (0..100)
            .map(|i| {
                let start = i as f64 * 10.0;
                make_selection(start, start + 2.0)
            })
            .collect();

        let sel_repo = Arc::new(MockSelectionRepo::new(selections));
        let cut_repo = Arc::new(MockCutRepo::new());
        let uc = GenerateCutsUseCase::new(sel_repo, cut_repo);

        let start = std::time::Instant::now();
        let cuts = uc.execute("project-1").unwrap();
        let elapsed = start.elapsed();

        assert_eq!(cuts.len(), 100);
        assert!(elapsed.as_secs() < 1, "Generation took {:?}, expected < 1s", elapsed);
    }
}
