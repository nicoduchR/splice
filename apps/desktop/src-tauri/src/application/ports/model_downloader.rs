use crate::domain::entities::model_metadata::ModelMetadata;
use std::path::Path;

/// Port for downloading and managing ML models
#[async_trait::async_trait]
pub trait ModelDownloader: Send + Sync {
    /// Check if a model exists at the specified path
    async fn check_model_exists(&self, model_name: &str) -> Result<bool, Box<dyn std::error::Error + Send + Sync>>;

    /// Download a model from HuggingFace
    async fn download_model(
        &self,
        model_name: &str,
        on_progress: impl Fn(u64, u64, f64) + Send + Sync,
    ) -> Result<ModelMetadata, Box<dyn std::error::Error + Send + Sync>>;

    /// Verify file checksum (SHA-256)
    async fn verify_checksum(
        &self,
        path: &Path,
        expected_hash: &str,
    ) -> Result<bool, Box<dyn std::error::Error + Send + Sync>>;

    /// Get the model directory path (platform-specific)
    fn get_model_dir(&self, model_name: &str) -> std::path::PathBuf;
}
