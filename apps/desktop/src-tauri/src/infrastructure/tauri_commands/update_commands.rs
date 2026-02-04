use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{Emitter, State};
use ts_rs::TS;

use crate::application::use_cases::{CheckForUpdateUseCase, DownloadUpdateUseCase};
use crate::domain::entities::{DownloadProgress, UpdateInfo, UpdateStatus};
use crate::infrastructure::config::app_state::AppState;

/// Update status response for frontend
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatusResponse {
    pub status: UpdateStatus,
    pub update_info: Option<UpdateInfo>,
    pub download_progress: Option<DownloadProgress>,
    pub error: Option<String>,
}

impl UpdateStatusResponse {
    pub fn idle() -> Self {
        Self {
            status: UpdateStatus::Idle,
            update_info: None,
            download_progress: None,
            error: None,
        }
    }

    pub fn checking() -> Self {
        Self {
            status: UpdateStatus::Checking,
            update_info: None,
            download_progress: None,
            error: None,
        }
    }

    pub fn available(info: UpdateInfo) -> Self {
        Self {
            status: UpdateStatus::Available,
            update_info: Some(info),
            download_progress: None,
            error: None,
        }
    }

    pub fn downloading(info: UpdateInfo, progress: DownloadProgress) -> Self {
        Self {
            status: UpdateStatus::Downloading,
            update_info: Some(info),
            download_progress: Some(progress),
            error: None,
        }
    }

    pub fn ready(info: UpdateInfo) -> Self {
        Self {
            status: UpdateStatus::Ready,
            update_info: Some(info),
            download_progress: Some(DownloadProgress::complete(0)),
            error: None,
        }
    }

    pub fn up_to_date() -> Self {
        Self {
            status: UpdateStatus::UpToDate,
            update_info: None,
            download_progress: None,
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            status: UpdateStatus::Error,
            update_info: None,
            download_progress: None,
            error: Some(message),
        }
    }
}

