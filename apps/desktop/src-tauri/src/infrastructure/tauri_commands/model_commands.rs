use crate::application::ports::model_downloader::ModelDownloader;
use crate::domain::entities::model_metadata::{ModelMetadata, ModelStatus};
use crate::infrastructure::adapters::model_manager::HuggingFaceModelManager;
use crate::infrastructure::config::app_state::AppState;
use serde::Serialize;
use sqlx::Row;
use tauri::{Emitter, State};
use tokio::sync::Mutex;

const PARAKEET_MODEL_NAME: &str = "parakeet-tdt-0.6b-v3";
const TOTAL_MODEL_SIZE: u64 = 2_514_050_000; // ~2.5 GB (real size)

/// Progress event for model download
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub percentage: f64,
    pub speed_mbps: f64,
}

/// Error event for model download
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadError {
    pub message: String,
}

/// Global cancellation flag
static CANCEL_FLAG: Mutex<bool> = Mutex::const_new(false);

/// Check if the Parakeet model exists locally
#[tauri::command]
pub async fn check_model_status(state: State<'_, AppState>) -> Result<ModelMetadata, String> {
    let manager = HuggingFaceModelManager::new()
        .map_err(|e| format!("Failed to initialize model manager: {}", e))?;

    // Check filesystem
    let exists = manager
        .check_model_exists(PARAKEET_MODEL_NAME)
        .await
        .map_err(|e| format!("Failed to check model existence: {}", e))?;

    // Check SQLite for persisted status
    let db_status = sqlx::query(
        "SELECT status, downloaded_at FROM model_status WHERE name = ?"
    )
    .bind(PARAKEET_MODEL_NAME)
    .fetch_optional(&state.db_pool)
    .await
    .map_err(|e| format!("Failed to query model status: {}", e))?;

    let (status, downloaded_at) = if let Some(row) = db_status {
        let status_str: String = row.get("status");
        let downloaded_at_opt: Option<i64> = row.get("downloaded_at");
        let status = status_str.parse::<ModelStatus>()
            .map_err(|e| format!("Invalid status in database: {}", e))?;
        (status, downloaded_at_opt)
    } else if exists {
        (ModelStatus::Ready, None)
    } else {
        (ModelStatus::Missing, None)
    };

    Ok(ModelMetadata {
        name: PARAKEET_MODEL_NAME.to_string(),
        version: "v3".to_string(),
        status,
        download_url: "https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx".to_string(),
        total_size_bytes: TOTAL_MODEL_SIZE,
        downloaded_at,
    })
}

/// Download the Parakeet model from HuggingFace
#[tauri::command]
pub async fn download_parakeet_model(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<ModelMetadata, String> {
    // Reset cancellation flag
    *CANCEL_FLAG.lock().await = false;

    let manager = HuggingFaceModelManager::new()
        .map_err(|e| format!("Failed to initialize model manager: {}", e))?;

    // Mark as downloading in SQLite
    sqlx::query(
        "UPDATE model_status SET status = 'downloading', updated_at = strftime('%s', 'now') WHERE name = ?"
    )
    .bind(PARAKEET_MODEL_NAME)
    .execute(&state.db_pool)
    .await
    .map_err(|e| format!("Failed to update status to downloading: {}", e))?;

    // Download with progress callback
    let result = manager
        .download_model(
            PARAKEET_MODEL_NAME,
            |downloaded, total, speed| {
                let percentage = (downloaded as f64 / total as f64) * 100.0;
                let progress = DownloadProgress {
                    downloaded,
                    total,
                    percentage,
                    speed_mbps: speed,
                };

                // Emit progress event to frontend
                let _ = app_handle.emit("model:download_progress", progress);
            },
        )
        .await;

    match result {
        Ok(mut metadata) => {
            // Mark as ready in SQLite
            let now = chrono::Utc::now().timestamp();
            sqlx::query(
                "UPDATE model_status SET status = 'ready', downloaded_at = ?, updated_at = strftime('%s', 'now') WHERE name = ?"
            )
            .bind(now)
            .bind(PARAKEET_MODEL_NAME)
            .execute(&state.db_pool)
            .await
            .map_err(|e| format!("Failed to update status to ready: {}", e))?;

            metadata.downloaded_at = Some(now);

            // Emit success event
            let _ = app_handle.emit("model:download_completed", metadata.clone());

            Ok(metadata)
        }
        Err(e) => {
            // Mark as missing/corrupted in SQLite
            sqlx::query(
                "UPDATE model_status SET status = 'missing', updated_at = strftime('%s', 'now') WHERE name = ?"
            )
            .bind(PARAKEET_MODEL_NAME)
            .execute(&state.db_pool)
            .await
            .ok(); // Don't fail if this fails

            // Emit error event
            let error_msg = format!("Failed to download model: {}", e);
            let _ = app_handle.emit("model:download_failed", DownloadError {
                message: error_msg.clone(),
            });

            Err(error_msg)
        }
    }
}

/// Cancel the current model download
#[tauri::command]
pub async fn cancel_model_download() -> Result<(), String> {
    *CANCEL_FLAG.lock().await = true;
    tracing::info!("Model download cancellation requested");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_cancel_flag() {
        // Reset flag
        *CANCEL_FLAG.lock().await = false;
        assert!(!*CANCEL_FLAG.lock().await);

        // Set flag via command
        cancel_model_download().await.unwrap();
        assert!(*CANCEL_FLAG.lock().await);
    }
}
