use crate::domain::entities::VideoProject;
use crate::domain::errors::DomainError;

/// VideoRepository trait définit le contrat pour la persistance des vidéos
pub trait VideoRepository: Send + Sync {
    fn save(&self, project: VideoProject) -> Result<VideoProject, DomainError>;
    fn find_by_id(&self, id: &str) -> Result<Option<VideoProject>, DomainError>;
    fn find_all(&self) -> Result<Vec<VideoProject>, DomainError>;
    fn delete(&self, id: &str) -> Result<(), DomainError>;
}
