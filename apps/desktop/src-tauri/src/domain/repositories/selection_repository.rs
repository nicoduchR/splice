use crate::domain::entities::selection::Selection;
use crate::domain::errors::DomainError;

/// SelectionRepository trait defines the contract for selection persistence
/// This trait lives in Domain layer and is implemented in Infrastructure layer
pub trait SelectionRepository: Send + Sync {
    /// Replace all selections for a project (atomic bulk save)
    fn save_selections(
        &self,
        project_id: &str,
        selections: Vec<Selection>,
    ) -> Result<(), DomainError>;

    /// Get all selections for a project
    fn get_selections(&self, project_id: &str) -> Result<Vec<Selection>, DomainError>;

    /// Delete a single selection by ID
    fn delete_selection(&self, id: &str) -> Result<(), DomainError>;

    /// Delete all selections for a project
    fn delete_all_selections(&self, project_id: &str) -> Result<(), DomainError>;
}
