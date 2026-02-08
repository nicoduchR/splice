use serde::{Deserialize, Serialize};
use tauri::{Manager, State};
use ts_rs::TS;

use crate::application::use_cases::{BackupInfo, RestoreBackupUseCase};
use crate::infrastructure::config::app_state::AppState;

/// Backup info response for frontend
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
#[serde(rename_all = "camelCase")]
pub struct BackupInfoResponse {
    pub version: String,
    pub backup_date: String,
    pub size_mb: f64,
}

impl From<BackupInfo> for BackupInfoResponse {
    fn from(info: BackupInfo) -> Self {
        Self {
            version: info.version,
            backup_date: info.backup_date,
            size_mb: info.size_bytes as f64 / (1024.0 * 1024.0),
        }
    }
}

/// Rollback completed event payload
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
#[serde(rename_all = "camelCase")]
pub struct RollbackCompletedEvent {
    pub previous_version: String,
    pub restored_version: String,
}

/// Get backup information for the previous version.
///
/// Returns None if no backup exists.
#[tauri::command]
pub fn get_backup_info(
    app: tauri::AppHandle,
) -> Result<Option<BackupInfoResponse>, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let use_case = RestoreBackupUseCase::new();
    match use_case.get_backup_info(&app_data_dir) {
        Some(info) => Ok(Some(BackupInfoResponse::from(info))),
        None => Ok(None),
    }
}

/// Perform a manual rollback to the previous version.
///
/// This will restore the backup and restart the app.
#[tauri::command]
pub async fn manual_rollback(
    app: tauri::AppHandle,
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let use_case = RestoreBackupUseCase::new();
    let restored_version = use_case.execute(&app_data_dir)?;

    tracing::info!("Manual rollback completed to v{}", restored_version);

    // Clear crash tracker state
    if let Some(state) = app.try_state::<AppState>() {
        let mut tracker = state.crash_tracker.lock().unwrap();
        tracker.clear_rollback();
        let tracker_path = app_data_dir.join("crash-tracker.json");
        if let Err(e) = tracker.save_to_file(&tracker_path) {
            tracing::warn!("Failed to save crash tracker after rollback: {}", e);
        }
    }

    // Restart the app to apply the restored version
    app.restart();
}

/// Get the current consecutive crash count.
#[tauri::command]
pub fn get_crash_count(
    state: State<'_, AppState>,
) -> Result<u32, String> {
    let tracker = state.crash_tracker.lock().unwrap();
    Ok(tracker.consecutive_crashes)
}

/// Send a crash report to the backend.
///
/// Reads the last 100 lines of the app log and sends them along with
/// crash metadata. Sanitizes paths to remove user-specific information.
#[tauri::command]
pub async fn send_crash_report(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    include_logs: bool,
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let tracker = state.crash_tracker.lock().unwrap();
    let crash_count = tracker.consecutive_crashes;
    let previous_version = tracker.previous_version.clone().unwrap_or_default();
    drop(tracker);

    let current_version = app.package_info().version.to_string();
    let platform = std::env::consts::OS.to_string();

    let error_log = if include_logs {
        read_sanitized_log(&app_data_dir, 100)
    } else {
        None
    };

    // Build the crash report payload
    let report = serde_json::json!({
        "version": current_version,
        "platform": platform,
        "crash_count": crash_count,
        "previous_version": previous_version,
        "error_log": error_log,
    });

    tracing::info!("Crash report prepared: v{} on {} ({} crashes)", current_version, platform, crash_count);

    // Send crash report to backend API
    let api_url = std::env::var("SPLICE_API_URL")
        .unwrap_or_else(|_| "http://localhost:3001".to_string());
    let url = format!("{}/api/v1/crashes/report", api_url);

    let client = reqwest::Client::new();
    match client.post(&url).json(&report).send().await {
        Ok(resp) => {
            if resp.status().is_success() {
                tracing::info!("Crash report sent successfully");
            } else {
                tracing::warn!("Crash report server returned status {}", resp.status());
            }
        }
        Err(e) => {
            // Log but don't fail — crash report is best-effort
            tracing::warn!("Failed to send crash report (best-effort): {}", e);
        }
    }

    Ok(())
}

/// Read the last N lines of the app log file and sanitize paths.
fn read_sanitized_log(app_data_dir: &std::path::Path, max_lines: usize) -> Option<String> {
    let log_path = app_data_dir.join("logs").join("splice.log");

    let content = std::fs::read_to_string(&log_path).ok()?;
    let lines: Vec<&str> = content.lines().collect();
    let start = if lines.len() > max_lines {
        lines.len() - max_lines
    } else {
        0
    };

    let last_lines = &lines[start..];
    let sanitized = last_lines
        .iter()
        .map(|line| sanitize_path(line))
        .collect::<Vec<_>>()
        .join("\n");

    Some(sanitized)
}

