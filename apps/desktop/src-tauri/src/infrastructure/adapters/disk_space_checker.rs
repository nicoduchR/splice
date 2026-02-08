use std::path::Path;

use crate::domain::errors::DomainError;
use crate::domain::services::DiskSpaceChecker;

/// Cross-platform disk space checker using `fs2::available_space()`.
pub struct Fs2DiskSpaceChecker;

impl Fs2DiskSpaceChecker {
    pub fn new() -> Self {
        Self
    }
}

impl DiskSpaceChecker for Fs2DiskSpaceChecker {
    fn get_available_space(&self, path: &Path) -> Result<u64, DomainError> {
        if !path.exists() {
            return Err(DomainError::InvalidFilePath(
                format!("Path does not exist: {}", path.display()),
            ));
        }

        fs2::available_space(path).map_err(|e| {
            DomainError::ProcessingError(format!(
                "Failed to check disk space for {}: {}",
                path.display(),
                e
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_available_space_returns_positive_value() {
        let checker = Fs2DiskSpaceChecker::new();
        let result = checker.get_available_space(Path::new("/"));
        assert!(result.is_ok());
        assert!(result.unwrap() > 0);
    }

    #[test]
    fn test_invalid_path_returns_error() {
        let checker = Fs2DiskSpaceChecker::new();
        let result = checker.get_available_space(&PathBuf::from("/nonexistent/path/that/does/not/exist"));
        assert!(result.is_err());
    }
}
