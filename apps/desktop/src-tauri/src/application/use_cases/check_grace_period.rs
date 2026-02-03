use std::sync::Arc;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::domain::errors::DomainError;
use crate::domain::repositories::LicenseRepository;

/// Result of grace period check
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct GracePeriodStatus {
    /// Whether the grace period is still valid
    pub is_valid: bool,
    /// Days remaining in grace period (0 if expired)
    pub days_remaining: i64,
    /// Whether the license has ever been verified online
    pub has_been_verified: bool,
    /// Unix timestamp when grace period ends
    pub grace_period_ends_at: i64,
}

/// Use case for checking offline grace period validity
pub struct CheckGracePeriodUseCase<R: LicenseRepository> {
    repository: Arc<R>,
}

impl<R: LicenseRepository> CheckGracePeriodUseCase<R> {
    pub fn new(repository: Arc<R>) -> Self {
        Self { repository }
    }

    /// Check if the offline grace period is still valid
    pub async fn execute(&self) -> Result<GracePeriodStatus, DomainError> {
        let cache = self.repository.get_cache().await?;
        let current_time = chrono::Utc::now().timestamp();

        let status = GracePeriodStatus {
            is_valid: cache.is_grace_period_valid(current_time),
            days_remaining: cache.days_until_grace_expires(current_time),
            has_been_verified: cache.has_been_verified(),
            grace_period_ends_at: cache.grace_period_ends_at,
        };

        tracing::debug!(
            "Grace period check: valid={}, days_remaining={}, verified={}",
            status.is_valid,
            status.days_remaining,
            status.has_been_verified
        );

        Ok(status)
    }

    /// Check grace period with a specific timestamp (for testing)
    pub async fn execute_at(&self, current_time: i64) -> Result<GracePeriodStatus, DomainError> {
        let cache = self.repository.get_cache().await?;

        Ok(GracePeriodStatus {
            is_valid: cache.is_grace_period_valid(current_time),
            days_remaining: cache.days_until_grace_expires(current_time),
            has_been_verified: cache.has_been_verified(),
            grace_period_ends_at: cache.grace_period_ends_at,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::entities::LicenseCache;
    use crate::domain::repositories::license_repository::tests::MockLicenseRepository;
    use crate::domain::value_objects::LicensePlan;

    #[tokio::test]
    async fn test_grace_period_never_verified() {
        let repo = Arc::new(MockLicenseRepository::new());
        let use_case = CheckGracePeriodUseCase::new(repo);

        let status = use_case.execute().await.unwrap();

        assert!(!status.is_valid);
        assert!(!status.has_been_verified);
        assert_eq!(status.days_remaining, 0);
    }

    #[tokio::test]
    async fn test_grace_period_valid() {
        let verified_at = chrono::Utc::now().timestamp();
        let cache = LicenseCache::from_verification(LicensePlan::Pro, None, verified_at);
        let repo = Arc::new(MockLicenseRepository::with_cache(cache));
        let use_case = CheckGracePeriodUseCase::new(repo);

        let status = use_case.execute().await.unwrap();

        assert!(status.is_valid);
        assert!(status.has_been_verified);
        assert!(status.days_remaining > 0);
    }

    #[tokio::test]
    async fn test_grace_period_expired() {
        // Verified 10 days ago
        let verified_at = chrono::Utc::now().timestamp() - (10 * 24 * 60 * 60);
        let cache = LicenseCache::from_verification(LicensePlan::Pro, None, verified_at);
        let repo = Arc::new(MockLicenseRepository::with_cache(cache));
        let use_case = CheckGracePeriodUseCase::new(repo);

        let status = use_case.execute().await.unwrap();

        assert!(!status.is_valid);
        assert!(status.has_been_verified);
        assert_eq!(status.days_remaining, 0);
    }

    #[tokio::test]
    async fn test_grace_period_at_specific_time() {
        let verified_at = 1706961600; // Fixed timestamp
        let cache = LicenseCache::from_verification(LicensePlan::Pro, None, verified_at);
        let repo = Arc::new(MockLicenseRepository::with_cache(cache));
        let use_case = CheckGracePeriodUseCase::new(repo);

        // 3 days after verification
        let test_time = verified_at + (3 * 24 * 60 * 60);
        let status = use_case.execute_at(test_time).await.unwrap();

        assert!(status.is_valid);
        assert_eq!(status.days_remaining, 4); // 7 - 3 = 4 days remaining
    }
}
