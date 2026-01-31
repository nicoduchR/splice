use crate::domain::entities::VideoProject;
use crate::domain::errors::DomainError;

/// VideoRepository trait defines the contract for video persistence
/// This trait lives in Domain layer and is implemented in Infrastructure layer
pub trait VideoRepository: Send + Sync {
    /// Find a video project by its ID
    fn find_by_id(&self, id: &str) -> Result<Option<VideoProject>, DomainError>;

    /// Find all video projects
    fn find_all(&self) -> Result<Vec<VideoProject>, DomainError>;

    /// Save a video project (insert or update)
    fn save(&self, project: VideoProject) -> Result<VideoProject, DomainError>;

    /// Delete a video project by ID
    fn delete(&self, id: &str) -> Result<(), DomainError>;
}
