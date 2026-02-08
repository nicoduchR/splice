use std::path::Path;

use crate::application::use_cases::backup_current_version::{BackupInfo, copy_dir_recursive};

/// Use case: Restore the application from a backup
pub struct RestoreBackupUseCase;

impl RestoreBackupUseCase {
    pub fn new() -> Self {
        Self
    }

    /// Check if a valid backup exists and return its info.
    pub fn get_backup_info(&self, app_data_dir: &Path) -> Option<BackupInfo> {
        let backups_dir = app_data_dir.join("backups");
        if !backups_dir.exists() {
            return None;
        }

        // Find the first backup directory with a valid backup-info.json
        let entries = std::fs::read_dir(&backups_dir).ok()?;
        for entry in entries.flatten() {
            let info_path = entry.path().join("backup-info.json");
            if info_path.exists() {
                if let Ok(content) = std::fs::read_to_string(&info_path) {
                    if let Ok(info) = serde_json::from_str::<BackupInfo>(&content) {
                        return Some(info);
                    }
                }
            }
        }

        None
    }

    /// Restore the app from backup.
    ///
    /// Returns the restored version string on success.
    pub fn execute(&self, app_data_dir: &Path) -> Result<String, String> {
        let info = self
            .get_backup_info(app_data_dir)
            .ok_or("No valid backup found")?;

        let backup_dir = app_data_dir
            .join("backups")
            .join(format!("v{}", info.version));

        // Verify backup directory exists
        if !backup_dir.exists() {
            return Err(format!("Backup directory not found: {}", backup_dir.display()));
        }

        // Find the backed-up app in the backup directory
        let backup_entries: Vec<_> = std::fs::read_dir(&backup_dir)
            .map_err(|e| format!("Failed to read backup directory: {}", e))?
            .filter_map(|e| e.ok())
            .filter(|e| e.file_name().to_string_lossy() != "backup-info.json")
            .collect();

        if backup_entries.is_empty() {
            return Err("Backup directory is empty (no app found)".to_string());
        }

        let backup_app = &backup_entries[0].path();
        let restore_target = Path::new(&info.app_path);

        // Perform the restore: copy backup over the current app
        copy_dir_recursive(backup_app, restore_target)?;

        tracing::info!(
            "Backup restored: v{} from {}",
            info.version,
            backup_dir.display()
        );

        // Clean up the backup after successful restore
        if let Err(e) = std::fs::remove_dir_all(&backup_dir) {
            tracing::warn!("Failed to clean up backup after restore: {}", e);
        }

        Ok(info.version)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_backup_info_no_backups_dir() {
        let dir = tempfile::tempdir().unwrap();
        let use_case = RestoreBackupUseCase::new();

        let info = use_case.get_backup_info(dir.path());
        assert!(info.is_none());
    }

    #[test]
    fn test_get_backup_info_with_valid_backup() {
        let dir = tempfile::tempdir().unwrap();
        let backup_dir = dir.path().join("backups").join("v1.0.0");
        std::fs::create_dir_all(&backup_dir).unwrap();

        let info = BackupInfo {
            version: "1.0.0".to_string(),
            backup_date: "2026-01-15T10:00:00Z".to_string(),
            app_path: "/Applications/Splice.app".to_string(),
            size_bytes: 50_000_000,
        };
        let json = serde_json::to_string_pretty(&info).unwrap();
        std::fs::write(backup_dir.join("backup-info.json"), json).unwrap();

        let use_case = RestoreBackupUseCase::new();
        let result = use_case.get_backup_info(dir.path());
        assert!(result.is_some());
        assert_eq!(result.unwrap().version, "1.0.0");
    }

    #[test]
    fn test_get_backup_info_invalid_json() {
        let dir = tempfile::tempdir().unwrap();
        let backup_dir = dir.path().join("backups").join("v1.0.0");
        std::fs::create_dir_all(&backup_dir).unwrap();
        std::fs::write(backup_dir.join("backup-info.json"), "not json").unwrap();

        let use_case = RestoreBackupUseCase::new();
        let result = use_case.get_backup_info(dir.path());
        assert!(result.is_none());
    }

    #[test]
    fn test_restore_no_backup_returns_error() {
        let dir = tempfile::tempdir().unwrap();
        let use_case = RestoreBackupUseCase::new();

        let result = use_case.execute(dir.path());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("No valid backup found"));
    }

    #[test]
    fn test_restore_with_file_backup() {
        let dir = tempfile::tempdir().unwrap();

        // Create a "current app" file that will be the restore target
        let app_path = dir.path().join("current_app");
        std::fs::write(&app_path, "old version").unwrap();

        // Create backup
        let backup_dir = dir.path().join("backups").join("v1.0.0");
        std::fs::create_dir_all(&backup_dir).unwrap();

        // The backed-up "app" (a simple file for testing)
        std::fs::write(backup_dir.join("current_app"), "backup version").unwrap();

        let info = BackupInfo {
            version: "1.0.0".to_string(),
            backup_date: "2026-01-15T10:00:00Z".to_string(),
            app_path: app_path.to_string_lossy().to_string(),
            size_bytes: 14,
        };
        let json = serde_json::to_string_pretty(&info).unwrap();
        std::fs::write(backup_dir.join("backup-info.json"), json).unwrap();

        let use_case = RestoreBackupUseCase::new();
        let result = use_case.execute(dir.path());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "1.0.0");

        // Verify the file was restored
        assert_eq!(std::fs::read_to_string(&app_path).unwrap(), "backup version");

        // Verify backup directory was cleaned up
        assert!(!backup_dir.exists());
    }
}
