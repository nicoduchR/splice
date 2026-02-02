use crate::domain::entities::cut::Cut;
use crate::domain::errors::DomainError;

/// CutRepository trait defines the contract for cut segment persistence
/// This trait lives in Domain layer and is implemented in Infrastructure layer
pub trait CutRepository: Send + Sync {
    /// Replace all cuts for a project (atomic bulk save)
    fn save_cuts(&self, project_id: &str, cuts: Vec<Cut>) -> Result<(), DomainError>;

    /// Get all cuts for a project, ordered by segment_index ASC
    fn get_cuts(&self, project_id: &str) -> Result<Vec<Cut>, DomainError>;

    /// Delete all cuts for a project
    fn delete_cuts(&self, project_id: &str) -> Result<(), DomainError>;
}
