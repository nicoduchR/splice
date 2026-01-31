use crate::application::ports::model_downloader::ModelDownloader;
use crate::domain::entities::model_metadata::{ModelMetadata, ModelStatus};
use crate::infrastructure::adapters::model_manager::HuggingFaceModelManager;
use serde::Serialize;
use tauri::Emitter;

const PARAKEET_MODEL_NAME: &str = "parakeet-tdt-0.6b-v3";

/// Progress event for model download
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub percentage: f64,
    pub speed_mbps: f64,
}

/// Check if the Parakeet model exists locally
#[tauri::command]
pub async fn check_model_status() -> Result<ModelMetadata, String> {
    let manager = HuggingFaceModelManager::new()
        .map_err(|e| format!("Failed to initialize model manager: {}", e))?;

    let exists = manager
        .check_model_exists(PARAKEET_MODEL_NAME)
        .await
        .map_err(|e| format!("Failed to check model existence: {}", e))?;

    let status = if exists {
        ModelStatus::Ready
    } else {
        ModelStatus::Missing
    };

    Ok(ModelMetadata {
        name: PARAKEET_MODEL_NAME.to_string(),
        version: "v3".to_string(),
        status,
        download_url: "https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx".to_string(),
        total_size_bytes: 670_000_000, // ~670 MB
        downloaded_at: None,
    })
}

/// Download the Parakeet model from HuggingFace
#[tauri::command]
pub async fn download_parakeet_model(
    app_handle: tauri::AppHandle,
) -> Result<ModelMetadata, String> {
    let manager = HuggingFaceModelManager::new()
        .map_err(|e| format!("Failed to initialize model manager: {}", e))?;

    // Download with progress callback
    let metadata = manager
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
        .await
        .map_err(|e| format!("Failed to download model: {}", e))?;

    Ok(metadata)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_check_model_status_missing() {
        // This test will pass when model is not downloaded
        let result = check_model_status().await;
        assert!(result.is_ok(), "Command should succeed");

        let metadata = result.unwrap();
        assert_eq!(metadata.name, PARAKEET_MODEL_NAME);
        assert_eq!(metadata.version, "v3");
        // Status will be Missing if model not downloaded
    }
}
