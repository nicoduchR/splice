use crate::domain::entities::model_metadata::{ModelMetadata, ModelStatus};
use crate::infrastructure::config::app_state::AppState;
use tauri::State;

/// Check model status - FluidAudio handles model download internally via the sidecar,
/// so this always reports "ready". The sidecar will download the CoreML model on first use.
#[tauri::command]
pub async fn check_model_status(state: State<'_, AppState>) -> Result<ModelMetadata, String> {
    Ok(ModelMetadata {
        name: "parakeet-coreml".to_string(),
        version: "v1".to_string(),
        status: ModelStatus::Ready,
        download_url: "https://github.com/FluidAudio/FluidAudio".to_string(),
        total_size_bytes: 0,
        downloaded_at: Some(0),
    })
}

/// Download model - no-op with FluidAudio (sidecar handles model management)
#[tauri::command]
pub async fn download_parakeet_model(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<ModelMetadata, String> {
    check_model_status(state).await
}

/// Cancel model download - no-op with FluidAudio
#[tauri::command]
pub async fn cancel_model_download() -> Result<(), String> {
    Ok(())
}
