use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use tauri_plugin_updater::UpdaterExt;

use crate::domain::entities::{DownloadProgress, UpdateStatus};
use crate::domain::errors::DomainError;

/// Result of download operation
#[derive(Debug, Clone)]
pub struct DownloadUpdateResult {
    pub status: UpdateStatus,
    pub version: Option<String>,
    pub error: Option<String>,
}

impl DownloadUpdateResult {
    pub fn ready(version: String) -> Self {
        Self {
            status: UpdateStatus::Ready,
            version: Some(version),
            error: None,
        }
    }

    pub fn cancelled() -> Self {
        Self {
            status: UpdateStatus::Idle,
            version: None,
            error: Some("Téléchargement annulé.".to_string()),
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            status: UpdateStatus::Error,
            version: None,
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
                return Ok(DownloadUpdateResult::error(
                    "Impossible d'initialiser le système de mise à jour.".to_string(),
                ));
            }
        };

        // Note: We must call updater.check() again here to obtain the `Update` handle
        // required by the tauri-plugin-updater API. The `Update` object is not
        // Clone/Send-safe across async boundaries, so it cannot be cached from the
        // initial check. This results in a redundant HTTP request but is the only
        // reliable approach with the current plugin API.
        let update = match updater.check().await {
            Ok(Some(update)) => update,
            Ok(None) => {
                tracing::warn!("No update available for download");
                return Ok(DownloadUpdateResult::error(
                    "Aucune mise à jour disponible.".to_string(),
                ));
            }
            Err(e) => {
                tracing::debug!("Update check failed during download: {}", e);
                return Ok(DownloadUpdateResult::error(
                    "Échec de la vérification de mise à jour. Vérifiez votre connexion.".to_string(),
                ));
            }
        };

        tracing::info!("Downloading update version: {}", update.version);
        let version = update.version.clone();

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

                Ok(DownloadUpdateResult::ready(version))
            }
            Err(e) => {
                tracing::error!("Download failed: {}", e);
                Ok(DownloadUpdateResult::error(
                    "Échec du téléchargement de la mise à jour. Réessayez ultérieurement.".to_string(),
                ))
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
        let result = DownloadUpdateResult::ready("1.2.0".to_string());
        assert_eq!(result.status, UpdateStatus::Ready);
        assert!(result.error.is_none());
        assert_eq!(result.version, Some("1.2.0".to_string()));
    }

    #[test]
    fn test_download_result_cancelled() {
        let result = DownloadUpdateResult::cancelled();
        assert_eq!(result.status, UpdateStatus::Idle);
        assert!(result.error.is_some());
        assert!(result.error.unwrap().contains("annulé"));
    }

    #[test]
    fn test_download_result_error() {
        let result = DownloadUpdateResult::error("Network error".to_string());
        assert_eq!(result.status, UpdateStatus::Error);
        assert!(result.error.is_some());
    }
}
