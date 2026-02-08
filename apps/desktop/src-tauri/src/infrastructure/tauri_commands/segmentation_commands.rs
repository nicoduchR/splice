use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use tauri::{AppHandle, Emitter, State};
use serde::Serialize;
use ts_rs::TS;

use crate::infrastructure::adapters::video_segmenter::VideoSegmenter;
use crate::infrastructure::adapters::video_concatenator::VideoConcatenator;
use crate::application::use_cases::validate_segments::ValidateSegmentsUseCase;
use crate::infrastructure::config::app_state::AppState;

/// Segmentation progress event payload
#[derive(Clone, Serialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct SegmentationProgress {
    pub project_id: String,
    pub current_segment: u32,
    pub total_segments: u32,
    pub progress: f64,
}

/// Segment video based on stored cuts
#[tauri::command]
pub async fn segment_video<R: tauri::Runtime>(
    project_id: String,
    app_handle: AppHandle<R>,
    app_state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    tracing::info!(
        event = "segment_video_command",
        project_id = %project_id,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    // Get source video path from repository (original, NOT proxy)
    let project = app_state
        .video_repository
        .find_by_id(&project_id)
        .map_err(|e| format!("Erreur lors de la récupération du projet: {}", e))?
        .ok_or_else(|| format!("Projet non trouvé: {}", project_id))?;

    let source_path = project.file_path.clone();

    // Get cuts for validation and total count
    let cuts = app_state
        .cut_repository
        .get_cuts(&project_id)
        .map_err(|e| format!("Erreur lors de la récupération des cuts: {}", e))?;

    if cuts.is_empty() {
        return Err("Aucun cut trouvé pour la segmentation. Générez d'abord les cuts.".to_string());
    }

    let total_segments = cuts.len() as u32;

    // Create cancel flag and store it
    let cancel_flag = Arc::new(AtomicBool::new(false));
    {
        let mut flags = app_state.segmentation_cancel_flags.lock().unwrap();
        flags.insert(project_id.clone(), cancel_flag.clone());
    }

    // Build output directory: {temp_dir}/{project_id}/ (uses configured preference)
    let output_dir = app_state.resolve_temp_dir().join(&project_id);

    // Compute and emit stats before starting
    let final_duration_secs: f64 = cuts.iter().map(|c| c.end_time - c.start_time).sum();
    let original_duration_secs = project.duration_seconds;
    let reduction_percent = if original_duration_secs > 0.0 {
        ((1.0 - final_duration_secs / original_duration_secs) * 100.0).max(0.0)
    } else {
        0.0
    };

    let _ = app_handle.emit("segmentation:stats", serde_json::json!({
        "project_id": project_id,
        "segment_count": total_segments,
        "final_duration_secs": final_duration_secs,
        "original_duration_secs": original_duration_secs,
        "reduction_percent": reduction_percent,
    }));

    // Emit initial progress
    let _ = app_handle.emit("segmentation:progress", SegmentationProgress {
        project_id: project_id.clone(),
        current_segment: 0,
        total_segments,
        progress: 0.0,
    });

    let project_id_progress = project_id.clone();
    let app_handle_progress = app_handle.clone();
    let project_id_events = project_id.clone();
    let app_handle_events = app_handle.clone();
    let project_id_validate = project_id.clone();
    let app_handle_validate = app_handle.clone();
    let source_path_validate = source_path.clone();
    let cuts_validate = cuts.clone();
    let cancel_flag_validate = cancel_flag.clone();
    let cancel_flag_concat = cancel_flag.clone();

    let result = tokio::task::spawn_blocking(move || {
        VideoSegmenter::segment_video(
            &source_path,
            &cuts,
            &output_dir,
            &cancel_flag,
            |completed, total| {
                let _ = app_handle_progress.emit("segmentation:progress", SegmentationProgress {
                    project_id: project_id_progress.clone(),
                    current_segment: completed as u32,
                    total_segments: total as u32,
                    progress: completed as f64 / total as f64,
                });
            },
        )
        .map(|paths| paths.iter().map(|p| p.to_string_lossy().to_string()).collect::<Vec<_>>())
        .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| format!("La tâche de segmentation a échoué: {}", e))?;

    // Validate segments after successful segmentation
    let result = match result {
        Ok(paths) => {
            // Emit validating event
            let _ = app_handle_validate.emit("segmentation:validating", serde_json::json!({
                "project_id": project_id_validate,
                "current_segment": 0,
                "total_segments": paths.len(),
            }));

            let paths_clone = paths.clone();
            let app_handle_validation = app_handle_validate.clone();
            let project_id_validation = project_id_validate.clone();
            let validation_result = tokio::task::spawn_blocking(move || {
                ValidateSegmentsUseCase::execute(
                    &paths_clone,
                    &cuts_validate,
                    &source_path_validate,
                    &cancel_flag_validate,
                    |current, total| {
                        let _ = app_handle_validation.emit("segmentation:validating", serde_json::json!({
                            "project_id": project_id_validation,
                            "current_segment": current,
                            "total_segments": total,
                        }));
                    },
                )
                .map_err(|e| e.to_string())
            })
            .await
            .map_err(|e| format!("La tâche de validation a échoué: {}", e))?;

            match validation_result {
                Ok(_) => {
                    // Concatenation phase
                    let _ = app_handle_validate.emit("segmentation:concatenating", serde_json::json!({
                        "project_id": project_id_validate,
                    }));

                    let paths_concat = paths.clone();
                    let project_id_concat = project_id_validate.clone();

                    let output_path = dirs::home_dir()
                        .ok_or("Impossible de trouver le répertoire home".to_string())?
                        .join(".splice")
                        .join("outputs")
                        .join(format!("{}_final.mp4", project_id_concat));

                    let concat_result = tokio::task::spawn_blocking(move || {
                        VideoConcatenator::concatenate(
                            &paths_concat,
                            &output_path,
                            &cancel_flag_concat,
                        )
                        .map_err(|e| e.to_string())
                    })
                    .await
                    .map_err(|e| format!("La tâche de concaténation a échoué: {}", e))?;

                    match concat_result {
                        Ok(final_path) => {
                            // Clean up temp segments (re-resolve since output_dir was moved)
                            let cleanup_dir = app_state.resolve_temp_dir().join(&project_id_validate);
                            VideoSegmenter::cleanup_segments(&cleanup_dir);

                            Ok(vec![final_path.to_string_lossy().to_string()])
                        }
                        Err(e) => Err(e),
                    }
                }
                Err(e) => Err(e),
            }
        }
        Err(e) => Err(e),
    };

    // Always clean up cancel flag, regardless of success or failure
    {
        let mut flags = app_state.segmentation_cancel_flags.lock().unwrap();
        flags.remove(&project_id);
    }

    // Emit completed or error event
    match &result {
        Ok(paths) => {
            let final_video_path = paths.first().cloned().unwrap_or_default();
            let _ = app_handle_events.emit("segmentation:completed", serde_json::json!({
                "project_id": project_id_events,
                "segment_count": paths.len(),
                "segment_paths": paths,
                "final_video_path": final_video_path,
            }));
        }
        Err(err) => {
            let _ = app_handle_events.emit("segmentation:error", serde_json::json!({
                "project_id": project_id_events,
                "error": err,
            }));
        }
    }

    result
}

/// Cancel an ongoing segmentation
#[tauri::command]
pub async fn cancel_segmentation(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(
        event = "cancel_segmentation_command",
        project_id = %project_id,
    );

    let flags = app_state.segmentation_cancel_flags.lock().unwrap();
    if let Some(flag) = flags.get(&project_id) {
        flag.store(true, std::sync::atomic::Ordering::Relaxed);
        tracing::info!(
            event = "segmentation_cancel_requested",
            project_id = %project_id,
        );
        Ok(())
    } else {
        Err(format!("Aucune segmentation en cours pour le projet: {}", project_id))
    }
}

/// Clean up segment files for a project
#[tauri::command]
pub async fn cleanup_segments(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(
        event = "cleanup_segments_command",
        project_id = %project_id,
    );

    let output_dir = app_state.resolve_temp_dir().join(&project_id);

    VideoSegmenter::cleanup_segments(&output_dir);
    Ok(())
}
