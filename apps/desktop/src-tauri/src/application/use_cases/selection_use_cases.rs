use crate::domain::entities::selection::Selection;
use crate::domain::errors::DomainError;
use crate::domain::repositories::SelectionRepository;
use std::sync::Arc;
use tracing::info;

/// SaveSelections Use Case - bulk replace all selections for a project
pub struct SaveSelectionsUseCase {
    selection_repository: Arc<dyn SelectionRepository>,
}

impl SaveSelectionsUseCase {
    pub fn new(selection_repository: Arc<dyn SelectionRepository>) -> Self {
        Self { selection_repository }
    }

    pub fn execute(&self, project_id: &str, selections: Vec<Selection>) -> Result<(), DomainError> {
        info!(
            event = "save_selections_use_case",
            project_id = %project_id,
            count = selections.len(),
        );
        self.selection_repository.save_selections(project_id, selections)
    }
}

/// GetSelections Use Case - load all selections for a project
pub struct GetSelectionsUseCase {
    selection_repository: Arc<dyn SelectionRepository>,
}

impl GetSelectionsUseCase {
    pub fn new(selection_repository: Arc<dyn SelectionRepository>) -> Self {
        Self { selection_repository }
    }

    pub fn execute(&self, project_id: &str) -> Result<Vec<Selection>, DomainError> {
        info!(
            event = "get_selections_use_case",
            project_id = %project_id,
        );
        self.selection_repository.get_selections(project_id)
    }
}

/// ClearSelections Use Case - delete all selections for a project
pub struct ClearSelectionsUseCase {
    selection_repository: Arc<dyn SelectionRepository>,
}

impl ClearSelectionsUseCase {
    pub fn new(selection_repository: Arc<dyn SelectionRepository>) -> Self {
        Self { selection_repository }
    }

    pub fn execute(&self, project_id: &str) -> Result<(), DomainError> {
        info!(
            event = "clear_selections_use_case",
            project_id = %project_id,
        );
        self.selection_repository.delete_all_selections(project_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    struct MockSelectionRepository {
        selections: Mutex<Vec<Selection>>,
    }

    impl MockSelectionRepository {
        fn new() -> Self {
            Self { selections: Mutex::new(vec![]) }
        }
    }

    impl SelectionRepository for MockSelectionRepository {
        fn save_selections(&self, _project_id: &str, selections: Vec<Selection>) -> Result<(), DomainError> {
            *self.selections.lock().unwrap() = selections;
            Ok(())
        }

        fn get_selections(&self, _project_id: &str) -> Result<Vec<Selection>, DomainError> {
            Ok(self.selections.lock().unwrap().clone())
        }

        fn delete_selection(&self, id: &str) -> Result<(), DomainError> {
            self.selections.lock().unwrap().retain(|s| s.id != id);
            Ok(())
        }

        fn delete_all_selections(&self, _project_id: &str) -> Result<(), DomainError> {
            self.selections.lock().unwrap().clear();
            Ok(())
        }
    }

    #[test]
    fn test_save_selections_use_case() {
        let repo = Arc::new(MockSelectionRepository::new());
        let use_case = SaveSelectionsUseCase::new(repo.clone());

        let selections = vec![
            Selection {
                id: "sel-1".to_string(),
                project_id: "project-1".to_string(),
                start_word_index: 0,
                end_word_index: 5,
                start_time: 0.0,
                end_time: 2.5,
                created_at: 1706745600,
            },
        ];

        let result = use_case.execute("project-1", selections);
        assert!(result.is_ok());

        let stored = repo.selections.lock().unwrap();
        assert_eq!(stored.len(), 1);
        assert_eq!(stored[0].id, "sel-1");
    }

    #[test]
    fn test_get_selections_use_case() {
        let repo = Arc::new(MockSelectionRepository::new());

        // Pre-populate
        repo.selections.lock().unwrap().push(Selection {
            id: "sel-1".to_string(),
            project_id: "project-1".to_string(),
            start_word_index: 0,
            end_word_index: 5,
            start_time: 0.0,
            end_time: 2.5,
            created_at: 1706745600,
        });

        let use_case = GetSelectionsUseCase::new(repo);
        let result = use_case.execute("project-1").unwrap();
        assert_eq!(result.len(), 1);
    }

    #[test]
    fn test_clear_selections_use_case() {
        let repo = Arc::new(MockSelectionRepository::new());

        repo.selections.lock().unwrap().push(Selection {
            id: "sel-1".to_string(),
            project_id: "project-1".to_string(),
            start_word_index: 0,
            end_word_index: 5,
            start_time: 0.0,
            end_time: 2.5,
            created_at: 1706745600,
        });

        let use_case = ClearSelectionsUseCase::new(repo.clone());
        use_case.execute("project-1").unwrap();

        let stored = repo.selections.lock().unwrap();
        assert_eq!(stored.len(), 0);
    }
}
