use std::path::Path;

/// Use case: Clean up old backups, keeping only the most recent one
#[derive(Default)]
pub struct CleanupOldBackupsUseCase;

impl CleanupOldBackupsUseCase {
    pub fn new() -> Self {
        Self
    }

    /// Remove all backups except the most recent one.
    /// Returns the number of backups removed.
    pub fn execute(&self, app_data_dir: &Path) -> Result<usize, String> {
        let backups_dir = app_data_dir.join("backups");

        if !backups_dir.exists() {
            return Ok(0);
        }

        let mut backup_dirs: Vec<_> = std::fs::read_dir(&backups_dir)
            .map_err(|e| format!("Failed to read backups directory: {}", e))?
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_dir())
            .collect();

        if backup_dirs.len() <= 1 {
            return Ok(0);
        }

        // Sort by modification time (most recent last)
        backup_dirs.sort_by_key(|e| {
            e.metadata()
                .and_then(|m| m.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
        });

        // Remove all but the last (most recent)
        let to_remove = &backup_dirs[..backup_dirs.len() - 1];
        let mut removed = 0;

        for entry in to_remove {
            let path = entry.path();
            tracing::info!("Removing old backup: {}", path.display());
            if let Err(e) = std::fs::remove_dir_all(&path) {
                tracing::warn!("Failed to remove old backup {}: {}", path.display(), e);
            } else {
                removed += 1;
            }
        }

        Ok(removed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cleanup_no_backups_dir() {
        let dir = tempfile::tempdir().unwrap();
        let use_case = CleanupOldBackupsUseCase::new();

        let result = use_case.execute(dir.path());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0);
    }

    #[test]
    fn test_cleanup_single_backup_kept() {
        let dir = tempfile::tempdir().unwrap();
        let backups = dir.path().join("backups");
        std::fs::create_dir_all(backups.join("v1.0.0")).unwrap();

        let use_case = CleanupOldBackupsUseCase::new();
        let result = use_case.execute(dir.path());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0);
        assert!(backups.join("v1.0.0").exists());
    }

    #[test]
    fn test_cleanup_removes_old_keeps_newest() {
        let dir = tempfile::tempdir().unwrap();
        let backups = dir.path().join("backups");

        // Create "old" backup
        let old = backups.join("v1.0.0");
        std::fs::create_dir_all(&old).unwrap();
        std::fs::write(old.join("backup-info.json"), "{}").unwrap();

        // Small delay to ensure different modification times
        std::thread::sleep(std::time::Duration::from_millis(50));

        // Create "new" backup
        let new = backups.join("v1.1.0");
        std::fs::create_dir_all(&new).unwrap();
        std::fs::write(new.join("backup-info.json"), "{}").unwrap();

        let use_case = CleanupOldBackupsUseCase::new();
        let result = use_case.execute(dir.path());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);

        // Old should be removed, new should remain
        assert!(!old.exists());
        assert!(new.exists());
    }
}
