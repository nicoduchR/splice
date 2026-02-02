#[cfg(test)]
use crate::domain::entities::VideoProject;
#[cfg(test)]
use crate::domain::errors::DomainError;
#[cfg(test)]
use crate::domain::repositories::VideoRepository;
#[cfg(test)]
use std::sync::{Arc, Mutex};

#[cfg(test)]
pub struct MockVideoRepository {
    projects: Arc<Mutex<Vec<VideoProject>>>,
}

#[cfg(test)]
impl MockVideoRepository {
    pub fn new() -> Self {
        Self {
            projects: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

#[cfg(test)]
impl VideoRepository for MockVideoRepository {
    fn save(&self, project: VideoProject) -> Result<VideoProject, DomainError> {
        let mut projects = self.projects.lock().unwrap();
        
        // Remove existing project with same ID
        projects.retain(|p| p.id != project.id);
        
        // Add new/updated project
        projects.push(project.clone());
        
        Ok(project)
    }

    fn find_by_id(&self, id: &str) -> Result<Option<VideoProject>, DomainError> {
        let projects = self.projects.lock().unwrap();
        Ok(projects.iter().find(|p| p.id == id).cloned())
    }

    fn find_all(&self) -> Result<Vec<VideoProject>, DomainError> {
        let projects = self.projects.lock().unwrap();
        Ok(projects.clone())
    }

    fn delete(&self, id: &str) -> Result<(), DomainError> {
        let mut projects = self.projects.lock().unwrap();
        projects.retain(|p| p.id != id);
        Ok(())
    }
}
