use sqlx::SqlitePool;
use std::sync::Arc;
use crate::domain::repositories::VideoRepository;
use crate::infrastructure::adapters::SqliteVideoRepository;

/// Application state managed by Tauri
pub struct AppState {
    pub db_pool: SqlitePool,
    pub video_repository: Arc<dyn VideoRepository>,
}

impl AppState {
    pub fn new(db_pool: SqlitePool) -> Self {
        let video_repository: Arc<dyn VideoRepository> =
            Arc::new(SqliteVideoRepository::new(db_pool.clone()));

        Self {
            db_pool,
            video_repository,
        }
    }
}
