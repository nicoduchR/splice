use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Metadata about a backup
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub version: String,
    pub backup_date: String,
    pub app_path: String,
    pub size_bytes: u64,
}

/// Use case: Backup the current application version before applying an update
pub struct BackupCurrentVersionUseCase;

impl BackupCurrentVersionUseCase {
    pub fn new() -> Self {
        Self
    }

    /// Execute backup: copy the current app bundle to the backup directory.
    ///
    /// - `app_data_dir`: The app data directory (from Tauri)
    /// - `current_version`: The current app version string
    ///
    /// Returns the backup info on success.
    pub fn execute(
        &self,
        app_data_dir: &Path,
        current_version: &str,
    ) -> Result<BackupInfo, String> {
        let backup_dir = app_data_dir
            .join("backups")
            .join(format!("v{}", current_version));

        // Create backup directory
        std::fs::create_dir_all(&backup_dir)
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;

        // Get current executable path and determine what to backup
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get current executable path: {}", e))?;

        // On macOS, backup the .app bundle; on other platforms, backup the executable
        let source_path = get_bundle_path(&exe_path);
        let dest_name = source_path
            .file_name()
            .ok_or("Failed to get app file name")?;
        let dest_path = backup_dir.join(dest_name);

        // Copy app to backup
        copy_dir_recursive(&source_path, &dest_path)?;

        // Calculate backup size
        let size_bytes = dir_size(&dest_path);

        // Write backup-info.json
        let now = chrono::Utc::now().to_rfc3339();
        let info = BackupInfo {
            version: current_version.to_string(),
            backup_date: now,
            app_path: source_path.to_string_lossy().to_string(),
            size_bytes,
        };

        let info_path = backup_dir.join("backup-info.json");
        let info_json = serde_json::to_string_pretty(&info)
            .map_err(|e| format!("Failed to serialize backup info: {}", e))?;
        std::fs::write(&info_path, info_json)
            .map_err(|e| format!("Failed to write backup-info.json: {}", e))?;

        // H4 fix: Clean up old backups AFTER successful backup creation
        // to avoid data loss if the new backup fails.
        let backups_root = app_data_dir.join("backups");
        if backups_root.exists() {
            cleanup_old_backups(&backups_root, &format!("v{}", current_version))?;
        }

        tracing::info!(
            "Backup created: v{} -> {}",
            current_version,
            backup_dir.display()
        );

        Ok(info)
    }
}

/// On macOS, navigate up from the executable to find the .app bundle.
/// On other platforms, return the executable path itself.
fn get_bundle_path(exe_path: &Path) -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        // exe_path = /Applications/Splice.app/Contents/MacOS/Splice
        // bundle_path = /Applications/Splice.app
        if let Some(bundle) = exe_path
            .parent() // MacOS/
            .and_then(|p| p.parent()) // Contents/
            .and_then(|p| p.parent()) // Splice.app/
        {
            if bundle
                .extension()
                .map(|ext| ext == "app")
                .unwrap_or(false)
            {
                return bundle.to_path_buf();
            }
        }
        // Fallback: just use the executable
        exe_path.to_path_buf()
    }

    #[cfg(not(target_os = "macos"))]
    {
        exe_path.to_path_buf()
    }
}

/// Recursively copy a directory or file.
pub(crate) fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    if src.is_file() {
        std::fs::copy(src, dst)
            .map_err(|e| format!("Failed to copy file {} -> {}: {}", src.display(), dst.display(), e))?;
        return Ok(());
    }

    std::fs::create_dir_all(dst)
        .map_err(|e| format!("Failed to create directory {}: {}", dst.display(), e))?;

    let entries = std::fs::read_dir(src)
        .map_err(|e| format!("Failed to read directory {}: {}", src.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read dir entry: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        copy_dir_recursive(&src_path, &dst_path)?;
    }

    Ok(())
}

/// Calculate total size of a directory recursively.
fn dir_size(path: &Path) -> u64 {
    if path.is_file() {
        return path.metadata().map(|m| m.len()).unwrap_or(0);
    }

    std::fs::read_dir(path)
        .ok()
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .map(|e| dir_size(&e.path()))
                .sum()
        })
        .unwrap_or(0)
}

