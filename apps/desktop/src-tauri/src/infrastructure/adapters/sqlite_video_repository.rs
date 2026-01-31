use crate::domain::entities::VideoProject;
use crate::domain::errors::DomainError;
use crate::domain::repositories::VideoRepository;
use sqlx::SqlitePool;
use sqlx::Row;
use tracing::{debug, error};

/// SQLite implementation of VideoRepository
pub struct SqliteVideoRepository {
    pool: SqlitePool,
}

impl SqliteVideoRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl VideoRepository for SqliteVideoRepository {
    fn find_by_id(&self, id: &str) -> Result<Option<VideoProject>, DomainError> {
        debug!("Finding project by ID: {}", id);

        let pool = self.pool.clone();
        let id = id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let row = sqlx::query(
                    "SELECT id, file_path, file_name, duration_seconds, created_at, updated_at
                     FROM projects
                     WHERE id = ?"
                )
                .bind(&id)
                .fetch_optional(&pool)
                .await
                .map_err(|e| {
                    error!("Database query failed: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                match row {
                    Some(row) => Ok(Some(VideoProject {
                        id: row.get("id"),
                        file_path: row.get("file_path"),
                        file_name: row.get("file_name"),
                        duration_seconds: row.get("duration_seconds"),
                        created_at: row.get("created_at"),
                        updated_at: row.get("updated_at"),
                    })),
                    None => Ok(None),
                }
            })
        })
    }

    fn find_all(&self) -> Result<Vec<VideoProject>, DomainError> {
        debug!("Finding all projects");

        let pool = self.pool.clone();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let rows = sqlx::query(
                    "SELECT id, file_path, file_name, duration_seconds, created_at, updated_at
                     FROM projects
                     ORDER BY created_at DESC"
                )
                .fetch_all(&pool)
                .await
                .map_err(|e| {
                    error!("Database query failed: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                let projects = rows.into_iter().map(|row| {
                    VideoProject {
                        id: row.get("id"),
                        file_path: row.get("file_path"),
                        file_name: row.get("file_name"),
                        duration_seconds: row.get("duration_seconds"),
                        created_at: row.get("created_at"),
                        updated_at: row.get("updated_at"),
                    }
                }).collect();

                Ok(projects)
            })
        })
    }

    fn save(&self, project: VideoProject) -> Result<VideoProject, DomainError> {
        debug!("Saving project: {}", project.id);

        let pool = self.pool.clone();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                // Use transaction for atomic save operation
                let mut tx = pool.begin().await.map_err(|e| {
                    error!("Failed to begin transaction: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                sqlx::query(
                    "INSERT INTO projects (id, file_path, file_name, duration_seconds, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET
                         file_path = excluded.file_path,
                         file_name = excluded.file_name,
                         duration_seconds = excluded.duration_seconds,
                         updated_at = excluded.updated_at"
                )
                .bind(&project.id)
                .bind(&project.file_path)
                .bind(&project.file_name)
                .bind(project.duration_seconds)
                .bind(project.created_at)
                .bind(project.updated_at)
                .execute(&mut *tx)
                .await
                .map_err(|e| {
                    error!("Failed to save project: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                tx.commit().await.map_err(|e| {
                    error!("Failed to commit transaction: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                debug!("Project saved successfully: {}", project.id);
                Ok(project)
            })
        })
    }

    fn delete(&self, id: &str) -> Result<(), DomainError> {
        debug!("Deleting project: {}", id);

        let pool = self.pool.clone();
        let id = id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                sqlx::query("DELETE FROM projects WHERE id = ?")
                    .bind(&id)
                    .execute(&pool)
                    .await
                    .map_err(|e| {
                        error!("Failed to delete project: {}", e);
                        DomainError::RepositoryError(e.to_string())
                    })?;

                Ok(())
            })
        })
    }
}
