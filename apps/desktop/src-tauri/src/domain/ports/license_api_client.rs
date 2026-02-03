use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use ts_rs::TS;

#[derive(Error, Debug)]
pub enum LicenseApiError {
    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("License not found")]
    LicenseNotFound,

    #[error("License expired")]
    LicenseExpired,

    #[error("License revoked")]
    LicenseRevoked,

    #[error("Invalid response: {0}")]
    InvalidResponse(String),

    #[error("Timeout after retries")]
    Timeout,

    #[error("Server error: {0}")]
    ServerError(String),
}

/// License verification response from backend API
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct LicenseVerifyResponse {
    pub success: bool,
    #[serde(default)]
    pub data: Option<LicenseData>,
    #[serde(default)]
    pub error: Option<LicenseErrorData>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct LicenseData {
    pub license_key: String,
    pub plan: String,
    pub status: String,
    pub is_valid: bool,
    #[serde(default)]
    pub activated_at: Option<String>,
    #[serde(default)]
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct LicenseErrorData {
    pub code: String,
    pub message: String,
}

/// Port for license API communication
#[async_trait]
pub trait LicenseApiClient: Send + Sync {
    /// Verify a license key with the backend API
    /// Returns license data on success, or error on failure
    async fn verify_license(&self, license_key: &str) -> Result<LicenseData, LicenseApiError>;
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use std::sync::Mutex;

    /// Mock implementation for testing
    pub struct MockLicenseApiClient {
        response: Mutex<Result<LicenseData, LicenseApiError>>,
    }

    impl MockLicenseApiClient {
        pub fn with_success(data: LicenseData) -> Self {
            Self {
                response: Mutex::new(Ok(data)),
            }
        }

        pub fn with_error(error: LicenseApiError) -> Self {
            Self {
                response: Mutex::new(Err(error)),
            }
        }

        pub fn set_response(&self, response: Result<LicenseData, LicenseApiError>) {
            *self.response.lock().unwrap() = response;
        }
    }

    #[async_trait]
    impl LicenseApiClient for MockLicenseApiClient {
        async fn verify_license(&self, _license_key: &str) -> Result<LicenseData, LicenseApiError> {
            let response = self.response.lock().unwrap();
            match &*response {
                Ok(data) => Ok(data.clone()),
                Err(LicenseApiError::NetworkError(msg)) => Err(LicenseApiError::NetworkError(msg.clone())),
                Err(LicenseApiError::LicenseNotFound) => Err(LicenseApiError::LicenseNotFound),
                Err(LicenseApiError::LicenseExpired) => Err(LicenseApiError::LicenseExpired),
                Err(LicenseApiError::LicenseRevoked) => Err(LicenseApiError::LicenseRevoked),
                Err(LicenseApiError::InvalidResponse(msg)) => Err(LicenseApiError::InvalidResponse(msg.clone())),
                Err(LicenseApiError::Timeout) => Err(LicenseApiError::Timeout),
                Err(LicenseApiError::ServerError(msg)) => Err(LicenseApiError::ServerError(msg.clone())),
            }
        }
    }

    pub fn create_test_license_data() -> LicenseData {
        LicenseData {
            license_key: "SPLICE-TEST-1234-5678".to_string(),
            plan: "pro".to_string(),
            status: "active".to_string(),
            is_valid: true,
            activated_at: Some("2026-01-15T10:00:00.000Z".to_string()),
            expires_at: Some("2027-01-15T10:00:00.000Z".to_string()),
        }
    }

    #[tokio::test]
    async fn test_mock_success() {
        let client = MockLicenseApiClient::with_success(create_test_license_data());
        let result = client.verify_license("test").await;
        assert!(result.is_ok());
        let data = result.unwrap();
        assert_eq!(data.plan, "pro");
        assert!(data.is_valid);
    }

    #[tokio::test]
    async fn test_mock_not_found() {
        let client = MockLicenseApiClient::with_error(LicenseApiError::LicenseNotFound);
        let result = client.verify_license("invalid").await;
        assert!(matches!(result, Err(LicenseApiError::LicenseNotFound)));
    }

    #[tokio::test]
    async fn test_mock_network_error() {
        let client = MockLicenseApiClient::with_error(LicenseApiError::NetworkError("Connection refused".to_string()));
        let result = client.verify_license("test").await;
        assert!(matches!(result, Err(LicenseApiError::NetworkError(_))));
    }
}
