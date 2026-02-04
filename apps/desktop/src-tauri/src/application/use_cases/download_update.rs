use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use tauri_plugin_updater::UpdaterExt;

use crate::domain::entities::{DownloadProgress, UpdateStatus};
use crate::domain::errors::DomainError;

/// Result of download operation
#[derive(Debug, Clone)]
pub struct DownloadUpdateResult {
    pub status: UpdateStatus,
    pub error: Option<String>,
}

impl DownloadUpdateResult {
    pub fn ready() -> Self {
        Self {
            status: UpdateStatus::Ready,
            error: None,
        }
    }

    pub fn cancelled() -> Self {
        Self {
            status: UpdateStatus::Idle,
            error: Some("Download cancelled".to_string()),
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            status: UpdateStatus::Error,
            error: Some(message),
        }
    }
}

/// Use case for downloading an available update
pub struct DownloadUpdateUseCase;

impl DownloadUpdateUseCase {
    pub fn new() -> Self {
        Self
    }

    /// Execute update download using tauri-plugin-updater
    ///
    /// # Arguments
    /// * `app` - Tauri app handle
    /// * `cancel_flag` - Atomic flag to signal cancellation
    /// * `progress_callback` - Callback function for progress updates
    ///
    /// # Returns
    /// * `DownloadUpdateResult` with status
    pub async fn execute<R: tauri::Runtime, F>(
        &self,
        app: &tauri::AppHandle<R>,
        cancel_flag: Arc<AtomicBool>,
        mut progress_callback: F,
    ) -> Result<DownloadUpdateResult, DomainError>
    where
        F: FnMut(DownloadProgress) + Send + 'static,
    {
        tracing::info!("Starting update download...");

        // Get the updater instance using UpdaterExt trait
        let updater = match app.updater() {
            Ok(u) => u,
            Err(e) => {
                tracing::error!("Failed to get updater: {}", e);
                return Ok(DownloadUpdateResult::error(format!(
                    "Failed to initialize updater: {}",
                    e
                )));
            }
        };

        // Check for update first (needed to get the update handle)
        let update = match updater.check().await {
            Ok(Some(update)) => update,
            Ok(None) => {
                tracing::warn!("No update available for download");
                return Ok(DownloadUpdateResult::error(
                    "No update available".to_string(),
                ));
            }
            Err(e) => {
                tracing::error!("Update check failed during download: {}", e);
                return Ok(DownloadUpdateResult::error(format!(
                    "Update check failed: {}",
                    e
                )));
            }
        };

        tracing::info!("Downloading update version: {}", update.version);

        // Track download progress
        let mut downloaded: u64 = 0;
        let mut total: Option<u64> = None;

        // Download and install with progress tracking
        let download_result = update
            .download_and_install(
                |chunk_length, content_length| {
                    // Check cancellation
                    if cancel_flag.load(Ordering::SeqCst) {
                        tracing::info!("Download cancelled by user");
                        return;
                    }

                    downloaded += chunk_length as u64;
                    if total.is_none() {
                        total = content_length;
                    }

                    let total_bytes = total.unwrap_or(downloaded);
                    let progress = DownloadProgress::new(downloaded, total_bytes);

                    tracing::debug!(
                        "Download progress: {:.1}% ({}/{})",
                        progress.percent,
                        progress.downloaded_bytes,
                        progress.total_bytes
                    );

                    progress_callback(progress);
                },
                || {
                    // Called before install
                    tracing::info!("Download finished, preparing to install");
                },
            )
            .await;

        // Check if cancelled
        if cancel_flag.load(Ordering::SeqCst) {
            return Ok(DownloadUpdateResult::cancelled());
        }

        match download_result {
            Ok(()) => {
                tracing::info!("Update downloaded and ready to install");

                // Emit final progress
                let final_total = total.unwrap_or(downloaded);
                progress_callback(DownloadProgress::complete(final_total));

                Ok(DownloadUpdateResult::ready())
            }
            Err(e) => {
                tracing::error!("Download failed: {}", e);
                Ok(DownloadUpdateResult::error(format!("Download failed: {}", e)))
            }
        }
    }
}

impl Default for DownloadUpdateUseCase {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_download_result_ready() {
        let result = DownloadUpdateResult::ready();
        assert_eq!(result.status, UpdateStatus::Ready);
        assert!(result.error.is_none());
    }

    #[test]
    fn test_download_result_cancelled() {
        let result = DownloadUpdateResult::cancelled();
        assert_eq!(result.status, UpdateStatus::Idle);
        assert!(result.error.is_some());
        assert!(result.error.unwrap().contains("cancelled"));
    }

    #[test]
    fn test_download_result_error() {
        let result = DownloadUpdateResult::error("Network error".to_string());
        assert_eq!(result.status, UpdateStatus::Error);
        assert!(result.error.is_some());
    }
}