/// Clean up old backup directories, keeping only the specified version.
fn cleanup_old_backups(backups_root: &Path, keep_version: &str) -> Result<(), String> {
    if !backups_root.exists() {
        return Ok(());
    }

    let entries = std::fs::read_dir(backups_root)
        .map_err(|e| format!("Failed to read backups directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read backup entry: {}", e))?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name != keep_version && entry.path().is_dir() {
            tracing::info!("Removing old backup: {}", name);
            std::fs::remove_dir_all(entry.path())
                .map_err(|e| format!("Failed to remove old backup {}: {}", name, e))?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backup_info_serialization() {
        let info = BackupInfo {
            version: "1.0.0".to_string(),
            backup_date: "2026-01-15T10:00:00Z".to_string(),
            app_path: "/Applications/Splice.app".to_string(),
            size_bytes: 50_000_000,
        };

        let json = serde_json::to_string(&info).unwrap();
        let deserialized: BackupInfo = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.version, "1.0.0");
        assert_eq!(deserialized.size_bytes, 50_000_000);
    }

    #[test]
    fn test_copy_dir_recursive_file() {
        let dir = tempfile::tempdir().unwrap();
        let src = dir.path().join("source.txt");
        let dst = dir.path().join("dest.txt");

        std::fs::write(&src, "hello world").unwrap();
        copy_dir_recursive(&src, &dst).unwrap();

        assert_eq!(std::fs::read_to_string(&dst).unwrap(), "hello world");
    }

    #[test]
    fn test_copy_dir_recursive_directory() {
        let dir = tempfile::tempdir().unwrap();
        let src_dir = dir.path().join("src");
        let dst_dir = dir.path().join("dst");

        std::fs::create_dir(&src_dir).unwrap();
        std::fs::write(src_dir.join("a.txt"), "file a").unwrap();
        std::fs::create_dir(src_dir.join("sub")).unwrap();
        std::fs::write(src_dir.join("sub").join("b.txt"), "file b").unwrap();

        copy_dir_recursive(&src_dir, &dst_dir).unwrap();

        assert_eq!(
            std::fs::read_to_string(dst_dir.join("a.txt")).unwrap(),
            "file a"
        );
        assert_eq!(
            std::fs::read_to_string(dst_dir.join("sub").join("b.txt")).unwrap(),
            "file b"
        );
    }

    #[test]
    fn test_dir_size() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::write(dir.path().join("a.txt"), "hello").unwrap(); // 5 bytes
        std::fs::write(dir.path().join("b.txt"), "world!").unwrap(); // 6 bytes

        let size = dir_size(dir.path());
        assert_eq!(size, 11);
    }

    #[test]
    fn test_cleanup_old_backups() {
        let dir = tempfile::tempdir().unwrap();
        let backups = dir.path().join("backups");

        std::fs::create_dir_all(backups.join("v1.0.0")).unwrap();
        std::fs::write(backups.join("v1.0.0").join("info.json"), "{}").unwrap();

        std::fs::create_dir_all(backups.join("v1.1.0")).unwrap();
        std::fs::write(backups.join("v1.1.0").join("info.json"), "{}").unwrap();

        cleanup_old_backups(&backups, "v1.1.0").unwrap();

        assert!(!backups.join("v1.0.0").exists());
        assert!(backups.join("v1.1.0").exists());
    }

    #[test]
    fn test_cleanup_old_backups_nonexistent_dir() {
        let result = cleanup_old_backups(Path::new("/tmp/nonexistent_backups_test_12345"), "v1.0.0");
        assert!(result.is_ok());
    }

    #[test]
    fn test_backup_info_json_write_and_read() {
        let dir = tempfile::tempdir().unwrap();
        let info = BackupInfo {
            version: "2.0.0".to_string(),
            backup_date: "2026-02-01T12:00:00Z".to_string(),
            app_path: "/test/app".to_string(),
            size_bytes: 1024,
        };

        let path = dir.path().join("backup-info.json");
        let json = serde_json::to_string_pretty(&info).unwrap();
        std::fs::write(&path, &json).unwrap();

        let loaded: BackupInfo =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(loaded.version, "2.0.0");
        assert_eq!(loaded.app_path, "/test/app");
    }

    #[test]
    fn test_get_bundle_path_non_macos_returns_exe() {
        // On non-macOS or when the exe is not inside a .app bundle,
        // get_bundle_path should return the exe path itself
        let path = PathBuf::from("/usr/bin/my_app");
        let bundle = get_bundle_path(&path);
        // On macOS test env, if not inside .app, falls back to exe
        // On other platforms, always returns exe
        assert!(bundle.to_string_lossy().contains("my_app"));
    }
}
