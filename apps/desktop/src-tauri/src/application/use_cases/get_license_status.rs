use std::sync::Arc;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::domain::errors::DomainError;
use crate::domain::repositories::LicenseRepository;
use crate::domain::value_objects::LicensePlan;

/// Complete license status for the frontend
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct LicenseStatus {
    /// Current license plan
    pub plan: LicensePlan,
    /// Whether the license has been verified at least once
    pub is_verified: bool,
    /// Unix timestamp of last successful verification (0 if never)
    pub last_verified_at: i64,
    /// Unix timestamp when grace period ends
    pub grace_period_ends_at: i64,
    /// Unix timestamp when license expires (null for lifetime)
    pub expires_at: Option<i64>,
    /// Whether the grace period is currently valid
    pub is_grace_period_valid: bool,
    /// Days remaining in grace period
    pub days_until_grace_expires: i64,
    /// Whether the license subscription is expired
    pub is_license_expired: bool,
    /// Whether app functionality should be blocked
    pub is_blocked: bool,
}

/// Use case for getting complete license status
pub struct GetLicenseStatusUseCase<R: LicenseRepository> {
    repository: Arc<R>,
}

impl<R: LicenseRepository> GetLicenseStatusUseCase<R> {
    pub fn new(repository: Arc<R>) -> Self {
        Self { repository }
    }

    /// Get the complete license status
    pub async fn execute(&self) -> Result<LicenseStatus, DomainError> {
        let cache = self.repository.get_cache().await?;
        let current_time = chrono::Utc::now().timestamp();

        let is_grace_period_valid = cache.is_grace_period_valid(current_time);
        let is_license_expired = cache.is_license_expired(current_time);

        // App is blocked if:
        // 1. License was verified but grace period expired (offline too long)
        // 2. License subscription expired
        let is_blocked = (cache.has_been_verified() && !is_grace_period_valid)
            || is_license_expired;

        let status = LicenseStatus {
            plan: cache.plan,
            is_verified: cache.has_been_verified(),
            last_verified_at: cache.last_verified_at,
            grace_period_ends_at: cache.grace_period_ends_at,
            expires_at: cache.expires_at,
            is_grace_period_valid,
            days_until_grace_expires: cache.days_until_grace_expires(current_time),
            is_license_expired,
            is_blocked,
        };

        tracing::debug!(
            "License status: plan={}, verified={}, blocked={}",
            status.plan,
            status.is_verified,
            status.is_blocked
        );

        Ok(status)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::entities::LicenseCache;
    use crate::domain::repositories::license_repository::tests::MockLicenseRepository;

    #[tokio::test]
    async fn test_status_never_verified() {
        let repo = Arc::new(MockLicenseRepository::new());
        let use_case = GetLicenseStatusUseCase::new(repo);

        let status = use_case.execute().await.unwrap();

        assert_eq!(status.plan, LicensePlan::Free);
        assert!(!status.is_verified);
        assert!(!status.is_blocked); // Not blocked - new user can still use app
    }

    #[tokio::test]
    async fn test_status_valid_grace_period() {
        let verified_at = chrono::Utc::now().timestamp();
        let cache = LicenseCache::from_verification(LicensePlan::Pro, None, verified_at);
        let repo = Arc::new(MockLicenseRepository::with_cache(cache));
        let use_case = GetLicenseStatusUseCase::new(repo);

        let status = use_case.execute().await.unwrap();

        assert_eq!(status.plan, LicensePlan::Pro);
        assert!(status.is_verified);
        assert!(status.is_grace_period_valid);
        assert!(!status.is_blocked);
    }

    #[tokio::test]
    async fn test_status_expired_grace_period() {
        // Verified 10 days ago - grace period expired
        let verified_at = chrono::Utc::now().timestamp() - (10 * 24 * 60 * 60);
        let cache = LicenseCache::from_verification(LicensePlan::Pro, None, verified_at);
        let repo = Arc::new(MockLicenseRepository::with_cache(cache));
        let use_case = GetLicenseStatusUseCase::new(repo);

        let status = use_case.execute().await.unwrap();

        assert!(status.is_verified);
        assert!(!status.is_grace_period_valid);
        assert!(status.is_blocked); // Blocked - grace period expired
    }

    #[tokio::test]
    async fn test_status_expired_license() {
        // License expired yesterday
        let expires_at = chrono::Utc::now().timestamp() - (24 * 60 * 60);
        let verified_at = chrono::Utc::now().timestamp();
        let cache = LicenseCache::from_verification(LicensePlan::Pro, Some(expires_at), verified_at);
        let repo = Arc::new(MockLicenseRepository::with_cache(cache));
        let use_case = GetLicenseStatusUseCase::new(repo);

        let status = use_case.execute().await.unwrap();

        assert!(status.is_license_expired);
        assert!(status.is_blocked); // Blocked - license expired
    }
}
