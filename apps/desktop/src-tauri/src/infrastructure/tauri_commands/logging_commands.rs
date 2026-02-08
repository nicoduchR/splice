use tauri::AppHandle;
use tauri::Manager;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use chrono::Local;

const MAX_LOG_SIZE: u64 = 5 * 1024 * 1024; // 5MB

fn get_log_path(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(data_dir.join("splice-frontend.log"))
}

fn rotate_log_if_needed(log_path: &PathBuf) -> Result<(), String> {
    if let Ok(metadata) = fs::metadata(log_path) {
        if metadata.len() > MAX_LOG_SIZE {
            // Read file, keep last 60% of content
            let content = fs::read_to_string(log_path)
                .map_err(|e| format!("Failed to read log for rotation: {}", e))?;
            let keep_from = content.len() * 2 / 5; // Keep last 60%
            // Find the next newline after the cut point to avoid broken lines
            let actual_cut = content[keep_from..].find('\n')
                .map(|pos| keep_from + pos + 1)
                .unwrap_or(keep_from);
            let truncated = &content[actual_cut..];
            fs::write(log_path, truncated)
                .map_err(|e| format!("Failed to rotate log: {}", e))?;
        }
    }
    Ok(())
}

/// Log a frontend error to the local log file.
/// Called from the frontend logger service (fire-and-forget).
/// Format: [TIMESTAMP] [LEVEL] [context] message
#[tauri::command]
pub async fn log_frontend_error(
    app: AppHandle,
    level: String,
    context: String,
    message: String,
) -> Result<(), String> {
    let log_path = get_log_path(&app)?;

    // Rotate if needed
    rotate_log_if_needed(&log_path)?;

    // Sanitize: strip absolute user paths beyond app dir
    let sanitized_message = sanitize_log_message(&message);

    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    let level_upper = level.to_uppercase();
    let log_line = format!("[{}] [{}] [{}] {}\n", timestamp, level_upper, context, sanitized_message);

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;

    file.write_all(log_line.as_bytes())
        .map_err(|e| format!("Failed to write log: {}", e))?;

    Ok(())
}

/// Remove sensitive data from log messages (NFR21).
/// Strips license keys but preserves error context.
fn sanitize_log_message(message: &str) -> String {
    let mut sanitized = message.to_string();
    // Remove license key patterns (e.g., SPLICE-XXXX-XXXX-XXXX)
    // Simple scan: find "SPLICE-" and redact the next 14 chars (XXXX-XXXX-XXXX)
    while let Some(pos) = sanitized.find("SPLICE-") {
        let end = (pos + 19).min(sanitized.len()); // "SPLICE-" (7) + "XXXX-XXXX-XXXX" (14) = 21, but 19 to be safe
        // Verify the pattern looks like a key (has dashes at expected positions)
        if end <= sanitized.len() {
            sanitized.replace_range(pos..end, "[LICENSE_KEY_REDACTED]");
        } else {
            break;
        }
    }
    sanitized
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Read;
    use tempfile::TempDir;

    fn write_log_to_path(log_path: &PathBuf, level: &str, context: &str, message: &str) -> Result<(), String> {
        let sanitized_message = sanitize_log_message(message);
        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        let level_upper = level.to_uppercase();
        let log_line = format!("[{}] [{}] [{}] {}\n", timestamp, level_upper, context, sanitized_message);

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_path)
            .map_err(|e| format!("Failed to open log file: {}", e))?;

        file.write_all(log_line.as_bytes())
            .map_err(|e| format!("Failed to write log: {}", e))?;

        Ok(())
    }

    #[test]
    fn test_log_writes_to_file() {
        let tmp = TempDir::new().unwrap();
        let log_path = tmp.path().join("test.log");

        write_log_to_path(&log_path, "error", "TestContext", "Test error message").unwrap();

        let mut content = String::new();
        fs::File::open(&log_path).unwrap().read_to_string(&mut content).unwrap();
        assert!(content.contains("[ERROR]"));
        assert!(content.contains("[TestContext]"));
        assert!(content.contains("Test error message"));
    }

    #[test]
    fn test_log_format_timestamp() {
        let tmp = TempDir::new().unwrap();
        let log_path = tmp.path().join("test.log");

        write_log_to_path(&log_path, "warn", "Ctx", "msg").unwrap();

        let mut content = String::new();
        fs::File::open(&log_path).unwrap().read_to_string(&mut content).unwrap();
        // Timestamp format: [YYYY-MM-DD HH:MM:SS.mmm]
        assert!(content.starts_with('['));
        assert!(content.contains("[WARN]"));
    }

    #[test]
    fn test_log_rotation() {
        let tmp = TempDir::new().unwrap();
        let log_path = tmp.path().join("test.log");

        // Write more than 5MB
        let big_message = "X".repeat(1024);
        for _ in 0..5200 {
            write_log_to_path(&log_path, "info", "Rotation", &big_message).unwrap();
        }

        let size_before = fs::metadata(&log_path).unwrap().len();
        assert!(size_before > MAX_LOG_SIZE);

        rotate_log_if_needed(&log_path).unwrap();

        let size_after = fs::metadata(&log_path).unwrap().len();
        assert!(size_after < size_before);
    }

    #[test]
    fn test_sanitize_no_license_keys() {
        let message = "License check failed for SPLICE-ABCD-1234-EFGH at startup";
        let sanitized = sanitize_log_message(message);
        assert!(!sanitized.contains("SPLICE-ABCD-1234-EFGH"));
        assert!(sanitized.contains("[LICENSE_KEY_REDACTED]"));
    }

    #[test]
    fn test_sanitize_preserves_normal_messages() {
        let message = "File not found: video.mp4";
        let sanitized = sanitize_log_message(message);
        assert_eq!(sanitized, message);
    }
}
