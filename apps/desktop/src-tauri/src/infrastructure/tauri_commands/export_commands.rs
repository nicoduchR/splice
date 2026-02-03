use crate::infrastructure::config::app_state::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;
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
}
