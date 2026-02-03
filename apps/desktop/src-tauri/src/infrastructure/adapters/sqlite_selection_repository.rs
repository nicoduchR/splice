use crate::domain::entities::selection::Selection;
use crate::domain::errors::DomainError;
use crate::domain::repositories::SelectionRepository;
use sqlx::SqlitePool;
use sqlx::Row;
use tracing::{debug, error, info};

/// SQLite implementation of SelectionRepository
pub struct SqliteSelectionRepository {
    pool: SqlitePool,
}

impl SqliteSelectionRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl SelectionRepository for SqliteSelectionRepository {
    fn save_selections(
        &self,
        project_id: &str,
        selections: Vec<Selection>,
    ) -> Result<(), DomainError> {
        info!(
            event = "save_selections",
            project_id = %project_id,
            count = selections.len(),
            "Replacing all selections for project"
        );

        let pool = self.pool.clone();
        let project_id = project_id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let mut tx = pool.begin().await.map_err(|e| {
                    error!("Failed to begin transaction: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                // Delete existing selections for this project
                sqlx::query("DELETE FROM selections WHERE project_id = ?")
                    .bind(&project_id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| {
                        error!("Failed to delete existing selections: {}", e);
                        DomainError::RepositoryError(e.to_string())
                    })?;

                // Insert all new selections
                for selection in &selections {
                    sqlx::query(
                        "INSERT INTO selections (id, project_id, start_word_index, end_word_index, start_time, end_time, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?)"
                    )
                    .bind(&selection.id)
                    .bind(&project_id)
                    .bind(selection.start_word_index)
                    .bind(selection.end_word_index)
                    .bind(selection.start_time)
                    .bind(selection.end_time)
                    .bind(selection.created_at)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| {
                        error!("Failed to insert selection: {}", e);
                        DomainError::RepositoryError(e.to_string())
                    })?;
                }

                tx.commit().await.map_err(|e| {
                    error!("Failed to commit transaction: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                info!(
                    event = "save_selections_success",
                    project_id = %project_id,
                    count = selections.len(),
                    "Selections saved successfully"
                );

                Ok(())
            })
        })
    }