/// Replace user-specific paths with ~/
fn sanitize_path(line: &str) -> String {
    let mut result = line.to_string();

    // Sanitize macOS paths: /Users/username/ → ~/
    while let Some(start) = result.find("/Users/") {
        let rest = &result[start + 7..]; // skip "/Users/"
        if let Some(slash_pos) = rest.find('/') {
            let end = start + 7 + slash_pos + 1; // include trailing /
            let before = result[..start].to_string();
            let after = result[end..].to_string();
            result = format!("{}~/{}", before, after);
        } else {
            break;
        }
    }

    // Sanitize Linux paths: /home/username/ → ~/
    while let Some(start) = result.find("/home/") {
        let rest = &result[start + 6..]; // skip "/home/"
        if let Some(slash_pos) = rest.find('/') {
            let end = start + 6 + slash_pos + 1;
            let before = result[..start].to_string();
            let after = result[end..].to_string();
            result = format!("{}~/{}", before, after);
        } else {
            break;
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backup_info_response_from_backup_info() {
        let info = BackupInfo {
            version: "1.0.0".to_string(),
            backup_date: "2026-01-15T10:00:00Z".to_string(),
            app_path: "/Applications/Splice.app".to_string(),
            size_bytes: 52_428_800, // 50 MB
        };

        let response = BackupInfoResponse::from(info);
        assert_eq!(response.version, "1.0.0");
        assert_eq!(response.backup_date, "2026-01-15T10:00:00Z");
        assert!((response.size_mb - 50.0).abs() < 0.01);
    }

    #[test]
    fn test_backup_info_response_zero_size() {
        let info = BackupInfo {
            version: "2.0.0".to_string(),
            backup_date: "2026-02-01T12:00:00Z".to_string(),
            app_path: "/test".to_string(),
            size_bytes: 0,
        };

        let response = BackupInfoResponse::from(info);
        assert_eq!(response.size_mb, 0.0);
    }

    #[test]
    fn test_sanitize_path_macos() {
        let line = "/Users/john/Documents/project/file.rs:42 error occurred";
        let sanitized = sanitize_path(line);
        assert_eq!(sanitized, "~/Documents/project/file.rs:42 error occurred");
    }

    #[test]
    fn test_sanitize_path_linux() {
        let line = "/home/john/projects/app/src/main.rs:10 crash";
        let sanitized = sanitize_path(line);
        assert_eq!(sanitized, "~/projects/app/src/main.rs:10 crash");
    }

    #[test]
    fn test_sanitize_path_multiple_paths() {
        let line = "Error at /Users/john/file.rs and /Users/john/other.rs";
        let sanitized = sanitize_path(line);
        assert_eq!(sanitized, "Error at ~/file.rs and ~/other.rs");
    }

    #[test]
    fn test_sanitize_path_with_prefix_and_suffix() {
        let line = "[2026-01-15] /Users/alice/app/crash.log:42 panicked";
        let sanitized = sanitize_path(line);
        assert_eq!(sanitized, "[2026-01-15] ~/app/crash.log:42 panicked");
    }

    #[test]
    fn test_sanitize_path_no_user_path() {
        let line = "Error: connection timeout at 10:30";
        let sanitized = sanitize_path(line);
        assert_eq!(sanitized, "Error: connection timeout at 10:30");
    }

    #[test]
    fn test_read_sanitized_log_no_file() {
        let dir = tempfile::tempdir().unwrap();
        let result = read_sanitized_log(dir.path(), 100);
        assert!(result.is_none());
    }

    #[test]
    fn test_read_sanitized_log_with_file() {
        let dir = tempfile::tempdir().unwrap();
        let logs_dir = dir.path().join("logs");
        std::fs::create_dir_all(&logs_dir).unwrap();

        let mut lines = Vec::new();
        for i in 0..150 {
            lines.push(format!("Line {}: /Users/test/app/log", i));
        }
        std::fs::write(logs_dir.join("splice.log"), lines.join("\n")).unwrap();

        let result = read_sanitized_log(dir.path(), 100);
        assert!(result.is_some());
        let log = result.unwrap();
        let log_lines: Vec<&str> = log.lines().collect();
        assert_eq!(log_lines.len(), 100);
        // Should start from line 50 (150 - 100)
        assert!(log_lines[0].contains("Line 50"));
        // Should be sanitized
        assert!(log_lines[0].contains("~/"));
        assert!(!log_lines[0].contains("/Users/test/"));
    }

    #[test]
    fn test_rollback_completed_event_serialization() {
        let event = RollbackCompletedEvent {
            previous_version: "1.1.0".to_string(),
            restored_version: "1.0.0".to_string(),
        };

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("previousVersion"));
        assert!(json.contains("restoredVersion"));
    }
}
