use crate::domain::entities::project_state::ProjectState;
use crate::domain::errors::DomainError;

/// ProjectStateRepository trait defines the contract for project state persistence
/// This trait lives in Domain layer and is implemented in Infrastructure layer
pub trait ProjectStateRepository: Send + Sync {
    /// Save or update the project state (upsert singleton row id=1)
    fn save_project_state(&self, state: &ProjectState) -> Result<(), DomainError>;

    /// Load the current project state (returns None if no state saved yet)
    fn load_project_state(&self) -> Result<Option<ProjectState>, DomainError>;

    /// Mark clean shutdown (set was_clean_shutdown = 1)
    fn mark_clean_shutdown(&self) -> Result<(), DomainError>;

    /// Check if last shutdown was dirty (was_clean_shutdown = 0 and project_id is not null)
    fn check_dirty_shutdown(&self) -> Result<bool, DomainError>;

    /// Reset was_clean_shutdown to 0 (called after successful startup)
    fn reset_clean_shutdown(&self) -> Result<(), DomainError>;
}
