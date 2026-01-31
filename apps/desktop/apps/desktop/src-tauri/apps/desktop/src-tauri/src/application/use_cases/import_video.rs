use crate::domain::entities::VideoProject;
use crate::domain::errors::DomainError;
use crate::domain::repositories::VideoRepository;
use std::path::Path;
use std::sync::Arc;
use tokio::fs;
use tracing::{debug, info, error};

pub struct ImportVideoUseCase {
    video_repository: Arc<dyn VideoRepository>,
}

impl ImportVideoUseCase {
    pub fn new(video_repository: Arc<dyn VideoRepository>) -> Self {
        Self { video_repository }
    }

    pub async fn execute(&self, file_path: &str) -> Result<VideoProject, DomainError> {
        info!("Importing video: {}", file_path);

        // 1. Validate file exists
        let path = Path::new(file_path);
        if !path.exists() {
            error!("File not found: {}", file_path);
            return Err(DomainError::FileNotFound(file_path.to_string()));
        }

        debug!("File exists, checking metadata");

        // 2. Check file size
        let metadata = fs::metadata(path).await
            .map_err(|e| {
                error!("Failed to read file metadata: {}", e);
                DomainError::DatabaseError(e.to_string())
            })?;

        let size_bytes = metadata.len();
        let size_gb = size_bytes as f64 / 1_000_000_000.0;

        debug!("File size: {:.2} GB", size_gb);

        if size_gb > 50.0 {
            error!("File too large: {:.2} GB (max 50 GB)", size_gb);
            return Err(DomainError::VideoTooLarge {
                size_gb,
                max_gb: 50.0,
            });
        }

        // 3. Check file extension
        let extension = path.extension()
            .and_then(|e| e.to_str())
            .ok_or_else(|| {
                error!("File has no extension");
                DomainError::UnsupportedFormat("No extension".to_string())
            })?
            .to_lowercase();

        debug!("File extension: {}", extension);

        let supported_formats = ["mp4", "mov", "avi"];
        if !supported_formats.contains(&extension.as_str()) {
            error!("Unsupported format: {}", extension);
            return Err(DomainError::UnsupportedFormat(extension));
        }

        // 4. Extract file name
        let file_name = path.file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| {
                error!("Invalid file name");
                DomainError::InvalidFileName
            })?
            .to_string();

        debug!("File name: {}", file_name);

        // 5. Create video project
        // MVP: Duration is hardcoded to 0.0
        // Story 1.6 will implement FFmpeg extraction
        let project = VideoProject::new(
            uuid::Uuid::new_v4().to_string(),
            file_path.to_string(),
            file_name,
            0.0,  // TODO Story 1.6: Extract duration with FFmpeg
        )?;

        info!("Created project: {}", project.id);

        // 6. Save to SQLite
        self.video_repository.save(project.clone())
            .map_err(|e| {
                error!("Failed to save project to database: {:?}", e);
                e
            })?;

        info!("Successfully imported video: {}", project.file_name);

        Ok(project)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::adapters::MockVideoRepository;

    #[tokio::test]
    async fn test_import_video_file_not_found() {
        let repo = Arc::new(MockVideoRepository::new());
        let use_case = ImportVideoUseCase::new(repo);

        let result = use_case.execute("/nonexistent/video.mp4").await;

        assert!(result.is_err());
        assert!(matches!(result, Err(DomainError::FileNotFound(_))));
    }
}
