use std::sync::Arc;

use serde::Serialize;
use tauri::State;
use ts_rs::TS;

use crate::application::use_cases::{CheckDiskSpaceUseCase, calculate_dir_size};
use crate::infrastructure::adapters::Fs2DiskSpaceChecker;
use crate::infrastructure::config::app_state::AppState;

/// Response from the check_disk_space command.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub struct DiskSpaceInfo {
    pub available_gb: f64,
    pub required_gb: f64,
    pub sufficient: bool,
}

/// Check available disk space on the volume containing `path`.
/// Returns available/required GB and whether space is sufficient.
#[tauri::command]
pub async fn check_disk_space(
    path: String,
    required_bytes: u64,
) -> Result<DiskSpaceInfo, String> {
    tracing::info!(
        event = "check_disk_space",
        path = %path,
        required_bytes = required_bytes,
    );

    let check_path = std::path::PathBuf::from(&path);

    // Use parent directory if the path doesn't exist yet (e.g., output file path)
    let effective_path = if check_path.exists() {
        check_path
    } else if let Some(parent) = check_path.parent() {
        if parent.exists() {
            parent.to_path_buf()
        } else {
            return Err(format!("Path does not exist: {}", path));
        }
    } else {
        return Err(format!("Invalid path: {}", path));
    };

    let checker = Arc::new(Fs2DiskSpaceChecker::new());
    let use_case = CheckDiskSpaceUseCase::new(checker);

    let status = use_case.execute(&effective_path, required_bytes)?;

    tracing::info!(
        event = "disk_space_checked",
        available_gb = status.available_gb,
        required_gb = status.required_gb,
        sufficient = status.sufficient,
    );

    Ok(DiskSpaceInfo {
        available_gb: status.available_gb,
        required_gb: status.required_gb,
        sufficient: status.sufficient,
    })
}

/// Check disk space before importing a video file.
/// Gets the file size, multiplies by 3, and checks the temp dir volume.
#[tauri::command]
pub async fn check_disk_space_for_import(
    file_path: String,
    app_state: State<'_, AppState>,
) -> Result<DiskSpaceInfo, String> {
    tracing::info!(
        event = "check_disk_space_for_import",
        file_path = %file_path,
    );

    let path = std::path::PathBuf::from(&file_path);
    let metadata = std::fs::metadata(&path)
        .map_err(|e| format!("Cannot read file: {}", e))?;
    let file_size = metadata.len();
    let required_bytes = file_size * 3;

    let temp_dir = app_state.resolve_temp_dir();

    // Create the dir if it doesn't exist to allow space check
    let _ = std::fs::create_dir_all(&temp_dir);

    let checker = Arc::new(Fs2DiskSpaceChecker::new());
    let use_case = CheckDiskSpaceUseCase::new(checker);

    let status = use_case.execute(&temp_dir, required_bytes)?;

    tracing::info!(
        event = "import_disk_space_checked",
        file_size_bytes = file_size,
        available_gb = status.available_gb,
        required_gb = status.required_gb,
        sufficient = status.sufficient,
    );

    Ok(DiskSpaceInfo {
        available_gb: status.available_gb,
        required_gb: status.required_gb,
        sufficient: status.sufficient,
    })
}

/// Get the total cache size (proxies + temp files).
#[tauri::command]
pub async fn get_cache_size(
    app_state: State<'_, AppState>,
) -> Result<CacheSizeInfo, String> {
    tracing::info!(event = "get_cache_size");

    let proxies_dir = dirs::home_dir()
        .ok_or("Cannot find home directory")?
        .join(".splice")
        .join("proxies");

    let temp_dir = app_state.resolve_temp_dir();

    let proxies_bytes = calculate_dir_size(&proxies_dir);
    let temp_bytes = calculate_dir_size(&temp_dir);
    let total_bytes = proxies_bytes + temp_bytes;

    let info = CacheSizeInfo {
        proxies_size_gb: proxies_bytes as f64 / 1_073_741_824.0,
        temp_size_gb: temp_bytes as f64 / 1_073_741_824.0,
        total_size_gb: total_bytes as f64 / 1_073_741_824.0,
    };

    tracing::info!(
        event = "cache_size_calculated",
        proxies_gb = info.proxies_size_gb,
        temp_gb = info.temp_size_gb,
        total_gb = info.total_size_gb,
    );

    Ok(info)
}

/// Clear all cache files (proxies + temp files).
#[tauri::command]
pub async fn clear_cache(
    app_state: State<'_, AppState>,
) -> Result<CacheClearedInfo, String> {
    tracing::info!(event = "clear_cache");

    let proxies_dir = dirs::home_dir()
        .ok_or("Cannot find home directory")?
        .join(".splice")
        .join("proxies");

    let temp_dir = app_state.resolve_temp_dir();

    let proxies_bytes = calculate_dir_size(&proxies_dir);
    let temp_bytes = calculate_dir_size(&temp_dir);
    let total_bytes = proxies_bytes + temp_bytes;

    // Remove contents of proxies directory
    if proxies_dir.exists() {
        if let Err(e) = std::fs::remove_dir_all(&proxies_dir) {
            tracing::warn!(event = "clear_proxies_failed", error = %e);
        } else {
            let _ = std::fs::create_dir_all(&proxies_dir);
            tracing::info!(event = "proxies_cleared", bytes_freed = proxies_bytes);
        }
    }

    // Remove contents of temp directory
    if temp_dir.exists() {
        if let Err(e) = std::fs::remove_dir_all(&temp_dir) {
            tracing::warn!(event = "clear_temp_failed", error = %e);
        } else {
            let _ = std::fs::create_dir_all(&temp_dir);
            tracing::info!(event = "temp_cleared", bytes_freed = temp_bytes);
        }
    }

    let freed_gb = total_bytes as f64 / 1_073_741_824.0;
    tracing::info!(event = "cache_cleared", freed_gb = freed_gb);

    Ok(CacheClearedInfo { freed_gb })
}

/// Cache size information.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub struct CacheSizeInfo {
    pub proxies_size_gb: f64,
    pub temp_size_gb: f64,
    pub total_size_gb: f64,
}

/// Result of clearing the cache.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub struct CacheClearedInfo {
    pub freed_gb: f64,
}

