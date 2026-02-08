use crate::domain::entities::project_state::ProjectState;
use crate::domain::errors::DomainError;
use crate::domain::repositories::ProjectStateRepository;
use std::sync::Arc;
use tracing::info;

/// SaveProjectState Use Case - save or update the project state (auto-save)
pub struct SaveProjectStateUseCase {
    repository: Arc<dyn ProjectStateRepository>,
}

impl SaveProjectStateUseCase {
    pub fn new(repository: Arc<dyn ProjectStateRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, state: &ProjectState) -> Result<(), DomainError> {
        info!(
            event = "save_project_state_use_case",
            project_id = ?state.project_id,
        );
        self.repository.save_project_state(state)
    }
}

/// LoadProjectState Use Case - load the current project state
pub struct LoadProjectStateUseCase {
    repository: Arc<dyn ProjectStateRepository>,
}

impl LoadProjectStateUseCase {
    pub fn new(repository: Arc<dyn ProjectStateRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self) -> Result<Option<ProjectState>, DomainError> {
        info!(event = "load_project_state_use_case");
        self.repository.load_project_state()
    }
}

/// MarkCleanShutdown Use Case - mark the app as having shut down cleanly
pub struct MarkCleanShutdownUseCase {
    repository: Arc<dyn ProjectStateRepository>,
}

impl MarkCleanShutdownUseCase {
    pub fn new(repository: Arc<dyn ProjectStateRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self) -> Result<(), DomainError> {
        info!(event = "mark_clean_shutdown_use_case");
        self.repository.mark_clean_shutdown()
    }
}

/// CheckDirtyShutdown Use Case - check if the last shutdown was dirty (crash)
pub struct CheckDirtyShutdownUseCase {
    repository: Arc<dyn ProjectStateRepository>,
}

impl CheckDirtyShutdownUseCase {
    pub fn new(repository: Arc<dyn ProjectStateRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self) -> Result<bool, DomainError> {
        info!(event = "check_dirty_shutdown_use_case");
        self.repository.check_dirty_shutdown()
    }
}

/// ResetCleanShutdown Use Case - reset the clean shutdown flag at startup
pub struct ResetCleanShutdownUseCase {
    repository: Arc<dyn ProjectStateRepository>,
}

impl ResetCleanShutdownUseCase {
    pub fn new(repository: Arc<dyn ProjectStateRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self) -> Result<(), DomainError> {
        info!(event = "reset_clean_shutdown_use_case");
        self.repository.reset_clean_shutdown()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    struct MockProjectStateRepository {
        state: Mutex<Option<ProjectState>>,
    }

    impl MockProjectStateRepository {
        fn new() -> Self {
            Self { state: Mutex::new(None) }
        }
    }

    impl ProjectStateRepository for MockProjectStateRepository {
        fn save_project_state(&self, state: &ProjectState) -> Result<(), DomainError> {
            *self.state.lock().unwrap() = Some(state.clone());
            Ok(())
        }

        fn load_project_state(&self) -> Result<Option<ProjectState>, DomainError> {
            Ok(self.state.lock().unwrap().clone())
        }

        fn mark_clean_shutdown(&self) -> Result<(), DomainError> {
            if let Some(ref mut s) = *self.state.lock().unwrap() {
                s.was_clean_shutdown = true;
            }
            Ok(())
        }

        fn check_dirty_shutdown(&self) -> Result<bool, DomainError> {
            Ok(self.state.lock().unwrap().as_ref().map_or(false, |s| {
                !s.was_clean_shutdown && s.project_id.is_some()
            }))
        }

        fn reset_clean_shutdown(&self) -> Result<(), DomainError> {
            if let Some(ref mut s) = *self.state.lock().unwrap() {
                s.was_clean_shutdown = false;
            }
            Ok(())
        }
    }

    #[test]
    fn test_save_project_state_use_case() {
        let repo = Arc::new(MockProjectStateRepository::new());
        let use_case = SaveProjectStateUseCase::new(repo.clone());

        let state = ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 42.5,
            volume: 0.8,
            last_saved_at: Some(1706745600),
            was_clean_shutdown: false,
        };

        let result = use_case.execute(&state);
        assert!(result.is_ok());

        let stored = repo.state.lock().unwrap();
        assert!(stored.is_some());
        assert_eq!(stored.as_ref().unwrap().project_id, Some("project-1".to_string()));
    }

    #[test]
    fn test_load_project_state_use_case() {
        let repo = Arc::new(MockProjectStateRepository::new());

        // Pre-populate
        *repo.state.lock().unwrap() = Some(ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 10.0,
            volume: 1.0,
            last_saved_at: Some(1706745600),
            was_clean_shutdown: true,
        });

        let use_case = LoadProjectStateUseCase::new(repo);
        let result = use_case.execute().unwrap();
        assert!(result.is_some());
        assert_eq!(result.unwrap().timeline_position, 10.0);
    }

    #[test]
    fn test_load_project_state_empty() {
        let repo = Arc::new(MockProjectStateRepository::new());
        let use_case = LoadProjectStateUseCase::new(repo);
        let result = use_case.execute().unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_mark_clean_shutdown_use_case() {
        let repo = Arc::new(MockProjectStateRepository::new());

        *repo.state.lock().unwrap() = Some(ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 0.0,
            volume: 1.0,
            last_saved_at: None,
            was_clean_shutdown: false,
        });

        let use_case = MarkCleanShutdownUseCase::new(repo.clone());
        use_case.execute().unwrap();

        let stored = repo.state.lock().unwrap();
        assert!(stored.as_ref().unwrap().was_clean_shutdown);
    }

    #[test]
    fn test_check_dirty_shutdown_use_case() {
        let repo = Arc::new(MockProjectStateRepository::new());

        *repo.state.lock().unwrap() = Some(ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 0.0,
            volume: 1.0,
            last_saved_at: None,
            was_clean_shutdown: false,
        });

        let use_case = CheckDirtyShutdownUseCase::new(repo);
        assert!(use_case.execute().unwrap());
    }

    #[test]
    fn test_check_dirty_shutdown_clean() {
        let repo = Arc::new(MockProjectStateRepository::new());

        *repo.state.lock().unwrap() = Some(ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 0.0,
            volume: 1.0,
            last_saved_at: None,
            was_clean_shutdown: true,
        });

        let use_case = CheckDirtyShutdownUseCase::new(repo);
        assert!(!use_case.execute().unwrap());
    }

    #[test]
    fn test_reset_clean_shutdown_use_case() {
        let repo = Arc::new(MockProjectStateRepository::new());

        *repo.state.lock().unwrap() = Some(ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 0.0,
            volume: 1.0,
            last_saved_at: None,
            was_clean_shutdown: true,
        });

        let use_case = ResetCleanShutdownUseCase::new(repo.clone());
        use_case.execute().unwrap();

        let stored = repo.state.lock().unwrap();
        assert!(!stored.as_ref().unwrap().was_clean_shutdown);
    }
}
