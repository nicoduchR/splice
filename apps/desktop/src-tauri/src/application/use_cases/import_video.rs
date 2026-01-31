use crate::domain::entities::VideoProject;
use crate::domain::errors::DomainError;
use crate::domain::repositories::VideoRepository;
use crate::infrastructure::ffmpeg::FfmpegService;
use std::path::Path;
use std::sync::Arc;
use tokio::fs;
use tracing::{debug, info, error};

pub struct ImportVideoUseCase {
    video_repository: Arc<dyn VideoRepository>,
    ffmpeg_service: FfmpegService,
}

impl ImportVideoUseCase {
    pub fn new(video_repository: Arc<dyn VideoRepository>) -> Self {
        Self {
            video_repository,
            ffmpeg_service: FfmpegService::new(),
        }
    }

    pub async fn execute<R: tauri::Runtime>(
        &self,
        app: &tauri::AppHandle<R>,
        file_path: &str,
    ) -> Result<VideoProject, DomainError> {
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

        // 4. Validate video format with FFmpeg
        info!("Probing video format with FFmpeg");
        let video_metadata = self
            .ffmpeg_service
            .probe_video_format(app, file_path)
            .await?;

        info!(
            "Video codec: {}, duration: {}s",
            video_metadata.codec_name, video_metadata.duration
        );

        // 5. Extract file name
        let file_name = path.file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| {
                error!("Invalid file name");
                DomainError::InvalidFileName
            })?
            .to_string();

        debug!("File name: {}", file_name);

        // 6. Create video project with real duration from FFmpeg
        let project = VideoProject::new(
            uuid::Uuid::new_v4().to_string(),
            file_path.to_string(),
            file_name,
            video_metadata.duration, // Real duration extracted by FFmpeg
        )?;

        info!("Created project: {} with duration: {}s", project.id, project.duration_seconds);

        // 7. Save to SQLite
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
    use std::fs::File;
    use std::io::Write;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_import_video_file_not_found() {
        let repo = Arc::new(MockVideoRepository::new());
        let use_case = ImportVideoUseCase::new(repo);
        let app = tauri::test::mock_app();

        let result = use_case.execute(&app, "/nonexistent/video.mp4").await;

        assert!(result.is_err());
        assert!(matches!(result, Err(DomainError::FileNotFound(_))));
    }

    #[tokio::test]
    async fn test_import_video_unsupported_format() {
        let repo = Arc::new(MockVideoRepository::new());
        let use_case = ImportVideoUseCase::new(repo);
        let app = tauri::test::mock_app();

        // Create temporary .mkv file
        let temp_dir = tempdir().unwrap();
        let file_path = temp_dir.path().join("video.mkv");
        let mut file = File::create(&file_path).unwrap();
        file.write_all(b"fake video content").unwrap();

        let result = use_case.execute(&app, file_path.to_str().unwrap()).await;

        assert!(result.is_err());
        match result {
            Err(DomainError::UnsupportedFormat(ext)) => {
                assert_eq!(ext, "mkv");
            }
            _ => panic!("Expected UnsupportedFormat error"),
        }
    }

    #[tokio::test]
    async fn test_import_video_too_large() {
        let repo = Arc::new(MockVideoRepository::new());
        let use_case = ImportVideoUseCase::new(repo);

        // Note: We can't easily create a 51GB file in tests
        // This test would need to mock fs::metadata instead
        // For now, we document this limitation
        // TODO: Add mock for fs::metadata to test file size validation
    }

    #[tokio::test]
    async fn test_import_video_success_h264_mp4() {
        let repo = Arc::new(MockVideoRepository::new());
        let use_case = ImportVideoUseCase::new(repo.clone());
        let app = tauri::test::mock_app();

        let result = use_case.execute(&app, "test-assets/fixtures/sample-h264.mp4").await;

        assert!(result.is_ok(), "H.264 MP4 import should succeed");
        let project = result.unwrap();
        assert_eq!(project.file_name, "sample-h264.mp4");
        assert!(project.duration_seconds > 0.0, "Duration should be extracted from FFmpeg");

        // Verify project was saved to repository
        let saved = repo.find_by_id(&project.id).unwrap();
        assert!(saved.is_some(), "Project should be saved in repository");
    }

    #[tokio::test]
    async fn test_import_video_success_h265_mov() {
        let repo = Arc::new(MockVideoRepository::new());
        let use_case = ImportVideoUseCase::new(repo);
        let app = tauri::test::mock_app();

        let result = use_case.execute(&app, "test-assets/fixtures/sample-h265.mov").await;

        assert!(result.is_ok(), "H.265 MOV import should succeed");
        let project = result.unwrap();
        assert_eq!(project.file_name, "sample-h265.mov");
        assert!(project.duration_seconds > 0.0);
    }

    #[tokio::test]
    async fn test_import_video_unsupported_codec_vp9() {
        let repo = Arc::new(MockVideoRepository::new());
        let use_case = ImportVideoUseCase::new(repo);
        let app = tauri::test::mock_app();

        let result = use_case.execute(&app, "test-assets/fixtures/sample-vp9.webm").await;

        assert!(result.is_err(), "VP9 WebM should be rejected");
        match result.unwrap_err() {
            DomainError::UnsupportedVideoCodec { codec, .. } => {
                assert_eq!(codec, "vp9", "Should reject VP9 codec");
            }
            other => panic!("Expected UnsupportedVideoCodec, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_import_video_corrupted_file() {
        let repo = Arc::new(MockVideoRepository::new());
        let use_case = ImportVideoUseCase::new(repo);
        let app = tauri::test::mock_app();

        let result = use_case.execute(&app, "test-assets/fixtures/corrupted.mp4").await;

        assert!(result.is_err(), "Corrupted file should be rejected");
        assert!(
            matches!(result.unwrap_err(), DomainError::VideoCorrupted { .. }),
            "Should return VideoCorrupted error"
        );
    }
}
