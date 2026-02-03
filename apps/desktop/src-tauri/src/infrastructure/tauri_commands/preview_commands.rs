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

/// A single segment boundary in the concatenated preview timeline
#[derive(Clone, Serialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct SegmentBoundary {
    pub index: u32,
    pub start_time: f64,
    pub end_time: f64,
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

/// Get segment boundaries (cumulative positions) for the concatenated preview.
///
/// Computes where each segment starts and ends in the preview timeline
/// based on the cut durations (end_time - start_time for each cut).
#[tauri::command]
pub async fn get_segment_boundaries(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<Vec<SegmentBoundary>, String> {
    tracing::info!(
        event = "get_segment_boundaries_command",
        project_id = %project_id,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    let cuts = app_state
        .cut_repository
        .get_cuts(&project_id)
        .map_err(|e| format!("Erreur lors de la récupération des cuts: {}", e))?;

    if cuts.is_empty() {
        return Err("Aucun cut trouvé.".to_string());
    }

    Ok(compute_segment_boundaries(&cuts))
}

/// Pure computation: build cumulative segment boundaries from cuts.
pub fn compute_segment_boundaries(cuts: &[crate::domain::entities::cut::Cut]) -> Vec<SegmentBoundary> {
    let mut boundaries = Vec::with_capacity(cuts.len());
    let mut cumulative = 0.0_f64;
    for cut in cuts {
        let duration = cut.end_time - cut.start_time;
        boundaries.push(SegmentBoundary {
            index: cut.segment_index as u32,
            start_time: cumulative,
            end_time: cumulative + duration,
        });
        cumulative += duration;
    }
    boundaries
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::entities::cut::Cut;

    fn make_cut(index: i64, start: f64, end: f64) -> Cut {
        Cut {
            id: format!("cut-{}", index),
            project_id: "test-project".to_string(),
            segment_index: index,
            start_time: start,
            end_time: end,
            created_at: 0,
        }
    }

    #[test]
    fn test_compute_segment_boundaries_single_cut() {
        let cuts = vec![make_cut(0, 10.0, 15.0)];
        let boundaries = compute_segment_boundaries(&cuts);
        assert_eq!(boundaries.len(), 1);
        assert_eq!(boundaries[0].index, 0);
        assert!((boundaries[0].start_time - 0.0).abs() < f64::EPSILON);
        assert!((boundaries[0].end_time - 5.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_compute_segment_boundaries_multiple_cuts() {
        let cuts = vec![
            make_cut(0, 2.0, 7.0),   // duration 5s → preview 0-5
            make_cut(1, 20.0, 27.0),  // duration 7s → preview 5-12
            make_cut(2, 40.0, 43.0),  // duration 3s → preview 12-15
        ];
        let boundaries = compute_segment_boundaries(&cuts);
        assert_eq!(boundaries.len(), 3);

        assert_eq!(boundaries[0].index, 0);
        assert!((boundaries[0].start_time - 0.0).abs() < f64::EPSILON);
        assert!((boundaries[0].end_time - 5.0).abs() < f64::EPSILON);

        assert_eq!(boundaries[1].index, 1);
        assert!((boundaries[1].start_time - 5.0).abs() < f64::EPSILON);
        assert!((boundaries[1].end_time - 12.0).abs() < f64::EPSILON);

        assert_eq!(boundaries[2].index, 2);
        assert!((boundaries[2].start_time - 12.0).abs() < f64::EPSILON);
        assert!((boundaries[2].end_time - 15.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_compute_segment_boundaries_empty_cuts() {
        let boundaries = compute_segment_boundaries(&[]);
        assert!(boundaries.is_empty());
    }
}