/// Tauri event payloads for update events
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
#[serde(rename_all = "camelCase")]
pub struct UpdateAvailableEvent {
    pub version: String,
    pub release_notes: String,
    pub is_mandatory: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
#[serde(rename_all = "camelCase")]
pub struct UpdateDownloadProgressEvent {
    pub percent: f64,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
#[serde(rename_all = "camelCase")]
pub struct UpdateDownloadCompleteEvent {
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
#[serde(rename_all = "camelCase")]
pub struct UpdateErrorEvent {
    pub message: String,
}

/// Check for available updates
///
/// Returns immediately with the check result.
/// Emits `update:available` event if an update is found.
#[tauri::command]
pub async fn check_for_update(app: tauri::AppHandle) -> Result<UpdateStatusResponse, String> {
    tracing::info!("Checking for updates via Tauri command");

    let use_case = CheckForUpdateUseCase::new();

    match use_case.execute(&app).await {
        Ok(result) => {
            if let Some(ref info) = result.update_info {
                // Emit event for update available
                let _ = app.emit(
                    "update:available",
                    UpdateAvailableEvent {
                        version: info.version.clone(),
                        release_notes: info.release_notes.clone(),
                        is_mandatory: info.is_mandatory,
                    },
                );

                tracing::info!("Update available: {}", info.version);
                Ok(UpdateStatusResponse::available(info.clone()))
            } else if let Some(error) = result.error {
                tracing::warn!("Update check error: {}", error);
                Ok(UpdateStatusResponse::error(error))
            } else {
                tracing::info!("Already on latest version");
                Ok(UpdateStatusResponse::up_to_date())
            }
        }
        Err(e) => {
            tracing::error!("Update check failed: {}", e);
            Ok(UpdateStatusResponse::error(e.to_string()))
        }
    }
}

/// Start downloading an available update
///
/// This command starts a background download and emits progress events.
/// - `update:download-progress` - Emitted periodically with download progress
/// - `update:download-complete` - Emitted when download finishes
/// - `update:error` - Emitted if download fails
#[tauri::command]
pub async fn download_update(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<UpdateStatusResponse, String> {
    tracing::info!("Starting update download via Tauri command");

    let use_case = DownloadUpdateUseCase::new();

    // Create cancel flag for this download
    let cancel_flag = Arc::new(AtomicBool::new(false));

    // Store cancel flag in app state
    {
        let mut flags = state.update_cancel_flag.lock().unwrap();
        *flags = Some(cancel_flag.clone());
    }

    // Clone app handle for progress callback
    let app_for_progress = app.clone();

    // Execute download with progress callback
    let result = use_case
        .execute(&app, cancel_flag.clone(), move |progress: DownloadProgress| {
            // Emit progress event
            let _ = app_for_progress.emit(
                "update:download-progress",
                UpdateDownloadProgressEvent {
                    percent: progress.percent,
                    downloaded_bytes: progress.downloaded_bytes,
                    total_bytes: progress.total_bytes,
                },
            );
        })
        .await;

    // Clear cancel flag
    {
        let mut flags = state.update_cancel_flag.lock().unwrap();
        *flags = None;
    }

    match result {
        Ok(download_result) => {
            if let Some(error) = download_result.error {
                // Emit error event
                let _ = app.emit("update:error", UpdateErrorEvent { message: error.clone() });
                tracing::warn!("Download error: {}", error);
                Ok(UpdateStatusResponse::error(error))
            } else {
                // Emit complete event
                let _ = app.emit(
                    "update:download-complete",
                    UpdateDownloadCompleteEvent {
                        version: String::new(), // Version not available here
                    },
                );
                tracing::info!("Download complete, ready to install");
                Ok(UpdateStatusResponse {
                    status: download_result.status,
                    update_info: None,
                    download_progress: Some(DownloadProgress::complete(0)),
                    error: None,
                })
            }
        }
        Err(e) => {
            let error_msg = e.to_string();
            let _ = app.emit("update:error", UpdateErrorEvent { message: error_msg.clone() });
            tracing::error!("Download failed: {}", error_msg);
            Ok(UpdateStatusResponse::error(error_msg))
        }
    }
}

/// Cancel an ongoing update download
#[tauri::command]
pub fn cancel_update_download(state: State<'_, AppState>) -> Result<(), String> {
    tracing::info!("Cancelling update download");

    let flags = state.update_cancel_flag.lock().unwrap();
    if let Some(ref flag) = *flags {
        flag.store(true, Ordering::SeqCst);
        tracing::info!("Cancel flag set");
    }

    Ok(())
}

/// Get current update status
///
/// Returns the current state of the update system without triggering a check.
#[tauri::command]
pub fn get_update_status(state: State<'_, AppState>) -> Result<UpdateStatusResponse, String> {
    let update_state = state.update_state.lock().unwrap();

    Ok(UpdateStatusResponse {
        status: update_state.status.clone(),
        update_info: update_state.update_info.clone(),
        download_progress: update_state.download_progress.clone(),
        error: update_state.error.clone(),
    })
}

/// Install the downloaded update and restart the app
///
/// Note: This will close the app and install the update.
#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    tracing::info!("Installing update and restarting");

    // The updater plugin handles the restart automatically after download_and_install
    // If we need manual restart, we can use:
    app.restart();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_update_status_response_idle() {
        let response = UpdateStatusResponse::idle();
        assert_eq!(response.status, UpdateStatus::Idle);
        assert!(response.update_info.is_none());
        assert!(response.error.is_none());
    }

    #[test]
    fn test_update_status_response_available() {
        let info = UpdateInfo::new(
            "1.2.0".to_string(),
            "2024-01-15".to_string(),
            "New features".to_string(),
            "https://example.com".to_string(),
            false,
        );
        let response = UpdateStatusResponse::available(info);

        assert_eq!(response.status, UpdateStatus::Available);
        assert!(response.update_info.is_some());
        assert_eq!(response.update_info.unwrap().version, "1.2.0");
    }

    #[test]
    fn test_update_status_response_error() {
        let response = UpdateStatusResponse::error("Network error".to_string());

        assert_eq!(response.status, UpdateStatus::Error);
        assert!(response.error.is_some());
        assert_eq!(response.error.unwrap(), "Network error");
    }

    #[test]
    fn test_update_status_response_up_to_date() {
        let response = UpdateStatusResponse::up_to_date();
        assert_eq!(response.status, UpdateStatus::UpToDate);
        assert!(response.update_info.is_none());
    }
}