    fn get_selections(&self, project_id: &str) -> Result<Vec<Selection>, DomainError> {
        debug!("Getting selections for project_id: {}", project_id);

        let pool = self.pool.clone();
        let project_id = project_id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let rows = sqlx::query(
                    "SELECT id, project_id, start_word_index, end_word_index, start_time, end_time, created_at
                     FROM selections
                     WHERE project_id = ?
                     ORDER BY start_word_index ASC"
                )
                .bind(&project_id)
                .fetch_all(&pool)
                .await
                .map_err(|e| {
                    error!("Database query failed: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                let selections = rows.into_iter().map(|row| {
                    Selection {
                        id: row.get("id"),
                        project_id: row.get("project_id"),
                        start_word_index: row.get("start_word_index"),
                        end_word_index: row.get("end_word_index"),
                        start_time: row.get("start_time"),
                        end_time: row.get("end_time"),
                        created_at: row.get("created_at"),
                    }
                }).collect();

                Ok(selections)
            })
        })
    }

    fn delete_selection(&self, id: &str) -> Result<(), DomainError> {
        debug!("Deleting selection: {}", id);

        let pool = self.pool.clone();
        let id = id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                sqlx::query("DELETE FROM selections WHERE id = ?")
                    .bind(&id)
                    .execute(&pool)
                    .await
                    .map_err(|e| {
                        error!("Failed to delete selection: {}", e);
                        DomainError::RepositoryError(e.to_string())
                    })?;

                Ok(())
            })
        })
    }

    fn delete_all_selections(&self, project_id: &str) -> Result<(), DomainError> {
        debug!("Deleting all selections for project_id: {}", project_id);

        let pool = self.pool.clone();
        let project_id = project_id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                sqlx::query("DELETE FROM selections WHERE project_id = ?")
                    .bind(&project_id)
                    .execute(&pool)
                    .await
                    .map_err(|e| {
                        error!("Failed to delete selections: {}", e);
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

    async fn create_test_project(pool: &SqlitePool, project_id: &str) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        sqlx::query(
            "INSERT INTO projects (id, file_path, file_name, duration_seconds, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(project_id)
        .bind("/test/video.mp4")
        .bind("video.mp4")
        .bind(60.0)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .expect("Failed to create test project");
    }

    fn make_selection(id: &str, project_id: &str, start: i64, end: i64) -> Selection {
        Selection {
            id: id.to_string(),
            project_id: project_id.to_string(),
            start_word_index: start,
            end_word_index: end,
            start_time: start as f64 * 0.5,
            end_time: end as f64 * 0.5 + 0.4,
            created_at: 1706745600,
        }
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_save_and_get_selections() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-sel").await;

        let repo = SqliteSelectionRepository::new(pool);

        let selections = vec![
            make_selection("sel-1", "project-sel", 0, 5),
            make_selection("sel-2", "project-sel", 10, 15),
        ];

        repo.save_selections("project-sel", selections).unwrap();

        let retrieved = repo.get_selections("project-sel").unwrap();
        assert_eq!(retrieved.len(), 2);
        assert_eq!(retrieved[0].start_word_index, 0);
        assert_eq!(retrieved[0].end_word_index, 5);
        assert_eq!(retrieved[1].start_word_index, 10);
        assert_eq!(retrieved[1].end_word_index, 15);
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_save_replaces_existing() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-replace").await;

        let repo = SqliteSelectionRepository::new(pool);

        // Save v1
        let v1 = vec![make_selection("sel-1", "project-replace", 0, 5)];
        repo.save_selections("project-replace", v1).unwrap();

        // Save v2 (replaces v1)
        let v2 = vec![
            make_selection("sel-new-1", "project-replace", 2, 8),
            make_selection("sel-new-2", "project-replace", 20, 30),
        ];
        repo.save_selections("project-replace", v2).unwrap();

        let retrieved = repo.get_selections("project-replace").unwrap();
        assert_eq!(retrieved.len(), 2);
        assert_eq!(retrieved[0].id, "sel-new-1");
        assert_eq!(retrieved[1].id, "sel-new-2");
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_delete_selection() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-del").await;

        let repo = SqliteSelectionRepository::new(pool);

        let selections = vec![
            make_selection("sel-1", "project-del", 0, 5),
            make_selection("sel-2", "project-del", 10, 15),
        ];
        repo.save_selections("project-del", selections).unwrap();

        repo.delete_selection("sel-1").unwrap();

        let retrieved = repo.get_selections("project-del").unwrap();
        assert_eq!(retrieved.len(), 1);
        assert_eq!(retrieved[0].id, "sel-2");
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_delete_all_selections() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-clear").await;

        let repo = SqliteSelectionRepository::new(pool);

        let selections = vec![
            make_selection("sel-1", "project-clear", 0, 5),
            make_selection("sel-2", "project-clear", 10, 15),
        ];
        repo.save_selections("project-clear", selections).unwrap();

        repo.delete_all_selections("project-clear").unwrap();

        let retrieved = repo.get_selections("project-clear").unwrap();
        assert_eq!(retrieved.len(), 0);
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_get_selections_empty() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-empty").await;

        let repo = SqliteSelectionRepository::new(pool);

        let retrieved = repo.get_selections("project-empty").unwrap();
        assert_eq!(retrieved.len(), 0);
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_selections_ordered_by_start_index() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-order").await;

        let repo = SqliteSelectionRepository::new(pool);

        // Insert out of order
        let selections = vec![
            make_selection("sel-3", "project-order", 20, 25),
            make_selection("sel-1", "project-order", 0, 5),
            make_selection("sel-2", "project-order", 10, 15),
        ];
        repo.save_selections("project-order", selections).unwrap();

        let retrieved = repo.get_selections("project-order").unwrap();
        assert_eq!(retrieved[0].start_word_index, 0);
        assert_eq!(retrieved[1].start_word_index, 10);
        assert_eq!(retrieved[2].start_word_index, 20);
    }
}
