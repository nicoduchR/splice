use crate::domain::entities::VideoProject;
use crate::domain::errors::DomainError;
use crate::domain::repositories::VideoRepository;
use sqlx::SqlitePool;
use std::sync::Arc;
use tracing::{debug, error};

pub struct SqliteVideoRepository {
    pool: Arc<SqlitePool>,
}

impl SqliteVideoRepository {
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }
}

impl VideoRepository for SqliteVideoRepository {
    fn save(&self, project: VideoProject) -> Result<VideoProject, DomainError> {
        let pool = self.pool.clone();
        let project_clone = project.clone();

        // Use tokio blocking to call async code from sync trait
        let runtime = tokio::runtime::Handle::current();
        runtime.block_on(async {
            let result = sqlx::query(
                "INSERT INTO video_projects (id, file_path, file_name, duration_seconds, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                 file_path = excluded.file_path,
                 file_name = excluded.file_name,
                 duration_seconds = excluded.duration_seconds,
                 updated_at = excluded.updated_at"
            )
            .bind(&project_clone.id)
            .bind(&project_clone.file_path)
            .bind(&project_clone.file_name)
            .bind(project_clone.duration_seconds)
            .bind(project_clone.created_at)
            .bind(project_clone.updated_at)
            .execute(&*pool)
            .await;

            match result {
                Ok(_) => {
                    debug!("Saved video project: {}", project_clone.id);
                    Ok(project_clone)
                }
                Err(e) => {
                    error!("Failed to save video project: {}", e);
                    Err(DomainError::DatabaseError(e.to_string()))
                }
            }
        })
    }

    fn find_by_id(&self, id: &str) -> Result<Option<VideoProject>, DomainError> {
        let pool = self.pool.clone();
        let id = id.to_string();

        let runtime = tokio::runtime::Handle::current();
        runtime.block_on(async {
            let result = sqlx::query_as::<_, (String, String, String, f64, i64, i64)>(
                "SELECT id, file_path, file_name, duration_seconds, created_at, updated_at
                 FROM video_projects WHERE id = ?"
            )
            .bind(&id)
            .fetch_optional(&*pool)
            .await;

            match result {
                Ok(Some((id, file_path, file_name, duration_seconds, created_at, updated_at))) => {
                    Ok(Some(VideoProject {
                        id,
                        file_path,
                        file_name,
                        duration_seconds,
                        created_at,
                        updated_at,
                    }))
                }
                Ok(None) => Ok(None),
                Err(e) => {
                    error!("Failed to find video project: {}", e);
                    Err(DomainError::DatabaseError(e.to_string()))
                }
            }
        })
    }

    fn find_all(&self) -> Result<Vec<VideoProject>, DomainError> {
        let pool = self.pool.clone();

        let runtime = tokio::runtime::Handle::current();
        runtime.block_on(async {
            let result = sqlx::query_as::<_, (String, String, String, f64, i64, i64)>(
                "SELECT id, file_path, file_name, duration_seconds, created_at, updated_at
                 FROM video_projects ORDER BY created_at DESC"
            )
            .fetch_all(&*pool)
            .await;

            match result {
                Ok(rows) => {
                    let projects = rows.into_iter()
                        .map(|(id, file_path, file_name, duration_seconds, created_at, updated_at)| {
                            VideoProject {
                                id,
                                file_path,
                                file_name,
                                duration_seconds,
                                created_at,
                                updated_at,
                            }
                        })
                        .collect();
                    Ok(projects)
                }
                Err(e) => {
                    error!("Failed to load all video projects: {}", e);
                    Err(DomainError::DatabaseError(e.to_string()))
                }
            }
        })
    }

    fn delete(&self, id: &str) -> Result<(), DomainError> {
        let pool = self.pool.clone();
        let id = id.to_string();

        let runtime = tokio::runtime::Handle::current();
        runtime.block_on(async {
            let result = sqlx::query("DELETE FROM video_projects WHERE id = ?")
                .bind(&id)
                .execute(&*pool)
                .await;

            match result {
                Ok(_) => {
                    debug!("Deleted video project: {}", id);
                    Ok(())
                }
                Err(e) => {
                    error!("Failed to delete video project: {}", e);
                    Err(DomainError::DatabaseError(e.to_string()))
                }
            }
        })
    }
}
