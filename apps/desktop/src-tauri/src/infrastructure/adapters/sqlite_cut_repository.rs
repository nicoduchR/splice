use crate::domain::entities::cut::Cut;
use crate::domain::errors::DomainError;
use crate::domain::repositories::CutRepository;
use sqlx::SqlitePool;
use sqlx::Row;
use tracing::{debug, error, info};

/// SQLite implementation of CutRepository
pub struct SqliteCutRepository {
    pool: SqlitePool,
}

impl SqliteCutRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl CutRepository for SqliteCutRepository {
    fn save_cuts(
        &self,
        project_id: &str,
        cuts: Vec<Cut>,
    ) -> Result<(), DomainError> {
        info!(
            event = "save_cuts",
            project_id = %project_id,
            count = cuts.len(),
            "Replacing all cuts for project"
        );

        let pool = self.pool.clone();
        let project_id = project_id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let mut tx = pool.begin().await.map_err(|e| {
                    error!("Failed to begin transaction: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                // Delete existing cuts for this project
                sqlx::query("DELETE FROM cuts WHERE project_id = ?")
                    .bind(&project_id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| {
                        error!("Failed to delete existing cuts: {}", e);
                        DomainError::RepositoryError(e.to_string())
                    })?;

                // Insert all new cuts
                for cut in &cuts {
                    sqlx::query(
                        "INSERT INTO cuts (id, project_id, segment_index, start_time, end_time, created_at)
                         VALUES (?, ?, ?, ?, ?, ?)"
                    )
                    .bind(&cut.id)
                    .bind(&project_id)
                    .bind(cut.segment_index)
                    .bind(cut.start_time)
                    .bind(cut.end_time)
                    .bind(cut.created_at)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| {
                        error!("Failed to insert cut: {}", e);
                        DomainError::RepositoryError(e.to_string())
                    })?;
                }

                tx.commit().await.map_err(|e| {
                    error!("Failed to commit transaction: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                info!(
                    event = "save_cuts_success",
                    project_id = %project_id,
                    count = cuts.len(),
                    "Cuts saved successfully"
                );

                Ok(())
            })
        })
    }

    fn get_cuts(&self, project_id: &str) -> Result<Vec<Cut>, DomainError> {
        debug!("Getting cuts for project_id: {}", project_id);

        let pool = self.pool.clone();
        let project_id = project_id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let rows = sqlx::query(
                    "SELECT id, project_id, segment_index, start_time, end_time, created_at
                     FROM cuts
                     WHERE project_id = ?
                     ORDER BY segment_index ASC"
                )
                .bind(&project_id)
                .fetch_all(&pool)
                .await
                .map_err(|e| {
                    error!("Database query failed: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                let cuts = rows.into_iter().map(|row| {
                    Cut {
                        id: row.get("id"),
                        project_id: row.get("project_id"),
                        segment_index: row.get("segment_index"),
                        start_time: row.get("start_time"),
                        end_time: row.get("end_time"),
                        created_at: row.get("created_at"),
                    }
                }).collect();

                Ok(cuts)
            })
        })
    }

    fn delete_cuts(&self, project_id: &str) -> Result<(), DomainError> {
        debug!("Deleting all cuts for project_id: {}", project_id);

        let pool = self.pool.clone();
        let project_id = project_id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                sqlx::query("DELETE FROM cuts WHERE project_id = ?")
                    .bind(&project_id)
                    .execute(&pool)
                    .await
                    .map_err(|e| {
                        error!("Failed to delete cuts: {}", e);
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

    fn make_cut(id: &str, project_id: &str, index: i64, start: f64, end: f64) -> Cut {
        Cut {
            id: id.to_string(),
            project_id: project_id.to_string(),
            segment_index: index,
            start_time: start,
            end_time: end,
            created_at: 1706745600,
        }
    }

    #[tokio::test]
    async fn test_save_and_get_cuts() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-cut").await;

        let repo = SqliteCutRepository::new(pool);

        let cuts = vec![
            make_cut("cut-1", "project-cut", 0, 1.0, 3.0),
            make_cut("cut-2", "project-cut", 1, 5.0, 8.0),
        ];

        repo.save_cuts("project-cut", cuts).unwrap();

        let retrieved = repo.get_cuts("project-cut").unwrap();
        assert_eq!(retrieved.len(), 2);
        assert_eq!(retrieved[0].segment_index, 0);
        assert_eq!(retrieved[0].start_time, 1.0);
        assert_eq!(retrieved[1].segment_index, 1);
        assert_eq!(retrieved[1].start_time, 5.0);
    }

    #[tokio::test]
    async fn test_save_replaces_existing() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-replace").await;

        let repo = SqliteCutRepository::new(pool);

        let v1 = vec![make_cut("cut-1", "project-replace", 0, 1.0, 3.0)];
        repo.save_cuts("project-replace", v1).unwrap();

        let v2 = vec![
            make_cut("cut-new-1", "project-replace", 0, 2.0, 4.0),
            make_cut("cut-new-2", "project-replace", 1, 6.0, 9.0),
        ];
        repo.save_cuts("project-replace", v2).unwrap();

        let retrieved = repo.get_cuts("project-replace").unwrap();
        assert_eq!(retrieved.len(), 2);
        assert_eq!(retrieved[0].id, "cut-new-1");
        assert_eq!(retrieved[1].id, "cut-new-2");
    }

    #[tokio::test]
    async fn test_delete_cuts() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-del").await;

        let repo = SqliteCutRepository::new(pool);

        let cuts = vec![
            make_cut("cut-1", "project-del", 0, 1.0, 3.0),
            make_cut("cut-2", "project-del", 1, 5.0, 8.0),
        ];
        repo.save_cuts("project-del", cuts).unwrap();

        repo.delete_cuts("project-del").unwrap();

        let retrieved = repo.get_cuts("project-del").unwrap();
        assert_eq!(retrieved.len(), 0);
    }

    #[tokio::test]
    async fn test_get_cuts_ordered_by_segment_index() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-order").await;

        let repo = SqliteCutRepository::new(pool);

        // Insert out of order
        let cuts = vec![
            make_cut("cut-3", "project-order", 2, 10.0, 12.0),
            make_cut("cut-1", "project-order", 0, 1.0, 3.0),
            make_cut("cut-2", "project-order", 1, 5.0, 8.0),
        ];
        repo.save_cuts("project-order", cuts).unwrap();

        let retrieved = repo.get_cuts("project-order").unwrap();
        assert_eq!(retrieved[0].segment_index, 0);
        assert_eq!(retrieved[1].segment_index, 1);
        assert_eq!(retrieved[2].segment_index, 2);
    }
}
