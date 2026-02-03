use std::sync::Arc;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::domain::entities::LicenseCache;
use crate::domain::errors::DomainError;
use crate::domain::ports::{LicenseApiClient, LicenseApiError, LicenseData};
use crate::domain::repositories::LicenseRepository;
use crate::domain::value_objects::LicensePlan;

/// Result of online license verification
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct VerifyLicenseResult {
    pub is_valid: bool,
    pub plan: LicensePlan,
    pub expires_at: Option<i64>,
    pub error: Option<String>,
}

/// Use case for verifying a license online with the backend API
pub struct VerifyLicenseOnlineUseCase<R: LicenseRepository, C: LicenseApiClient> {
    repository: Arc<R>,
    api_client: Arc<C>,
}

impl<R: LicenseRepository, C: LicenseApiClient> VerifyLicenseOnlineUseCase<R, C> {
    pub fn new(repository: Arc<R>, api_client: Arc<C>) -> Self {
        Self {
            repository,
            api_client,
        }
    }

    /// Execute online license verification
    /// - Calls backend API to verify license
    /// - Updates license cache on success
    /// - Returns verification result
    pub async fn execute(&self, license_key: &str) -> Result<VerifyLicenseResult, DomainError> {
        tracing::info!("Verifying license online...");

        match self.api_client.verify_license(license_key).await {
            Ok(data) => {
                let result = self.handle_success(data).await?;
                tracing::info!("License verified successfully: plan={}", result.plan);
                Ok(result)
            }
            Err(e) => {
                let result = self.handle_error(e);
                tracing::warn!("License verification failed: {:?}", result.error);
                Ok(result)
            }
        }
    }

    async fn handle_success(&self, data: LicenseData) -> Result<VerifyLicenseResult, DomainError> {
        let plan = LicensePlan::from(data.plan.as_str());
        let expires_at = parse_iso_timestamp(&data.expires_at);
        let verified_at = chrono::Utc::now().timestamp();

        // Update cache with new verification data
        let cache = LicenseCache::from_verification(plan, expires_at, verified_at);
        self.repository.update_cache(&cache).await?;

        Ok(VerifyLicenseResult {
            is_valid: data.is_valid,
            plan,
            expires_at,
            error: None,
        })
    }

    fn handle_error(&self, error: LicenseApiError) -> VerifyLicenseResult {
        let error_message = match &error {
            LicenseApiError::NetworkError(msg) => format!("Network error: {}", msg),
            LicenseApiError::LicenseNotFound => "License not found".to_string(),
            LicenseApiError::LicenseExpired => "License expired".to_string(),
            LicenseApiError::LicenseRevoked => "License revoked".to_string(),
            LicenseApiError::InvalidResponse(msg) => format!("Invalid response: {}", msg),
            LicenseApiError::Timeout => "Request timed out".to_string(),
            LicenseApiError::ServerError(msg) => format!("Server error: {}", msg),
            LicenseApiError::EarlyAdopterCodeInvalid => "Early adopter code invalid".to_string(),
            LicenseApiError::EarlyAdopterCodeAlreadyUsed => "Early adopter code already used".to_string(),
            LicenseApiError::EarlyAdopterCodeExpired => "Early adopter code expired".to_string(),
        };

        VerifyLicenseResult {
            is_valid: false,
            plan: LicensePlan::Free,
            expires_at: None,
            error: Some(error_message),
        }
    }
}

/// Parse ISO 8601 timestamp to Unix timestamp
fn parse_iso_timestamp(iso: &Option<String>) -> Option<i64> {
    iso.as_ref().and_then(|s| {
        chrono::DateTime::parse_from_rfc3339(s)
            .ok()
            .map(|dt| dt.timestamp())
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::ports::license_api_client::tests::{
        create_test_license_data, MockLicenseApiClient,
    };
    use crate::domain::repositories::license_repository::tests::MockLicenseRepository;

    #[tokio::test]
    async fn test_verify_success() {
        let repo = Arc::new(MockLicenseRepository::new());
        let client = Arc::new(MockLicenseApiClient::with_success(create_test_license_data()));
        let use_case = VerifyLicenseOnlineUseCase::new(repo.clone(), client);

        let result = use_case.execute("SPLICE-TEST-1234").await.unwrap();

        assert!(result.is_valid);
        assert_eq!(result.plan, LicensePlan::Pro);
        assert!(result.error.is_none());

        // Verify cache was updated
        let cache = repo.get_cache().await.unwrap();
        assert_eq!(cache.plan, LicensePlan::Pro);
        assert!(cache.last_verified_at > 0);
    }

    #[tokio::test]
    async fn test_verify_not_found() {
        let repo = Arc::new(MockLicenseRepository::new());
        let client = Arc::new(MockLicenseApiClient::with_error(
            LicenseApiError::LicenseNotFound,
        ));
        let use_case = VerifyLicenseOnlineUseCase::new(repo, client);

        let result = use_case.execute("INVALID-KEY").await.unwrap();

        assert!(!result.is_valid);
        assert_eq!(result.plan, LicensePlan::Free);
        assert!(result.error.is_some());
        assert!(result.error.unwrap().contains("not found"));
    }

    #[tokio::test]
    async fn test_verify_network_error() {
        let repo = Arc::new(MockLicenseRepository::new());
        let client = Arc::new(MockLicenseApiClient::with_error(
            LicenseApiError::NetworkError("Connection refused".to_string()),
        ));
        let use_case = VerifyLicenseOnlineUseCase::new(repo, client);

        let result = use_case.execute("SPLICE-TEST").await.unwrap();

        assert!(!result.is_valid);
        assert!(result.error.is_some());
        assert!(result.error.unwrap().contains("Network"));
    }

    #[test]
    fn test_parse_iso_timestamp() {
        let valid = Some("2027-01-15T10:00:00.000Z".to_string());
        let result = parse_iso_timestamp(&valid);
        assert!(result.is_some());
        assert!(result.unwrap() > 0);

        let invalid = Some("invalid".to_string());
        let result = parse_iso_timestamp(&invalid);
        assert!(result.is_none());

        let none: Option<String> = None;
        let result = parse_iso_timestamp(&none);
        assert!(result.is_none());
    }
}
