use serde::{Deserialize, Serialize};
use ts_rs::TS;
use crate::domain::errors::DomainError;

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
}

impl VideoProject {
    pub fn new(
        id: String,
        file_path: String,
        file_name: String,
        duration_seconds: f64,
    ) -> Result<Self, DomainError> {
        // Validate duration
        if duration_seconds < 0.0 {
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
        })
    }
}
