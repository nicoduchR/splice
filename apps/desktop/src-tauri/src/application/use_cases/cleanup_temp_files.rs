use std::path::Path;

/// Calculate total size of a directory recursively.
/// Shared utility used by CleanupTempFilesUseCase and disk_commands.
pub fn calculate_dir_size(path: &Path) -> u64 {
    if !path.exists() {
        return 0;
    }
    let mut total: u64 = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if entry_path.is_dir() {
                total += calculate_dir_size(&entry_path);
            } else if let Ok(metadata) = entry.metadata() {
                total += metadata.len();
            }
        }
    }
    total
}

/// Use case: Clean up orphaned temporary files at app startup.
/// Removes directories and files that are residuals from previous crashed sessions.
#[derive(Default)]
pub struct CleanupTempFilesUseCase;

impl CleanupTempFilesUseCase {
    pub fn new() -> Self {
        Self
    }

    /// Remove orphaned temp directories and files from the given temp directory.
    /// Returns the total bytes freed.
    pub fn execute(&self, temp_dir: &Path) -> Result<u64, String> {
        if !temp_dir.exists() {
            return Ok(0);
        }

        let mut total_bytes_freed: u64 = 0;

        let entries = std::fs::read_dir(temp_dir)
            .map_err(|e| format!("Failed to read temp directory: {}", e))?;

        for entry in entries.flatten() {
            let path = entry.path();

            if path.is_dir() {
                // Project temp directories (e.g., temp/{project_id}/)
                let size = calculate_dir_size(&path);
                match std::fs::remove_dir_all(&path) {
                    Ok(()) => {
                        tracing::info!(
                            event = "temp_dir_cleaned",
                            path = %path.display(),
                            bytes_freed = size,
                        );
                        total_bytes_freed += size;
                    }
                    Err(e) => {
                        tracing::warn!(
                            event = "temp_dir_cleanup_failed",
                            path = %path.display(),
                            error = %e,
                        );
                    }
                }
            } else {
                // Orphaned files (e.g., audio-*.wav from crashed transcriptions)
                let file_size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                match std::fs::remove_file(&path) {
                    Ok(()) => {
                        tracing::info!(
                            event = "temp_file_cleaned",
                            path = %path.display(),
                            bytes_freed = file_size,
                        );
                        total_bytes_freed += file_size;
                    }
                    Err(e) => {
                        tracing::warn!(
                            event = "temp_file_cleanup_failed",
                            path = %path.display(),
                            error = %e,
                        );
                    }
                }
            }
        }

        tracing::info!(
            event = "temp_cleanup_completed",
            total_bytes_freed = total_bytes_freed,
        );

        Ok(total_bytes_freed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::io::Write;

    #[test]
    fn test_calculate_dir_size_empty() {
        let tmp = TempDir::new().unwrap();
        assert_eq!(calculate_dir_size(tmp.path()), 0);
    }

    #[test]
    fn test_calculate_dir_size_with_files() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("test.txt");
        let mut file = std::fs::File::create(&file_path).unwrap();
        file.write_all(b"hello world").unwrap();
        assert_eq!(calculate_dir_size(tmp.path()), 11);
    }

    #[test]
    fn test_calculate_dir_size_nested() {
        let tmp = TempDir::new().unwrap();
        let sub_dir = tmp.path().join("sub");
        std::fs::create_dir_all(&sub_dir).unwrap();
        let mut file = std::fs::File::create(sub_dir.join("nested.txt")).unwrap();
        file.write_all(b"data").unwrap();
        assert_eq!(calculate_dir_size(tmp.path()), 4);
    }

    #[test]
    fn test_calculate_dir_size_nonexistent() {
        assert_eq!(calculate_dir_size(std::path::Path::new("/nonexistent/path")), 0);
    }

    #[test]
    fn test_cleanup_orphaned_temp_dirs() {
        let tmp = TempDir::new().unwrap();
        let temp_dir = tmp.path().join("temp");
        std::fs::create_dir_all(&temp_dir).unwrap();

        // Create orphaned project dir with segment files
        let project_dir = temp_dir.join("project-123");
        std::fs::create_dir_all(&project_dir).unwrap();
        let mut f = std::fs::File::create(project_dir.join("segment_000.mp4")).unwrap();
        f.write_all(&[0u8; 1024]).unwrap();

        let use_case = CleanupTempFilesUseCase::new();
        let freed = use_case.execute(&temp_dir).unwrap();

        assert!(freed >= 1024);
        assert!(!project_dir.exists());
    }

    #[test]
    fn test_cleanup_orphaned_wav_files() {
        let tmp = TempDir::new().unwrap();
        let temp_dir = tmp.path().join("temp");
        std::fs::create_dir_all(&temp_dir).unwrap();

        // Create orphaned wav file
        let wav_path = temp_dir.join("audio-video123.wav");
        let mut f = std::fs::File::create(&wav_path).unwrap();
        f.write_all(&[0u8; 512]).unwrap();

        let use_case = CleanupTempFilesUseCase::new();
        let freed = use_case.execute(&temp_dir).unwrap();

        assert!(freed >= 512);
        assert!(!wav_path.exists());
    }

    #[test]
    fn test_cleanup_empty_temp_dir() {
        let tmp = TempDir::new().unwrap();
        let temp_dir = tmp.path().join("temp");
        std::fs::create_dir_all(&temp_dir).unwrap();

        let use_case = CleanupTempFilesUseCase::new();
        let freed = use_case.execute(&temp_dir).unwrap();

        assert_eq!(freed, 0);
    }

    #[test]
    fn test_cleanup_nonexistent_temp_dir() {
        let tmp = TempDir::new().unwrap();
        let nonexistent = tmp.path().join("does_not_exist");

        let use_case = CleanupTempFilesUseCase::new();
        let freed = use_case.execute(&nonexistent).unwrap();

        assert_eq!(freed, 0);
    }
}
