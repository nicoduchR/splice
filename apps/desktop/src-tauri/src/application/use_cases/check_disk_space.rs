use std::path::Path;
use std::sync::Arc;

use serde::Serialize;
use ts_rs::TS;

use crate::domain::services::DiskSpaceChecker;

/// Result of a disk space check.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub struct DiskSpaceStatus {
    pub available_gb: f64,
    pub required_gb: f64,
    pub sufficient: bool,
}

/// Use case: Check if there is enough disk space for an operation.
pub struct CheckDiskSpaceUseCase {
    disk_space_checker: Arc<dyn DiskSpaceChecker>,
}

impl CheckDiskSpaceUseCase {
    pub fn new(disk_space_checker: Arc<dyn DiskSpaceChecker>) -> Self {
        Self { disk_space_checker }
    }

    /// Check disk space on the volume containing `path`.
    /// `required_bytes` is the estimated space needed for the operation.
    pub fn execute(&self, path: &Path, required_bytes: u64) -> Result<DiskSpaceStatus, String> {
        let available_bytes = self
            .disk_space_checker
            .get_available_space(path)
            .map_err(|e| e.to_string())?;

        let available_gb = available_bytes as f64 / 1_073_741_824.0;
        let required_gb = required_bytes as f64 / 1_073_741_824.0;
        let sufficient = available_bytes >= required_bytes;

        Ok(DiskSpaceStatus {
            available_gb,
            required_gb,
            sufficient,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::errors::DomainError;

    struct MockDiskSpaceChecker {
        available_bytes: u64,
    }

    impl DiskSpaceChecker for MockDiskSpaceChecker {
        fn get_available_space(&self, _path: &Path) -> Result<u64, DomainError> {
            Ok(self.available_bytes)
        }
    }

    struct FailingDiskSpaceChecker;

    impl DiskSpaceChecker for FailingDiskSpaceChecker {
        fn get_available_space(&self, _path: &Path) -> Result<u64, DomainError> {
            Err(DomainError::ProcessingError("Disk check failed".to_string()))
        }
    }

    #[test]
    fn test_sufficient_space() {
        let checker = Arc::new(MockDiskSpaceChecker {
            available_bytes: 10 * 1_073_741_824, // 10 GB
        });
        let use_case = CheckDiskSpaceUseCase::new(checker);
        let result = use_case
            .execute(Path::new("/"), 3 * 1_073_741_824) // 3 GB required
            .unwrap();

        assert!(result.sufficient);
        assert!((result.available_gb - 10.0).abs() < 0.01);
        assert!((result.required_gb - 3.0).abs() < 0.01);
    }

    #[test]
    fn test_insufficient_space() {
        let checker = Arc::new(MockDiskSpaceChecker {
            available_bytes: 2 * 1_073_741_824, // 2 GB
        });
        let use_case = CheckDiskSpaceUseCase::new(checker);
        let result = use_case
            .execute(Path::new("/"), 5 * 1_073_741_824) // 5 GB required
            .unwrap();

        assert!(!result.sufficient);
        assert!((result.available_gb - 2.0).abs() < 0.01);
        assert!((result.required_gb - 5.0).abs() < 0.01);
    }

    #[test]
    fn test_exact_space() {
        let checker = Arc::new(MockDiskSpaceChecker {
            available_bytes: 5 * 1_073_741_824, // 5 GB
        });
        let use_case = CheckDiskSpaceUseCase::new(checker);
        let result = use_case
            .execute(Path::new("/"), 5 * 1_073_741_824) // 5 GB required
            .unwrap();

        assert!(result.sufficient);
    }

    #[test]
    fn test_checker_error_propagated() {
        let checker = Arc::new(FailingDiskSpaceChecker);
        let use_case = CheckDiskSpaceUseCase::new(checker);
        let result = use_case.execute(Path::new("/"), 1_073_741_824);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Disk check failed"));
    }
}
