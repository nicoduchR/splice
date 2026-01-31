use serde::{Deserialize, Serialize};
use ts_rs::TS;
use crate::domain::errors::DomainError;
use crate::infrastructure::ffmpeg::VideoMetadata;

/// VideoProject entity - represents a single imported video project
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct VideoProject {
    pub id: String,
    pub file_path: String,
    pub file_name: String,
    pub duration_seconds: f64,
    #[ts(type = "number")]
    pub created_at: i64,
    #[ts(type = "number")]
    pub updated_at: i64,

    // New metadata fields (optional for backward compatibility)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<u32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<u32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size_bytes: Option<u64>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub codec: Option<String>,
}

impl VideoProject {
    pub fn new(
        id: String,
        file_path: String,
        file_name: String,
        duration_seconds: f64,
    ) -> Result<Self, DomainError> {
        // Validate duration - must be positive (> 0)
        if duration_seconds <= 0.0 {
            return Err(DomainError::InvalidDuration(duration_seconds));
        }

        // Validate file_path
        if file_path.is_empty() {
            return Err(DomainError::InvalidFilePath("Path cannot be empty".to_string()));
        }

        // Validate file_name
        if file_name.is_empty() {
            return Err(DomainError::InvalidFilePath("File name cannot be empty".to_string()));
        }

        let now = chrono::Utc::now().timestamp();
        Ok(Self {
            id,
            file_path,
            file_name,
            duration_seconds,
            created_at: now,
            updated_at: now,
            width: None,
            height: None,
            file_size_bytes: None,
            codec: None,
        })
    }

    /// Builder method to enrich project with video metadata from FFmpeg
    pub fn with_metadata(mut self, metadata: &VideoMetadata) -> Self {
        self.width = metadata.width;
        self.height = metadata.height;
        self.file_size_bytes = Some(metadata.file_size);
        self.codec = Some(metadata.codec_name.clone());
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_video_project_new_creates_with_no_metadata() {
        let project = VideoProject::new(
            "test-id".to_string(),
            "/path/to/video.mp4".to_string(),
            "video.mp4".to_string(),
            120.5,
        ).unwrap();

        assert_eq!(project.id, "test-id");
        assert_eq!(project.duration_seconds, 120.5);
        assert!(project.width.is_none(), "Width should be None initially");
        assert!(project.height.is_none(), "Height should be None initially");
        assert!(project.file_size_bytes.is_none(), "File size should be None initially");
        assert!(project.codec.is_none(), "Codec should be None initially");
    }

    #[test]
    fn test_with_metadata_enriches_project() {
        let metadata = VideoMetadata {
            codec_name: "h264".to_string(),
            codec_type: "video".to_string(),
            width: Some(1920),
            height: Some(1080),
            duration: 120.5,
            file_size: 52428800, // 50MB
        };

        let project = VideoProject::new(
            "test-id".to_string(),
            "/path/to/video.mp4".to_string(),
            "video.mp4".to_string(),
            120.5,
        )
        .unwrap()
        .with_metadata(&metadata);

        assert_eq!(project.width, Some(1920), "Width should be set from metadata");
        assert_eq!(project.height, Some(1080), "Height should be set from metadata");
        assert_eq!(project.file_size_bytes, Some(52428800), "File size should be set from metadata");
        assert_eq!(project.codec, Some("h264".to_string()), "Codec should be set from metadata");
    }

    #[test]
    fn test_with_metadata_handles_missing_resolution() {
        let metadata = VideoMetadata {
            codec_name: "h265".to_string(),
            codec_type: "video".to_string(),
            width: None,
            height: None,
            duration: 90.0,
            file_size: 104857600, // 100MB
        };

        let project = VideoProject::new(
            "test-id".to_string(),
            "/path/to/video.mov".to_string(),
            "video.mov".to_string(),
            90.0,
        )
        .unwrap()
        .with_metadata(&metadata);

        assert_eq!(project.width, None, "Width should remain None if not in metadata");
        assert_eq!(project.height, None, "Height should remain None if not in metadata");
        assert_eq!(project.file_size_bytes, Some(104857600), "File size should still be set");
        assert_eq!(project.codec, Some("h265".to_string()), "Codec should still be set");
    }
}
