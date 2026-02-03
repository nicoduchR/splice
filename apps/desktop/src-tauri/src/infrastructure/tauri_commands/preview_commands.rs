use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use tauri::{AppHandle, Emitter, State};
use serde::Serialize;
use ts_rs::TS;

use crate::application::use_cases::prepare_preview::PreparePreviewUseCase;
use crate::infrastructure::config::app_state::AppState;

/// Preview ready event payload
#[derive(Clone, Serialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct PreviewReady {
    pub project_id: String,
    pub preview_path: String,
    pub cached: bool,
}

/// Preview error event payload
#[derive(Clone, Serialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct PreviewError {
    pub project_id: String,
    pub error: String,
}

/// Prepare preview by concatenating segments with cache support.
///
/// If segments haven't changed since last preview, returns cached file immediately.
/// Otherwise, concatenates segments with -c copy and applies -movflags +faststart.
#[tauri::command]
pub async fn prepare_preview<R: tauri::Runtime>(
    project_id: String,
    app_handle: AppHandle<R>,
    app_state: State<'_, AppState>,
) -> Result<String, String> {
    tracing::info!(
        event = "prepare_preview_command",
        project_id = %project_id,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    // Get cuts to build segment paths
    let cuts = app_state
        .cut_repository
        .get_cuts(&project_id)
        .map_err(|e| format!("Erreur lors de la récupération des cuts: {}", e))?;

    if cuts.is_empty() {
        return Err("Aucun cut trouvé. Générez d'abord les cuts.".to_string());
    }

    // Discover actual segment files from the temp directory
    let home_dir = dirs::home_dir()
        .ok_or("Impossible de trouver le répertoire home")?;
    let temp_dir = home_dir
        .join(".splice")
        .join("temp")
        .join(&project_id);

    // Glob for actual segment files instead of reconstructing paths from cuts count
    let mut segment_paths: Vec<String> = Vec::new();
    if temp_dir.exists() {
        let mut entries: Vec<_> = std::fs::read_dir(&temp_dir)
            .map_err(|e| format!("Impossible de lire le dossier segments: {}", e))?
            .filter_map(|e| e.ok())
            .filter(|e| {
                let name = e.file_name().to_string_lossy().to_string();
                name.starts_with("segment_") && name.ends_with(".mp4")
            })
            .collect();
        entries.sort_by_key(|e| e.file_name());
        segment_paths = entries
            .iter()
            .map(|e| e.path().to_string_lossy().to_string())
            .collect();
    }

    if segment_paths.is_empty() {
        // Segments may have been cleaned up - check if final video exists from previous segmentation
        let final_path = home_dir
            .join(".splice")
            .join("outputs")
            .join(format!("{}_final.mp4", project_id));

        if final_path.exists() {
            // Use the existing final video as preview source
            let preview_path = final_path.to_string_lossy().to_string();
            let _ = app_handle.emit("preview:ready", PreviewReady {
                project_id: project_id.clone(),
                preview_path: preview_path.clone(),
                cached: true,
            });
            return Ok(preview_path);
        }

        return Err("Segments non trouvés. Relancez la segmentation.".to_string());
    }

    let cancel_flag = Arc::new(AtomicBool::new(false));
    let project_id_clone = project_id.clone();
    let app_handle_clone = app_handle.clone();

    let result = tokio::task::spawn_blocking(move || {
        PreparePreviewUseCase::execute(&project_id_clone, &segment_paths, &cancel_flag)
            .map(|path| path.to_string_lossy().to_string())
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| format!("La tâche de préparation du preview a échoué: {}", e))?;

    match &result {
        Ok(preview_path) => {
            // Validate preview before reporting ready
            let preview_path_buf = std::path::PathBuf::from(preview_path);
            if let Err(e) = PreparePreviewUseCase::validate_preview(&preview_path_buf, cuts.len()) {
                tracing::warn!(
                    event = "preview_validation_warning",
                    error = %e,
                    "Preview validation failed but file exists, proceeding anyway"
                );
            }

            let _ = app_handle_clone.emit("preview:ready", PreviewReady {
                project_id: project_id.clone(),
                preview_path: preview_path.clone(),
                cached: false,
            });
        }
        Err(err) => {
            let _ = app_handle_clone.emit("preview:error", PreviewError {
                project_id: project_id.clone(),
                error: err.clone(),
            });
        }
    }

    result
}

/// Invalidate the preview cache for a project (e.g., after re-segmentation)
#[tauri::command]
pub async fn invalidate_preview_cache(
    project_id: String,
) -> Result<(), String> {
    tracing::info!(
        event = "invalidate_preview_cache_command",
        project_id = %project_id,
    );

    PreparePreviewUseCase::invalidate_cache(&project_id)
        .map_err(|e| e.to_string())
}
