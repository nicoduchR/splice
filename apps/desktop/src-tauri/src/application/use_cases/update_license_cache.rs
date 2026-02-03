use std::sync::Arc;

use crate::domain::entities::LicenseCache;
use crate::domain::errors::DomainError;
use crate::domain::repositories::LicenseRepository;
use crate::domain::value_objects::LicensePlan;

/// Use case for updating the license cache
pub struct UpdateLicenseCacheUseCase<R: LicenseRepository> {
    repository: Arc<R>,
}

impl<R: LicenseRepository> UpdateLicenseCacheUseCase<R> {
    pub fn new(repository: Arc<R>) -> Self {
        Self { repository }
    }

    /// Update the license cache with new verification data
    pub async fn execute(
        &self,
        plan: LicensePlan,
        expires_at: Option<i64>,
    ) -> Result<LicenseCache, DomainError> {
        let verified_at = chrono::Utc::now().timestamp();
        let cache = LicenseCache::from_verification(plan, expires_at, verified_at);

        self.repository.update_cache(&cache).await?;

        tracing::info!(
            "License cache updated: plan={}, expires_at={:?}, grace_ends_at={}",
            cache.plan,
            cache.expires_at,
            cache.grace_period_ends_at
        );

        Ok(cache)
    }

    /// Reset the license cache to free plan (e.g., when license is cleared)
    pub async fn reset(&self) -> Result<LicenseCache, DomainError> {
        let cache = LicenseCache::new_free();
        self.repository.update_cache(&cache).await?;

        tracing::info!("License cache reset to free plan");

        Ok(cache)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::repositories::license_repository::tests::MockLicenseRepository;

    #[tokio::test]
    async fn test_update_cache() {
        let repo = Arc::new(MockLicenseRepository::new());
        let use_case = UpdateLicenseCacheUseCase::new(repo.clone());

        let result = use_case
            .execute(LicensePlan::Pro, Some(1738497600))
            .await
            .unwrap();

        assert_eq!(result.plan, LicensePlan::Pro);
        assert_eq!(result.expires_at, Some(1738497600));
        assert!(result.last_verified_at > 0);

        // Verify cache was persisted
        let cache = repo.get_cache().await.unwrap();
        assert_eq!(cache.plan, LicensePlan::Pro);
    }

    #[tokio::test]
    async fn test_reset_cache() {
        // First set up a pro license
        let repo = Arc::new(MockLicenseRepository::with_cache(
            LicenseCache::from_verification(LicensePlan::Pro, None, 1706961600),
        ));
        let use_case = UpdateLicenseCacheUseCase::new(repo.clone());

        // Reset to free
        let result = use_case.reset().await.unwrap();

        assert_eq!(result.plan, LicensePlan::Free);
        assert_eq!(result.last_verified_at, 0);

        // Verify cache was persisted
        let cache = repo.get_cache().await.unwrap();
        assert_eq!(cache.plan, LicensePlan::Free);
    }
}
