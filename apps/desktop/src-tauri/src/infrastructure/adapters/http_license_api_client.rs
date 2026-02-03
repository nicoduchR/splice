use async_trait::async_trait;
use reqwest::Client;
use serde::Serialize;
use std::time::Duration;

use crate::domain::ports::{
    LicenseApiClient, LicenseApiError, LicenseData, LicenseVerifyResponse,
};

/// Default API URL - DEVELOPMENT ONLY. Set SPLICE_API_URL env var in production.
const DEFAULT_API_URL: &str = "http://localhost:3001";
const TIMEOUT_SECS: u64 = 5;
/// Total attempts (1 initial + 3 retries = 4 attempts per AC3 "after 3 retries")
const MAX_ATTEMPTS: u32 = 4;
const INITIAL_BACKOFF_MS: u64 = 500;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VerifyRequest {
    license_key: String,
}

/// HTTP implementation of LicenseApiClient
pub struct HttpLicenseApiClient {
    client: Client,
    base_url: String,
    api_key: Option<String>,
}

impl HttpLicenseApiClient {
    pub fn new() -> Self {
        let api_url = std::env::var("SPLICE_API_URL")
            .unwrap_or_else(|_| {
                tracing::warn!("SPLICE_API_URL not set, using development URL: {}", DEFAULT_API_URL);
                DEFAULT_API_URL.to_string()
            });

        let api_key = std::env::var("SPLICE_API_KEY").ok();
        if api_key.is_none() {
            tracing::warn!("SPLICE_API_KEY not set - API requests may fail authentication");
        }

        let client = Client::builder()
            .timeout(Duration::from_secs(TIMEOUT_SECS))
            .build()
            .expect("Failed to build HTTP client");

        Self {
            client,
            base_url: api_url,
            api_key,
        }
    }

    pub fn with_url(base_url: &str) -> Self {
        let api_key = std::env::var("SPLICE_API_KEY").ok();

        let client = Client::builder()
            .timeout(Duration::from_secs(TIMEOUT_SECS))
            .build()
            .expect("Failed to build HTTP client");

        Self {
            client,
            base_url: base_url.to_string(),
            api_key,
        }
    }

    async fn verify_with_retry(&self, license_key: &str) -> Result<LicenseData, LicenseApiError> {
        let mut last_error = LicenseApiError::Timeout;
        let mut backoff = INITIAL_BACKOFF_MS;

        // Mask license key for logging (show only prefix)
        let key_prefix = if license_key.len() >= 6 {
            &license_key[..6]
        } else {
            "***"
        };

        for attempt in 1..=MAX_ATTEMPTS {
            tracing::debug!(
                "License verification attempt {}/{} for key: {}***",
                attempt,
                MAX_ATTEMPTS,
                key_prefix
            );

            match self.do_verify(license_key).await {
                Ok(data) => return Ok(data),
                Err(e) => {
                    // Don't retry on non-retryable errors
                    if matches!(
                        e,
                        LicenseApiError::LicenseNotFound
                            | LicenseApiError::LicenseExpired
                            | LicenseApiError::LicenseRevoked
                            | LicenseApiError::InvalidResponse(_)
                    ) {
                        return Err(e);
                    }

                    last_error = e;

                    if attempt < MAX_ATTEMPTS {
                        tracing::warn!(
                            "Verification attempt {} failed, retrying in {}ms...",
                            attempt,
                            backoff
                        );
                        tokio::time::sleep(Duration::from_millis(backoff)).await;
                        backoff *= 2; // Exponential backoff
                    }
                }
            }
        }

        Err(last_error)
    }

    async fn do_verify(&self, license_key: &str) -> Result<LicenseData, LicenseApiError> {
        let url = format!("{}/api/v1/license/verify", self.base_url);

        let request_body = VerifyRequest {
            license_key: license_key.to_string(),
        };

        let mut request = self.client.post(&url).json(&request_body);

        // Add API key header if configured
        if let Some(ref api_key) = self.api_key {
            request = request.header("X-API-Key", api_key);
        }

        let response = request
            .send()
            .await
            .map_err(|e| {
                if e.is_timeout() {
                    LicenseApiError::Timeout
                } else if e.is_connect() {
                    LicenseApiError::NetworkError(format!("Connection failed: {}", e))
                } else {
                    LicenseApiError::NetworkError(e.to_string())
                }
            })?;

        let status = response.status();

        if status.is_server_error() {
            return Err(LicenseApiError::ServerError(format!(
                "Server returned {}",
                status
            )));
        }

        let body: LicenseVerifyResponse = response
            .json()
            .await
            .map_err(|e| LicenseApiError::InvalidResponse(e.to_string()))?;

        if body.success {
            body.data
                .ok_or_else(|| LicenseApiError::InvalidResponse("Missing data in response".to_string()))
        } else {
            // Handle error response
            let error = body.error.unwrap_or_else(|| crate::domain::ports::LicenseErrorData {
                code: "UNKNOWN".to_string(),
                message: "Unknown error".to_string(),
            });

            match error.code.as_str() {
                "LICENSE_NOT_FOUND" => Err(LicenseApiError::LicenseNotFound),
                "LICENSE_EXPIRED" => Err(LicenseApiError::LicenseExpired),
                "LICENSE_REVOKED" => Err(LicenseApiError::LicenseRevoked),
                _ => Err(LicenseApiError::ServerError(error.message)),
            }
        }
    }
}

impl Default for HttpLicenseApiClient {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl LicenseApiClient for HttpLicenseApiClient {
    async fn verify_license(&self, license_key: &str) -> Result<LicenseData, LicenseApiError> {
        self.verify_with_retry(license_key).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_url() {
        let client = HttpLicenseApiClient::new();
        // When SPLICE_API_URL is not set, uses default
        assert!(client.base_url.contains("localhost") || client.base_url.contains("splice"));
    }

    #[test]
    fn test_with_custom_url() {
        let client = HttpLicenseApiClient::with_url("https://api.example.com");
        assert_eq!(client.base_url, "https://api.example.com");
    }

    #[test]
    fn test_constants() {
        // Verify timeout and retry configuration
        assert_eq!(TIMEOUT_SECS, 5);
        assert_eq!(MAX_ATTEMPTS, 4); // 1 initial + 3 retries per AC3
        assert_eq!(INITIAL_BACKOFF_MS, 500);
    }

    #[test]
    fn test_api_key_from_env() {
        // Note: This test documents behavior; actual env var tests
        // are better suited for integration tests with proper env setup
        let client = HttpLicenseApiClient::new();
        // api_key will be None unless SPLICE_API_KEY is set in the test environment
        // We just verify the field exists and is accessible
        let _ = &client.api_key;
    }

    // Integration tests would require a mock server
    // These are better suited for the integration test suite
    // The following scenarios require mock server setup:
    // - Timeout handling (LicenseApiError::Timeout)
    // - Server error 500 handling
    // - Malformed API response (InvalidResponse)
    // - Retry behavior with exponential backoff
}
