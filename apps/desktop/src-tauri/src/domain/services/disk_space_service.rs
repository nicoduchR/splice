use std::path::Path;

use crate::domain::errors::DomainError;

/// Trait for checking available disk space on a volume.
/// Lives in Domain layer; implemented in Infrastructure layer.
pub trait DiskSpaceChecker: Send + Sync {
    /// Returns available disk space in bytes for the volume containing `path`.
    fn get_available_space(&self, path: &Path) -> Result<u64, DomainError>;
}
