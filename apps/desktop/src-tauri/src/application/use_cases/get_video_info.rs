use crate::domain::entities::VideoProject;
use crate::domain::errors::DomainError;
use crate::domain::repositories::VideoRepository;
use std::sync::Arc;

/// GetVideoInfoUseCase - Application layer use case
/// Demonstrates Dependency Inversion: depends on trait, not implementation
pub struct GetVideoInfoUseCase {
    repository: Arc<dyn VideoRepository>,
}

impl GetVideoInfoUseCase {
    pub fn new(repository: Arc<dyn VideoRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, project_id: &str) -> Result<VideoProject, DomainError> {
        let project = self.repository.find_by_id(project_id)?;
        project.ok_or_else(|| DomainError::VideoNotFound(project_id.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::repositories::VideoRepository;
    use std::collections::HashMap;
    use std::sync::Mutex;

    // Mock repository for testing
    struct MockVideoRepository {
        projects: Mutex<HashMap<String, VideoProject>>,
    }

    impl MockVideoRepository {
        fn new() -> Self {
            Self {
                projects: Mutex::new(HashMap::new()),
            }
        }
    }

    impl VideoRepository for MockVideoRepository {
        fn find_by_id(&self, id: &str) -> Result<Option<VideoProject>, DomainError> {
            let projects = self.projects.lock().unwrap();
            Ok(projects.get(id).cloned())
        }

        fn save(&self, project: VideoProject) -> Result<VideoProject, DomainError> {
            let mut projects = self.projects.lock().unwrap();
            projects.insert(project.id.clone(), project.clone());
            Ok(project)
        }

        fn delete(&self, id: &str) -> Result<(), DomainError> {
            let mut projects = self.projects.lock().unwrap();
            projects.remove(id);
            Ok(())
        }
    }

    #[test]
    fn test_get_video_info_success() {
        let repo = Arc::new(MockVideoRepository::new());
        let project = VideoProject::new(
            "test-123".to_string(),
            "/path/to/video.mp4".to_string(),
            "video.mp4".to_string(),
            120.5,
        ).expect("Failed to create test project");
        repo.save(project.clone()).unwrap();

        let use_case = GetVideoInfoUseCase::new(repo);
        let result = use_case.execute("test-123");

        assert!(result.is_ok());
        let retrieved = result.unwrap();
        assert_eq!(retrieved.id, "test-123");
        assert_eq!(retrieved.file_name, "video.mp4");
    }

    #[test]
    fn test_get_video_info_not_found() {
        let repo = Arc::new(MockVideoRepository::new());
        let use_case = GetVideoInfoUseCase::new(repo);
        let result = use_case.execute("nonexistent");

        assert!(result.is_err());
        match result {
            Err(DomainError::VideoNotFound(id)) => assert_eq!(id, "nonexistent"),
            _ => panic!("Expected VideoNotFound error"),
        }
    }
}
