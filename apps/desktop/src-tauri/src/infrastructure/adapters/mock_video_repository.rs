use crate::domain::entities::VideoProject;
use crate::domain::errors::DomainError;
use crate::domain::repositories::VideoRepository;
use std::collections::HashMap;
use std::sync::Mutex;

/// MockVideoRepository - In-memory implementation for demonstration
/// Future story will replace with SQLite implementation
pub struct MockVideoRepository {
    projects: Mutex<HashMap<String, VideoProject>>,
}

impl Default for MockVideoRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl MockVideoRepository {
    pub fn new() -> Self {
        Self {
            projects: Mutex::new(HashMap::new()),
        }
    }

    /// Helper method to seed with example data
    pub fn seed_example_data(&self) {
        let example = VideoProject::new(
            "demo-project-1".to_string(),
            "/Users/demo/Videos/sample.mp4".to_string(),
            "sample.mp4".to_string(),
            320.5,
        ).expect("Failed to create example project");
        let _ = self.save(example);
    }
}

impl VideoRepository for MockVideoRepository {
    fn find_by_id(&self, id: &str) -> Result<Option<VideoProject>, DomainError> {
        let projects = self.projects.lock()
            .map_err(|e| DomainError::RepositoryError(format!("Lock error: {}", e)))?;
        Ok(projects.get(id).cloned())
    }

    fn find_all(&self) -> Result<Vec<VideoProject>, DomainError> {
        let projects = self.projects.lock()
            .map_err(|e| DomainError::RepositoryError(format!("Lock error: {}", e)))?;
        Ok(projects.values().cloned().collect())
    }

    fn save(&self, project: VideoProject) -> Result<VideoProject, DomainError> {
        let mut projects = self.projects.lock()
            .map_err(|e| DomainError::RepositoryError(format!("Lock error: {}", e)))?;
        projects.insert(project.id.clone(), project.clone());
        Ok(project)
    }

    fn delete(&self, id: &str) -> Result<(), DomainError> {
        let mut projects = self.projects.lock()
            .map_err(|e| DomainError::RepositoryError(format!("Lock error: {}", e)))?;
        projects.remove(id);
        Ok(())
    }
}
