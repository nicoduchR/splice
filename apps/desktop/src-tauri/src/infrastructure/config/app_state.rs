use sqlx::SqlitePool;
use std::sync::Arc;
use crate::domain::repositories::{VideoRepository, TranscriptRepository};
use crate::infrastructure::adapters::{SqliteVideoRepository, SqliteTranscriptRepository};

/// Application state managed by Tauri
pub struct AppState {
    pub db_pool: SqlitePool,
    pub video_repository: Arc<dyn VideoRepository>,
    pub transcript_repository: Arc<dyn TranscriptRepository>,
}

impl AppState {
    pub fn new(db_pool: SqlitePool) -> Self {
        let video_repository: Arc<dyn VideoRepository> =
            Arc::new(SqliteVideoRepository::new(db_pool.clone()));

        let transcript_repository: Arc<dyn TranscriptRepository> =
            Arc::new(SqliteTranscriptRepository::new(db_pool.clone()));

        Self {
            db_pool,
            video_repository,
            transcript_repository,
        }
    }
}
