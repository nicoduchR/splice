use tauri_plugin_updater::UpdaterExt;

use crate::domain::entities::{UpdateInfo, UpdateStatus};
use crate::domain::errors::DomainError;
use crate::domain::value_objects::AppVersion;

/// Result of checking for updates
#[derive(Debug, Clone)]
pub struct CheckUpdateResult {
    pub status: UpdateStatus,
    pub update_info: Option<UpdateInfo>,
    pub error: Option<String>,
}

impl CheckUpdateResult {
    pub fn available(info: UpdateInfo) -> Self {
        Self {
            status: UpdateStatus::Available,
            update_info: Some(info),
            error: None,
        }
    }

    pub fn up_to_date() -> Self {
        Self {
            status: UpdateStatus::UpToDate,
            update_info: None,
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            status: UpdateStatus::Error,
            update_info: None,
            error: Some(message),
        }
    }
}

/// Use case for checking if a new update is available
pub struct CheckForUpdateUseCase;

impl CheckForUpdateUseCase {
    pub fn new() -> Self {
        Self
    }

    /// Execute update check using tauri-plugin-updater
    ///
    /// # Arguments
    /// * `app` - Tauri app handle
    ///
    /// # Returns
    /// * `CheckUpdateResult` with status and optional update info
    pub async fn execute<R: tauri::Runtime>(
        &self,
        app: &tauri::AppHandle<R>,
    ) -> Result<CheckUpdateResult, DomainError> {
        tracing::info!("Checking for updates...");

        // Get the updater instance using UpdaterExt trait
        let updater = match app.updater() {
            Ok(u) => u,
            Err(e) => {
                tracing::error!("Failed to get updater: {}", e);
                return Ok(CheckUpdateResult::error(format!(
                    "Failed to initialize updater: {}",
                    e
                )));
            }
        };

        // Check for updates
        match updater.check().await {
            Ok(Some(update)) => {
                let version = update.version.clone();
                let body = update.body.clone().unwrap_or_default();
                let date = update
                    .date
                    .map(|d: time::OffsetDateTime| {
                        d.format(&time::format_description::well_known::Rfc3339)
                            .unwrap_or_default()
                    })
                    .unwrap_or_default();

                tracing::info!("Update available: {}", version);

                // Verify it's actually a newer version
                let current_version = app
                    .config()
                    .version
                    .clone()
                    .unwrap_or_else(|| "0.0.0".to_string());
                let current = AppVersion::parse(&current_version).map_err(|e| {
                    DomainError::UpdateCheckFailed(format!("Invalid current version: {}", e))
                })?;
                let new = AppVersion::parse(&version).map_err(|e| {
                    DomainError::UpdateCheckFailed(format!("Invalid update version: {}", e))
                })?;

                if !new.is_greater_than(&current) {
                    tracing::debug!(
                        "Update version {} is not greater than current {}",
                        version,
                        current_version
                    );
                    return Ok(CheckUpdateResult::up_to_date());
                }

                let update_info = UpdateInfo::new(
                    version,
                    date,
                    body,
                    String::new(), // URL not exposed by the plugin directly
                    false,         // TODO: Support mandatory updates
                );

                Ok(CheckUpdateResult::available(update_info))
            }
            Ok(None) => {
                tracing::info!("No update available - already on latest version");
                Ok(CheckUpdateResult::up_to_date())
            }
            Err(e) => {
                tracing::warn!("Update check failed: {}", e);
                Ok(CheckUpdateResult::error(format!("Update check failed: {}", e)))
            }
        }
    }
}

impl Default for CheckForUpdateUseCase {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_update_result_available() {
        let info = UpdateInfo::new(
            "1.2.0".to_string(),
            "2024-01-15".to_string(),
            "Bug fixes".to_string(),
            "https://example.com/update".to_string(),
            false,
        );
        let result = CheckUpdateResult::available(info);

        assert_eq!(result.status, UpdateStatus::Available);
        assert!(result.update_info.is_some());
        assert!(result.error.is_none());
    }

    #[test]
    fn test_check_update_result_up_to_date() {
        let result = CheckUpdateResult::up_to_date();

        assert_eq!(result.status, UpdateStatus::UpToDate);
        assert!(result.update_info.is_none());
        assert!(result.error.is_none());
    }

    #[test]
    fn test_check_update_result_error() {
        let result = CheckUpdateResult::error("Network error".to_string());

        assert_eq!(result.status, UpdateStatus::Error);
        assert!(result.update_info.is_none());
        assert!(result.error.is_some());
        assert_eq!(result.error.unwrap(), "Network error");
    }
}
