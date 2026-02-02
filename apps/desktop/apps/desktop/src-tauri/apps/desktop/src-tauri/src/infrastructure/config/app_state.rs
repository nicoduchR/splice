use crate::domain::repositories::VideoRepository;
use crate::infrastructure::adapters::SqliteVideoRepository;
use sqlx::SqlitePool;
use std::sync::Arc;

pub struct AppState {
    pub video_repository: Arc<dyn VideoRepository>,
}

impl AppState {
    pub fn new(pool: SqlitePool) -> Self {
        let video_repository = Arc::new(SqliteVideoRepository::new(Arc::new(pool)));

        Self {
            video_repository,
        }
    }
}
