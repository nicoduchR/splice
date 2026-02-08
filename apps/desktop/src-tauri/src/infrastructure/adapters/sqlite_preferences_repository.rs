use crate::domain::errors::DomainError;
use crate::domain::repositories::PreferencesRepository;
use sqlx::SqlitePool;
use sqlx::Row;
use tracing::{debug, error, info};
use std::time::{SystemTime, UNIX_EPOCH};

/// SQLite implementation of PreferencesRepository
pub struct SqlitePreferencesRepository {
    pool: SqlitePool,
}

impl SqlitePreferencesRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    fn now_timestamp() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64
    }
}

impl PreferencesRepository for SqlitePreferencesRepository {
    fn get(&self, key: &str) -> Result<Option<String>, DomainError> {
        debug!(event = "get_preference", key = key);

        let pool = self.pool.clone();
        let key = key.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let row = sqlx::query(
                    "SELECT value FROM user_preferences WHERE key = ?"
                )
                .bind(&key)
                .fetch_optional(&pool)
                .await
                .map_err(|e| {
                    error!("Failed to get preference '{}': {}", key, e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                Ok(row.map(|r| r.get("value")))
            })
        })
    }

    fn set(&self, key: &str, value: &str) -> Result<(), DomainError> {
        info!(event = "set_preference", key = key, "Setting preference");

        let pool = self.pool.clone();
        let key = key.to_string();
        let value = value.to_string();
        let now = Self::now_timestamp();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                sqlx::query(
                    "INSERT INTO user_preferences (key, value, updated_at)
                     VALUES (?, ?, ?)
                     ON CONFLICT(key) DO UPDATE SET
                         value = excluded.value,
                         updated_at = excluded.updated_at"
                )
                .bind(&key)
                .bind(&value)
                .bind(now)
                .execute(&pool)
                .await
                .map_err(|e| {
                    error!("Failed to set preference '{}': {}", key, e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                Ok(())
            })
        })
    }

    fn delete(&self, key: &str) -> Result<(), DomainError> {
        info!(event = "delete_preference", key = key, "Deleting preference");

        let pool = self.pool.clone();
        let key = key.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                sqlx::query(
                    "DELETE FROM user_preferences WHERE key = ?"
                )
                .bind(&key)
                .execute(&pool)
                .await
                .map_err(|e| {
                    error!("Failed to delete preference '{}': {}", key, e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                Ok(())
            })
        })
    }

    fn get_all(&self) -> Result<Vec<(String, String)>, DomainError> {
        debug!(event = "get_all_preferences");

        let pool = self.pool.clone();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let rows = sqlx::query(
                    "SELECT key, value FROM user_preferences ORDER BY key"
                )
                .fetch_all(&pool)
                .await
                .map_err(|e| {
                    error!("Failed to get all preferences: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                Ok(rows.iter().map(|r| {
                    let key: String = r.get("key");
                    let value: String = r.get("value");
                    (key, value)
                }).collect())
            })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

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

    #[tokio::test(flavor = "multi_thread")]
    async fn test_set_and_get_preference() {
        let pool = create_test_pool().await;
        let repo = SqlitePreferencesRepository::new(pool);

        repo.set("temp_directory", "/custom/path").unwrap();

        let value = repo.get("temp_directory").unwrap();
        assert_eq!(value, Some("/custom/path".to_string()));
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_get_nonexistent_returns_none() {
        let pool = create_test_pool().await;
        let repo = SqlitePreferencesRepository::new(pool);

        let value = repo.get("nonexistent_key").unwrap();
        assert!(value.is_none());
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_set_upserts_existing() {
        let pool = create_test_pool().await;
        let repo = SqlitePreferencesRepository::new(pool);

        repo.set("temp_directory", "/path/v1").unwrap();
        repo.set("temp_directory", "/path/v2").unwrap();

        let value = repo.get("temp_directory").unwrap();
        assert_eq!(value, Some("/path/v2".to_string()));
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_delete_preference() {
        let pool = create_test_pool().await;
        let repo = SqlitePreferencesRepository::new(pool);

        repo.set("temp_directory", "/custom/path").unwrap();
        repo.delete("temp_directory").unwrap();

        let value = repo.get("temp_directory").unwrap();
        assert!(value.is_none());
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_delete_nonexistent_is_noop() {
        let pool = create_test_pool().await;
        let repo = SqlitePreferencesRepository::new(pool);

        // Should not error
        repo.delete("nonexistent_key").unwrap();
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_get_all_preferences() {
        let pool = create_test_pool().await;
        let repo = SqlitePreferencesRepository::new(pool);

        repo.set("key_a", "value_a").unwrap();
        repo.set("key_b", "value_b").unwrap();
        repo.set("temp_directory", "/custom").unwrap();

        let all = repo.get_all().unwrap();
        assert_eq!(all.len(), 3);
        assert_eq!(all[0], ("key_a".to_string(), "value_a".to_string()));
        assert_eq!(all[1], ("key_b".to_string(), "value_b".to_string()));
        assert_eq!(all[2], ("temp_directory".to_string(), "/custom".to_string()));
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_get_all_empty() {
        let pool = create_test_pool().await;
        let repo = SqlitePreferencesRepository::new(pool);

        let all = repo.get_all().unwrap();
        assert!(all.is_empty());
    }
}
