use async_trait::async_trait;
use sqlx::{FromRow, SqlitePool};

use crate::domain::entities::LicenseCache;
use crate::domain::errors::DomainError;
use crate::domain::repositories::LicenseRepository;
use crate::domain::value_objects::LicensePlan;

/// Row type for SQLite query results
#[derive(FromRow)]
struct LicenseCacheRow {
    plan: String,
    last_verified_at: i64,
    expires_at: Option<i64>,
    grace_period_ends_at: i64,
}

/// SQLite implementation of LicenseRepository
pub struct SqliteLicenseRepository {
    pool: SqlitePool,
}

impl SqliteLicenseRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl LicenseRepository for SqliteLicenseRepository {
    async fn get_cache(&self) -> Result<LicenseCache, DomainError> {
        let row: Option<LicenseCacheRow> = sqlx::query_as(
            r#"
            SELECT plan, last_verified_at, expires_at, grace_period_ends_at
            FROM license_cache
            WHERE id = 1
            "#,
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::DatabaseError(e.to_string()))?;

        match row {
            Some(r) => Ok(LicenseCache {
                plan: LicensePlan::from(r.plan),
                last_verified_at: r.last_verified_at,
                expires_at: r.expires_at,
                grace_period_ends_at: r.grace_period_ends_at,
            }),
            None => {
                // Return default free cache if row doesn't exist
                Ok(LicenseCache::new_free())
            }
        }
    }

    async fn update_cache(&self, cache: &LicenseCache) -> Result<(), DomainError> {
        sqlx::query(
            r#"
            INSERT INTO license_cache (id, plan, last_verified_at, expires_at, grace_period_ends_at)
            VALUES (1, ?1, ?2, ?3, ?4)
            ON CONFLICT(id) DO UPDATE SET
                plan = excluded.plan,
                last_verified_at = excluded.last_verified_at,
                expires_at = excluded.expires_at,
                grace_period_ends_at = excluded.grace_period_ends_at
            "#,
        )
        .bind(cache.plan.to_string())
        .bind(cache.last_verified_at)
        .bind(cache.expires_at)
        .bind(cache.grace_period_ends_at)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::DatabaseError(e.to_string()))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use sqlx::Executor;

    async fn create_test_pool() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create test pool");

        // Create the license_cache table
        pool.execute(
            r#"
            CREATE TABLE license_cache (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                plan TEXT NOT NULL DEFAULT 'free',
                last_verified_at INTEGER NOT NULL,
                expires_at INTEGER,
                grace_period_ends_at INTEGER NOT NULL
            );
            INSERT OR IGNORE INTO license_cache (id, plan, last_verified_at, grace_period_ends_at)
            VALUES (1, 'free', 0, 0);
            "#,
        )
        .await
        .expect("Failed to create test table");

        pool
    }

    #[tokio::test]
    async fn test_get_default_cache() {
        let pool = create_test_pool().await;
        let repo = SqliteLicenseRepository::new(pool);

        let cache = repo.get_cache().await.unwrap();
        assert_eq!(cache.plan, LicensePlan::Free);
        assert_eq!(cache.last_verified_at, 0);
    }

    #[tokio::test]
    async fn test_update_and_get_cache() {
        let pool = create_test_pool().await;
        let repo = SqliteLicenseRepository::new(pool);

        let new_cache = LicenseCache::from_verification(
            LicensePlan::Pro,
            Some(1738497600),
            1706961600,
        );

        repo.update_cache(&new_cache).await.unwrap();

        let cache = repo.get_cache().await.unwrap();
        assert_eq!(cache.plan, LicensePlan::Pro);
        assert_eq!(cache.last_verified_at, 1706961600);
        assert_eq!(cache.expires_at, Some(1738497600));
    }

    #[tokio::test]
    async fn test_update_cache_upsert() {
        let pool = create_test_pool().await;
        let repo = SqliteLicenseRepository::new(pool);

        // First update
        let cache1 = LicenseCache::from_verification(LicensePlan::Pro, None, 1000);
        repo.update_cache(&cache1).await.unwrap();

        // Second update (should upsert)
        let cache2 = LicenseCache::from_verification(LicensePlan::Free, Some(2000), 1500);
        repo.update_cache(&cache2).await.unwrap();

        let cache = repo.get_cache().await.unwrap();
        assert_eq!(cache.plan, LicensePlan::Free);
        assert_eq!(cache.last_verified_at, 1500);
        assert_eq!(cache.expires_at, Some(2000));
    }
}
