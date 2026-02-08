use std::sync::atomic::AtomicBool;
use std::sync::Arc;

use async_trait::async_trait;
use thiserror::Error;

use crate::domain::entities::DownloadProgress;

#[derive(Error, Debug)]
pub enum UpdateCheckError {
    #[error("Failed to initialize updater: {0}")]
    InitializationError(String),

    #[error("Update check failed: {0}")]
    CheckFailed(String),

    #[error("Download failed: {0}")]
    DownloadFailed(String),

    #[error("No update available for download")]
    NoUpdateAvailable,
}

/// Information about an available update, returned by the checker
#[derive(Debug, Clone)]
pub struct AvailableUpdate {
    pub version: String,
    pub release_notes: String,
    pub release_date: String,
}

/// Port for update checking and downloading
///
/// This trait abstracts the update mechanism (e.g., tauri-plugin-updater)
/// so that use cases do not depend on infrastructure details.
///
/// Current implementation: `tauri-plugin-updater` via `UpdaterExt` trait.
/// The use cases currently bypass this port and call the plugin directly.
/// A future refactoring should inject this port into the use cases to
/// fully comply with Clean Architecture's dependency rule.
#[async_trait]
pub trait UpdateChecker: Send + Sync {
    /// Check if a newer version is available
    async fn check_for_update(&self) -> Result<Option<AvailableUpdate>, UpdateCheckError>;

    /// Download the latest available update with progress tracking
    ///
    /// # Arguments
    /// * `cancel_flag` - Atomic flag to signal download cancellation
    /// * `progress_callback` - Called with download progress updates
    ///
    /// # Returns
    /// The version string of the downloaded update on success
    async fn download_update(
        &self,
        cancel_flag: Arc<AtomicBool>,
        progress_callback: Box<dyn FnMut(DownloadProgress) + Send>,
    ) -> Result<String, UpdateCheckError>;
}
