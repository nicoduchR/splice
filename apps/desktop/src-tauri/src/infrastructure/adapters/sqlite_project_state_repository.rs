use crate::domain::entities::project_state::ProjectState;
use crate::domain::errors::DomainError;
use crate::domain::repositories::ProjectStateRepository;
use sqlx::SqlitePool;
use sqlx::Row;
use tracing::{debug, error, info};

/// SQLite implementation of ProjectStateRepository
pub struct SqliteProjectStateRepository {
    pool: SqlitePool,
}

impl SqliteProjectStateRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl ProjectStateRepository for SqliteProjectStateRepository {
    fn save_project_state(&self, state: &ProjectState) -> Result<(), DomainError> {
        info!(
            event = "save_project_state",
            project_id = ?state.project_id,
            timeline_position = state.timeline_position,
            volume = state.volume,
            "Saving project state"
        );

        let pool = self.pool.clone();
        let state = state.clone();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                // Note: was_clean_shutdown is NOT updated on conflict — it is managed
                // exclusively by mark_clean_shutdown() and reset_clean_shutdown()
                sqlx::query(
                    "INSERT INTO project_state (id, project_id, timeline_position, volume, last_saved_at, was_clean_shutdown)
                     VALUES (1, ?, ?, ?, ?, 0)
                     ON CONFLICT(id) DO UPDATE SET
                         project_id = excluded.project_id,
                         timeline_position = excluded.timeline_position,
                         volume = excluded.volume,
                         last_saved_at = excluded.last_saved_at"
                )
                .bind(&state.project_id)
                .bind(state.timeline_position)
                .bind(state.volume)
                .bind(state.last_saved_at)
                .execute(&pool)
                .await
                .map_err(|e| {
                    error!("Failed to save project state: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                info!(event = "save_project_state_success", "Project state saved");
                Ok(())
            })
        })
    }

    fn load_project_state(&self) -> Result<Option<ProjectState>, DomainError> {
        debug!("Loading project state");

        let pool = self.pool.clone();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let row = sqlx::query(
                    "SELECT id, project_id, timeline_position, volume, last_saved_at, was_clean_shutdown
                     FROM project_state
                     WHERE id = 1"
                )
                .fetch_optional(&pool)
                .await
                .map_err(|e| {
                    error!("Failed to load project state: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                Ok(row.map(|r| {
                    let was_clean: i64 = r.get("was_clean_shutdown");
                    ProjectState {
                        id: r.get("id"),
                        project_id: r.get("project_id"),
                        timeline_position: r.get("timeline_position"),
                        volume: r.get("volume"),
                        last_saved_at: r.get("last_saved_at"),
                        was_clean_shutdown: was_clean != 0,
                    }
                }))
            })
        })
    }

    fn mark_clean_shutdown(&self) -> Result<(), DomainError> {
        info!(event = "mark_clean_shutdown", "Marking clean shutdown");

        let pool = self.pool.clone();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                sqlx::query(
                    "UPDATE project_state SET was_clean_shutdown = 1 WHERE id = 1"
                )
                .execute(&pool)
                .await
                .map_err(|e| {
                    error!("Failed to mark clean shutdown: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                Ok(())
            })
        })
    }

    fn check_dirty_shutdown(&self) -> Result<bool, DomainError> {
        debug!("Checking for dirty shutdown");

        let pool = self.pool.clone();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let row = sqlx::query(
                    "SELECT was_clean_shutdown, project_id FROM project_state WHERE id = 1"
                )
                .fetch_optional(&pool)
                .await
                .map_err(|e| {
                    error!("Failed to check dirty shutdown: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                match row {
                    Some(r) => {
                        let was_clean: i64 = r.get("was_clean_shutdown");
                        let project_id: Option<String> = r.get("project_id");
                        let is_dirty = was_clean == 0 && project_id.is_some();
                        debug!(
                            event = "dirty_shutdown_check",
                            was_clean = was_clean,
                            has_project = project_id.is_some(),
                            is_dirty = is_dirty,
                        );
                        Ok(is_dirty)
                    }
                    None => Ok(false), // No state saved yet, not a dirty shutdown
                }
            })
        })
    }

    fn reset_clean_shutdown(&self) -> Result<(), DomainError> {
        debug!("Resetting clean shutdown flag to 0");

        let pool = self.pool.clone();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                sqlx::query(
                    "UPDATE project_state SET was_clean_shutdown = 0 WHERE id = 1"
                )
                .execute(&pool)
                .await
                .map_err(|e| {
                    error!("Failed to reset clean shutdown: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                Ok(())
            })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use std::time::{SystemTime, UNIX_EPOCH};

    async fn create_test_pool() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(":memory:")
            .await
            .expect("Failed to create test pool");

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        pool
    }

    fn now_timestamp() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_save_and_load_project_state() {
        let pool = create_test_pool().await;
        let repo = SqliteProjectStateRepository::new(pool);

        let state = ProjectState {
            id: 1,
            project_id: Some("project-123".to_string()),
            timeline_position: 42.5,
            volume: 0.8,
            last_saved_at: Some(now_timestamp()),
            was_clean_shutdown: false,
        };

        repo.save_project_state(&state).unwrap();

        let loaded = repo.load_project_state().unwrap();
        assert!(loaded.is_some());
        let loaded = loaded.unwrap();
        assert_eq!(loaded.project_id, Some("project-123".to_string()));
        assert_eq!(loaded.timeline_position, 42.5);
        assert_eq!(loaded.volume, 0.8);
        assert!(!loaded.was_clean_shutdown);
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_save_upserts_existing() {
        let pool = create_test_pool().await;
        let repo = SqliteProjectStateRepository::new(pool);

        // Save v1
        let state_v1 = ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 10.0,
            volume: 1.0,
            last_saved_at: Some(now_timestamp()),
            was_clean_shutdown: false,
        };
        repo.save_project_state(&state_v1).unwrap();

        // Save v2 (should upsert, not insert)
        let state_v2 = ProjectState {
            id: 1,
            project_id: Some("project-2".to_string()),
            timeline_position: 55.0,
            volume: 0.5,
            last_saved_at: Some(now_timestamp()),
            was_clean_shutdown: true,
        };
        repo.save_project_state(&state_v2).unwrap();

        let loaded = repo.load_project_state().unwrap().unwrap();
        assert_eq!(loaded.project_id, Some("project-2".to_string()));
        assert_eq!(loaded.timeline_position, 55.0);
        assert_eq!(loaded.volume, 0.5);
        // save_project_state does NOT update was_clean_shutdown (managed by mark/reset only)
        assert!(!loaded.was_clean_shutdown);
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_load_empty_returns_none() {
        let pool = create_test_pool().await;
        let repo = SqliteProjectStateRepository::new(pool);

        let loaded = repo.load_project_state().unwrap();
        assert!(loaded.is_none());
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_mark_clean_shutdown() {
        let pool = create_test_pool().await;
        let repo = SqliteProjectStateRepository::new(pool);

        // Save state with dirty shutdown
        let state = ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 0.0,
            volume: 1.0,
            last_saved_at: Some(now_timestamp()),
            was_clean_shutdown: false,
        };
        repo.save_project_state(&state).unwrap();

        // Mark clean
        repo.mark_clean_shutdown().unwrap();

        let loaded = repo.load_project_state().unwrap().unwrap();
        assert!(loaded.was_clean_shutdown);
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_check_dirty_shutdown_with_project() {
        let pool = create_test_pool().await;
        let repo = SqliteProjectStateRepository::new(pool);

        // Save state: was_clean_shutdown=0, project_id set
        let state = ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 30.0,
            volume: 1.0,
            last_saved_at: Some(now_timestamp()),
            was_clean_shutdown: false,
        };
        repo.save_project_state(&state).unwrap();

        assert!(repo.check_dirty_shutdown().unwrap());
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_check_dirty_shutdown_clean() {
        let pool = create_test_pool().await;
        let repo = SqliteProjectStateRepository::new(pool);

        let state = ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 0.0,
            volume: 1.0,
            last_saved_at: Some(now_timestamp()),
            was_clean_shutdown: false,
        };
        repo.save_project_state(&state).unwrap();

        // Mark clean shutdown explicitly (save_project_state doesn't set this flag)
        repo.mark_clean_shutdown().unwrap();

        assert!(!repo.check_dirty_shutdown().unwrap());
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_check_dirty_shutdown_no_project() {
        let pool = create_test_pool().await;
        let repo = SqliteProjectStateRepository::new(pool);

        // was_clean_shutdown=0 but no project_id → not dirty
        let state = ProjectState {
            id: 1,
            project_id: None,
            timeline_position: 0.0,
            volume: 1.0,
            last_saved_at: None,
            was_clean_shutdown: false,
        };
        repo.save_project_state(&state).unwrap();

        assert!(!repo.check_dirty_shutdown().unwrap());
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_check_dirty_shutdown_empty_db() {
        let pool = create_test_pool().await;
        let repo = SqliteProjectStateRepository::new(pool);

        // No state saved → not dirty
        assert!(!repo.check_dirty_shutdown().unwrap());
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_reset_clean_shutdown() {
        let pool = create_test_pool().await;
        let repo = SqliteProjectStateRepository::new(pool);

        // Save state with clean shutdown
        let state = ProjectState {
            id: 1,
            project_id: Some("project-1".to_string()),
            timeline_position: 0.0,
            volume: 1.0,
            last_saved_at: Some(now_timestamp()),
            was_clean_shutdown: true,
        };
        repo.save_project_state(&state).unwrap();

        // Reset clean shutdown flag
        repo.reset_clean_shutdown().unwrap();

        let loaded = repo.load_project_state().unwrap().unwrap();
        assert!(!loaded.was_clean_shutdown);
    }
}
