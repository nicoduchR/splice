use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use crate::application::use_cases::export_video::ExportVideoUseCase;
use crate::infrastructure::config::app_state::AppState;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use ts_rs::TS;

/// Export quality setting
#[derive(Clone, Debug, Deserialize, Serialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
#[serde(rename_all = "lowercase")]
pub enum ExportQuality {
    Preserve,
    High,
    Medium,
    Low,
}

impl std::fmt::Display for ExportQuality {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ExportQuality::Preserve => write!(f, "preserve"),
            ExportQuality::High => write!(f, "high"),
            ExportQuality::Medium => write!(f, "medium"),
            ExportQuality::Low => write!(f, "low"),
        }
    }
}

/// Export size and duration estimate
#[derive(Clone, Serialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct ExportEstimate {
    pub estimated_size_bytes: u64,
    pub estimated_duration_seconds: f64,
}

/// Estimate export file size and processing time based on quality setting.
///
/// Quality determines encoding approach:
/// - Preserve: stream copy (-c copy), preserves original bitrate, ~10x realtime
/// - High: CRF 18, ~8 Mbps, ~2x realtime
/// - Medium: CRF 23, ~4 Mbps, ~2x realtime
/// - Low: CRF 28, ~2 Mbps, ~2x realtime
#[tauri::command]
pub fn estimate_export(
    project_id: String,
    quality: ExportQuality,
    state: State<AppState>,
) -> Result<ExportEstimate, String> {
    tracing::info!(
        event = "estimate_export_command",
        project_id = %project_id,
        quality = %quality,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    // Get the video project to access original metadata
    let project = state
        .video_repository
        .find_by_id(&project_id)
        .map_err(|e| format!("Erreur lors de la récupération du projet: {}", e))?
        .ok_or_else(|| format!("Projet non trouvé: {}", project_id))?;

    // Get cuts to compute final (preview) duration
    let cuts = state
        .cut_repository
        .get_cuts(&project_id)
        .map_err(|e| format!("Erreur lors de la récupération des cuts: {}", e))?;

    if cuts.is_empty() {
        return Err("Aucun cut trouvé. Générez d'abord les cuts.".to_string());
    }

    // Compute final video duration from cuts
    let final_duration_secs: f64 = cuts.iter().map(|c| c.end_time - c.start_time).sum();

    // Compute original bitrate (bytes/sec) from source file
    let original_bitrate_bps = if project.duration_seconds > 0.0 {
        project.file_size_bytes.unwrap_or(0) as f64 / project.duration_seconds
    } else {
        // Fallback: assume ~5 Mbps if we can't determine
        5_000_000.0 / 8.0
    };

    let (estimated_size_bytes, encoding_speed_factor) = compute_estimate(
        &quality,
        final_duration_secs,
        original_bitrate_bps,
    );

    let estimated_duration_seconds = if encoding_speed_factor > 0.0 {
        final_duration_secs / encoding_speed_factor
    } else {
        0.0
    };

    Ok(ExportEstimate {
        estimated_size_bytes,
        estimated_duration_seconds,
    })
}

/// Pure computation for estimation — testable without Tauri runtime.
pub fn compute_estimate(
    quality: &ExportQuality,
    final_duration_secs: f64,
    original_bitrate_bps: f64,
) -> (u64, f64) {
    match quality {
        ExportQuality::Preserve => {
            // Stream copy: preserve original bitrate, very fast
            let size = (final_duration_secs * original_bitrate_bps) as u64;
            (size, 10.0) // ~10x realtime for -c copy
        }
        ExportQuality::High => {
            // CRF 18: ~8 Mbps = 1_000_000 bytes/sec
            let size = (final_duration_secs * 1_000_000.0) as u64;
            (size, 2.0)
        }
        ExportQuality::Medium => {
            // CRF 23: ~4 Mbps = 500_000 bytes/sec
            let size = (final_duration_secs * 500_000.0) as u64;
            (size, 2.0)
        }
        ExportQuality::Low => {
            // CRF 28: ~2 Mbps = 250_000 bytes/sec
            let size = (final_duration_secs * 250_000.0) as u64;
            (size, 2.0)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_estimate_preserve() {
        // 60s video at 625_000 bytes/sec (5 Mbps) original bitrate
        let (size, speed) = compute_estimate(&ExportQuality::Preserve, 60.0, 625_000.0);
        assert_eq!(size, 37_500_000); // 60 * 625_000
        assert!((speed - 10.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_compute_estimate_high() {
        let (size, speed) = compute_estimate(&ExportQuality::High, 60.0, 625_000.0);
        assert_eq!(size, 60_000_000); // 60 * 1_000_000
        assert!((speed - 2.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_compute_estimate_medium() {
        let (size, speed) = compute_estimate(&ExportQuality::Medium, 60.0, 625_000.0);
        assert_eq!(size, 30_000_000); // 60 * 500_000
        assert!((speed - 2.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_compute_estimate_low() {
        let (size, speed) = compute_estimate(&ExportQuality::Low, 60.0, 625_000.0);
        assert_eq!(size, 15_000_000); // 60 * 250_000
        assert!((speed - 2.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_compute_estimate_duration_seconds() {
        // For a 120s video at high quality, encoding should take ~60s (120/2)
        let (_, speed) = compute_estimate(&ExportQuality::High, 120.0, 625_000.0);
        let estimated_time = 120.0 / speed;
        assert!((estimated_time - 60.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_compute_estimate_preserve_speed() {
        // For preserve, encoding should take ~12s for 120s video (120/10)
        let (_, speed) = compute_estimate(&ExportQuality::Preserve, 120.0, 625_000.0);
        let estimated_time = 120.0 / speed;
        assert!((estimated_time - 12.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_export_completed_struct_has_duration() {
        // Verify that ExportCompleted has all required fields including duration_seconds
        let completed = ExportCompleted {
            project_id: "test-project".to_string(),
            output_path: "/path/to/video.mp4".to_string(),
            file_size: 50_000_000,
            duration_seconds: 125.5,
        };
        assert_eq!(completed.project_id, "test-project");
        assert_eq!(completed.output_path, "/path/to/video.mp4");
        assert_eq!(completed.file_size, 50_000_000);
        assert!((completed.duration_seconds - 125.5).abs() < f64::EPSILON);
    }
}

/// Export progress event payload
#[derive(Clone, Serialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct ExportProgress {
    pub project_id: String,
    pub progress: f64,
    pub current_time: f64,
    pub total_duration: f64,
    pub encoding_speed: f64,
    pub current_frame: Option<u64>,
    pub total_frames: Option<u64>,
    pub fps: Option<f64>,
    pub elapsed_secs: f64,
    pub eta_secs: Option<f64>,
    pub file_size_bytes: Option<u64>,
    pub estimated_total_bytes: Option<u64>,
}

/// Export completed event payload
#[derive(Clone, Serialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct ExportCompleted {
    pub project_id: String,
    pub output_path: String,
    pub file_size: u64,
    pub duration_seconds: f64,
}

/// Export video using FFmpeg with the specified quality setting.
#[tauri::command]
pub async fn export_video<R: tauri::Runtime>(
    project_id: String,
    quality: ExportQuality,
    output_path: String,
    file_name: String,
    app_handle: AppHandle<R>,
    app_state: State<'_, AppState>,
) -> Result<String, String> {
    tracing::info!(
        event = "export_video_command",
        project_id = %project_id,
        quality = %quality,
        output_path = %output_path,
        file_name = %file_name,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    if output_path.trim().is_empty() {
        return Err("Le chemin de sortie ne peut pas être vide".to_string());
    }

    if file_name.trim().is_empty() {
        return Err("Le nom du fichier ne peut pas être vide".to_string());
    }

    // Build full output path
    let full_output = std::path::Path::new(&output_path).join(&file_name);
    // Ensure .mp4 extension
    let full_output = if full_output.extension().is_some_and(|e| e == "mp4") {
        full_output
    } else {
        full_output.with_extension("mp4")
    };

    // Create cancel flag
    let cancel_flag = Arc::new(AtomicBool::new(false));
    {
        let mut flags = app_state.export_cancel_flags.lock().unwrap();
        flags.insert(project_id.clone(), cancel_flag.clone());
    }

    let quality_str = quality.to_string();
    let video_repo = app_state.video_repository.clone();
    let cut_repo = app_state.cut_repository.clone();
    let temp_dir = app_state.resolve_temp_dir();
    let project_id_progress = project_id.clone();
    let app_handle_progress = app_handle.clone();

    // Get total duration for progress events
    let cuts = app_state
        .cut_repository
        .get_cuts(&project_id)
        .map_err(|e| format!("Erreur lors de la récupération des cuts: {}", e))?;
    let total_duration: f64 = cuts.iter().map(|c| c.end_time - c.start_time).sum();

    let result = tokio::task::spawn_blocking(move || {
        ExportVideoUseCase::execute(
            &project_id_progress,
            &quality_str,
            &full_output,
            &cancel_flag,
            |info| {
                let _ = app_handle_progress.emit("export:progress", ExportProgress {
                    project_id: project_id_progress.clone(),
                    progress: info.percent,
                    current_time: info.current_time,
                    total_duration,
                    encoding_speed: info.speed,
                    current_frame: info.current_frame,
                    total_frames: info.total_frames,
                    fps: info.fps,
                    elapsed_secs: info.elapsed_secs,
                    eta_secs: info.eta_secs,
                    file_size_bytes: info.file_size_bytes,
                    estimated_total_bytes: info.estimated_total_bytes,
                });
            },
            &video_repo,
            &cut_repo,
            &temp_dir,
        )
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| format!("La tâche d'export a échoué: {}", e))?;

    // Clean up cancel flag
    {
        let mut flags = app_state.export_cancel_flags.lock().unwrap();
        flags.remove(&project_id);
    }

    // Emit completed or error event
    match &result {
        Ok(output_path_str) => {
            let file_size = std::fs::metadata(output_path_str)
                .map(|m| m.len())
                .unwrap_or(0);
            let _ = app_handle.emit("export:completed", ExportCompleted {
                project_id: project_id.clone(),
                output_path: output_path_str.clone(),
                file_size,
                duration_seconds: total_duration,
            });
        }
        Err(err) => {
            let _ = app_handle.emit("export:error", serde_json::json!({
                "project_id": project_id,
                "error": err,
            }));
        }
    }

    result
}

/// Cancel an ongoing export
#[tauri::command]
pub async fn cancel_export(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(
        event = "cancel_export_command",
        project_id = %project_id,
    );

    let flags = app_state.export_cancel_flags.lock().unwrap();
    if let Some(flag) = flags.get(&project_id) {
        flag.store(true, std::sync::atomic::Ordering::Relaxed);
        tracing::info!(
            event = "export_cancel_requested",
            project_id = %project_id,
        );
        Ok(())
    } else {
        Err(format!("Aucun export en cours pour le projet: {}", project_id))
    }
}

/// Open a file with the system's default application
#[tauri::command]
pub async fn open_file(path: String) -> Result<(), String> {
    tracing::info!(event = "open_file_command", path = %path);

    if path.trim().is_empty() {
        return Err("Le chemin du fichier ne peut pas être vide".to_string());
    }

    let path_buf = std::path::Path::new(&path);
    if !path_buf.exists() {
        return Err(format!("Le fichier n'existe pas: {}", path));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Impossible d'ouvrir le fichier: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &path])
            .spawn()
            .map_err(|e| format!("Impossible d'ouvrir le fichier: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Impossible d'ouvrir le fichier: {}", e))?;
    }

    Ok(())
}

/// Show a file in the system's file browser (Finder on macOS, Explorer on Windows)
#[tauri::command]
pub async fn show_in_folder(path: String) -> Result<(), String> {
    tracing::info!(event = "show_in_folder_command", path = %path);

    if path.trim().is_empty() {
        return Err("Le chemin du fichier ne peut pas être vide".to_string());
    }

    let path_buf = std::path::Path::new(&path);
    if !path_buf.exists() {
        return Err(format!("Le fichier n'existe pas: {}", path));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| format!("Impossible d'afficher le fichier dans le Finder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| format!("Impossible d'afficher le fichier dans l'Explorateur: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try xdg-open on the parent directory
        if let Some(parent) = path_buf.parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| format!("Impossible d'afficher le dossier: {}", e))?;
        } else {
            return Err("Impossible de déterminer le dossier parent".to_string());
        }
    }

    Ok(())
}
