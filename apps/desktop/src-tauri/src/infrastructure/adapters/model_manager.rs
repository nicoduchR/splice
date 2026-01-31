use crate::application::ports::model_downloader::ModelDownloader;
use crate::domain::entities::model_metadata::{ModelMetadata, ModelStatus};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::io::Read;
use hf_hub::api::tokio::Api;
use std::time::Instant;
use chrono::Utc;
use backoff::{ExponentialBackoff, Error as BackoffError};
use backoff::future::retry;

/// Model names for Parakeet TDT 0.6B v3
#[allow(dead_code)] // Used in tests
const PARAKEET_MODEL_NAME: &str = "parakeet-tdt-0.6b-v3";
const PARAKEET_HF_REPO: &str = "istupakov/parakeet-tdt-0.6b-v3-onnx";

/// Required files for Parakeet model with real sizes from HuggingFace
const PARAKEET_FILES: &[(&str, u64)] = &[
    ("encoder-model.onnx", 42_000_000),         // ~42 MB
    ("encoder-model.onnx.data", 2_400_000_000), // ~2.4 GB (biggest file!)
    ("decoder_joint-model.onnx", 72_000_000),   // ~72 MB
    ("vocab.txt", 50_000),                      // ~50 KB
];

const TOTAL_MODEL_SIZE: u64 = 2_514_050_000; // ~2.5 GB total

/// SHA-256 checksums for model files (Parakeet TDT 0.6B v3 ONNX INT8)
/// Generated on 2026-01-31 from istupakov/parakeet-tdt-0.6b-v3-onnx
/// These checksums ensure file integrity after download
const MODEL_CHECKSUMS: &[(&str, &str)] = &[
    ("encoder-model.onnx", "98a74b21b4cc0017c1e7030319a4a96f4a9506e50f0708f3a516d02a77c96bb1"),
    ("encoder-model.onnx.data", "9a22d372c51455c34f13405da2520baefb7125bd16981397561423ed32d24f36"),
    ("decoder_joint-model.onnx", "e978ddf6688527182c10fde2eb4b83068421648985ef23f7a86be732be8706c1"),
    ("vocab.txt", "d58544679ea4bc6ac563d1f545eb7d474bd6cfa467f0a6e2c1dc1c7d37e3c35d"),
];

/// HuggingFace Model Manager implementation
pub struct HuggingFaceModelManager {
    base_dir: PathBuf,
    api: Api,
}

impl HuggingFaceModelManager {
    /// Create a new HuggingFace Model Manager
    pub fn new() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let base_dir = Self::get_default_model_base_dir()?;
        std::fs::create_dir_all(&base_dir)?;
        let api = Api::new()?;
        Ok(Self { base_dir, api })
    }

    /// Create a new HuggingFace Model Manager with custom base directory (for testing)
    #[cfg(test)]
    fn new_with_base_dir(base_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        std::fs::create_dir_all(&base_dir)?;
        let api = Api::new()?;
        Ok(Self { base_dir, api })
    }

    /// Download a single file with retry logic
    async fn download_file_with_retry(
        &self,
        file_name: &str,
        dest_dir: &Path,
    ) -> Result<u64, Box<dyn std::error::Error + Send + Sync>> {
        // Configure exponential backoff
        let backoff_config = ExponentialBackoff {
            initial_interval: std::time::Duration::from_secs(1),
            max_interval: std::time::Duration::from_secs(60),
            max_elapsed_time: Some(std::time::Duration::from_secs(300)), // 5 minutes max
            multiplier: 2.0,
            randomization_factor: 0.3,
            ..Default::default()
        };

        let repo = self.api.model(PARAKEET_HF_REPO.to_string());
        let dest_path = dest_dir.join(file_name);

        tracing::info!("Downloading {} with retry logic", file_name);

        let result = retry(backoff_config, || async {
            // Try downloading from HuggingFace API (uses cache)
            let cached_path_result = repo.get(file_name).await;

            let cached_path = match cached_path_result {
                Ok(path) => path,
                Err(e) => {
                    tracing::warn!("HF API failed for {}, trying direct download: {}", file_name, e);

                    // Fallback: download directly from HuggingFace URL
                    let direct_url = format!(
                        "https://huggingface.co/{}/resolve/main/{}",
                        PARAKEET_HF_REPO, file_name
                    );

                    // Download to temp file then return path
                    let temp_path = dest_dir.join(format!(".{}.tmp", file_name));

                    let response = reqwest::get(&direct_url).await.map_err(|e| {
                        BackoffError::transient(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
                    })?;

                    if !response.status().is_success() {
                        return Err(BackoffError::transient(
                            format!("HTTP {}: {}", response.status(), direct_url).into()
                        ));
                    }

                    let bytes = response.bytes().await.map_err(|e| {
                        BackoffError::transient(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
                    })?;

                    std::fs::write(&temp_path, &bytes).map_err(|e| {
                        BackoffError::permanent(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
                    })?;

                    temp_path
                }
            };

            // Get file size
            let metadata = std::fs::metadata(&cached_path).map_err(|e| {
                BackoffError::permanent(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
            })?;
            let file_size = metadata.len();

            // Copy file to destination
            std::fs::copy(&cached_path, &dest_path).map_err(|e| {
                tracing::warn!("Copy failed for {}: {}", file_name, e);
                BackoffError::transient(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
            })?;

            Ok::<u64, BackoffError<Box<dyn std::error::Error + Send + Sync>>>(file_size)
        }).await?;

        Ok(result)
    }

    /// Get the default base directory for models (platform-specific)
    /// - macOS: ~/.splice/models/
    /// - Windows: %APPDATA%/splice/models/
    fn get_default_model_base_dir() -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>> {
        #[cfg(target_os = "macos")]
        {
            let home = std::env::var("HOME")?;
            Ok(PathBuf::from(home).join(".splice").join("models"))
        }

        #[cfg(target_os = "windows")]
        {
            let appdata = std::env::var("APPDATA")?;
            Ok(PathBuf::from(appdata).join("splice").join("models"))
        }

        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        {
            Err("Unsupported platform".into())
        }
    }

    /// Check if all required model files exist
    async fn check_all_files_exist(&self, model_dir: &Path) -> bool {
        PARAKEET_FILES.iter().all(|(file, _)| model_dir.join(file).exists())
    }
}

#[async_trait::async_trait]
impl ModelDownloader for HuggingFaceModelManager {
    async fn check_model_exists(&self, model_name: &str) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
        let model_dir = self.get_model_dir(model_name);
        Ok(self.check_all_files_exist(&model_dir).await)
    }

    async fn download_model(
        &self,
        model_name: &str,
        on_progress: impl Fn(u64, u64, f64) + Send + Sync,
    ) -> Result<ModelMetadata, Box<dyn std::error::Error + Send + Sync>> {
        let model_dir = self.get_model_dir(model_name);
        std::fs::create_dir_all(&model_dir)?;

        let start_time = Instant::now();
        let mut total_downloaded: u64 = 0;
        let mut estimated_progress: u64 = 0;

        // Download each required file with retry logic
        for (file_name, estimated_size) in PARAKEET_FILES {
            tracing::info!("Starting download for: {}", file_name);

            match self.download_file_with_retry(file_name, &model_dir).await {
                Ok(file_size) => {
                    total_downloaded += file_size;
                    estimated_progress += estimated_size;

                    // Validate checksum if available (skip PLACEHOLDER_HASH)
                    let expected_hash = MODEL_CHECKSUMS
                        .iter()
                        .find(|(name, _)| *name == *file_name)
                        .map(|(_, hash)| *hash);

                    if let Some(hash) = expected_hash {
                        if hash != "PLACEHOLDER_HASH" {
                            tracing::info!("Validating checksum for {}", file_name);

                            let file_path = model_dir.join(file_name);
                            let is_valid = self.verify_checksum(&file_path, hash).await?;

                            if !is_valid {
                                tracing::error!("Checksum validation failed for {}", file_name);

                                // Delete corrupted file
                                std::fs::remove_file(&file_path)?;

                                return Err(format!(
                                    "Le fichier {} est corrompu (checksum invalide)",
                                    file_name
                                )
                                .into());
                            }

                            tracing::info!("Checksum validation passed for {}", file_name);
                        } else {
                            tracing::warn!(
                                "Skipping checksum validation for {} (placeholder hash)",
                                file_name
                            );
                        }
                    }

                    // Calculate speed in MB/s
                    let elapsed = start_time.elapsed().as_secs_f64();
                    let speed = if elapsed > 0.0 {
                        (total_downloaded as f64 / 1_000_000.0) / elapsed
                    } else {
                        0.0
                    };

                    // Report progress using estimated sizes for accurate percentage
                    on_progress(estimated_progress, TOTAL_MODEL_SIZE, speed);

                    tracing::info!(
                        "Successfully downloaded {} ({} bytes)",
                        file_name,
                        file_size
                    );
                }
                Err(e) => {
                    tracing::error!("Failed to download {} after 3 attempts: {}", file_name, e);
                    return Err(format!(
                        "Échec du téléchargement de {} après 3 tentatives: {}",
                        file_name, e
                    )
                    .into());
                }
            }
        }

        tracing::info!("✅ All files downloaded successfully! Total: {} bytes", total_downloaded);

        Ok(ModelMetadata {
            name: model_name.to_string(),
            version: "v3".to_string(),
            status: ModelStatus::Ready,
            download_url: format!("https://huggingface.co/{}", PARAKEET_HF_REPO),
            total_size_bytes: total_downloaded,
            downloaded_at: Some(Utc::now().timestamp()),
        })
    }

    async fn verify_checksum(
        &self,
        path: &Path,
        expected_hash: &str,
    ) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
        let mut file = std::fs::File::open(path)?;
        let mut hasher = Sha256::new();
        let mut buffer = [0u8; 8192];

        loop {
            let bytes_read = file.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }

        let result = hasher.finalize();
        let hash_string = hex::encode(result);

        Ok(hash_string.to_lowercase() == expected_hash.to_lowercase())
    }

    fn get_model_dir(&self, model_name: &str) -> PathBuf {
        self.base_dir.join(model_name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_check_model_exists_when_missing() {
        let temp_dir = TempDir::new().unwrap();
        let manager = HuggingFaceModelManager::new_with_base_dir(temp_dir.path().to_path_buf()).unwrap();

        let exists = manager.check_model_exists(PARAKEET_MODEL_NAME).await.unwrap();
        assert!(!exists, "Model should not exist in empty directory");
    }

    #[tokio::test]
    async fn test_check_model_exists_when_present() {
        let temp_dir = TempDir::new().unwrap();
        let manager = HuggingFaceModelManager::new_with_base_dir(temp_dir.path().to_path_buf()).unwrap();

        let model_dir = manager.get_model_dir(PARAKEET_MODEL_NAME);
        std::fs::create_dir_all(&model_dir).unwrap();

        // Create all required files
        for file in PARAKEET_FILES {
            std::fs::write(model_dir.join(file), b"test").unwrap();
        }

        let exists = manager.check_model_exists(PARAKEET_MODEL_NAME).await.unwrap();
        assert!(exists, "Model should exist when all files are present");
    }

    #[tokio::test]
    async fn test_check_model_exists_partial_files() {
        let temp_dir = TempDir::new().unwrap();
        let manager = HuggingFaceModelManager::new_with_base_dir(temp_dir.path().to_path_buf()).unwrap();

        let model_dir = manager.get_model_dir(PARAKEET_MODEL_NAME);
        std::fs::create_dir_all(&model_dir).unwrap();

        // Only create first file
        std::fs::write(model_dir.join(PARAKEET_FILES[0]), b"test").unwrap();

        let exists = manager.check_model_exists(PARAKEET_MODEL_NAME).await.unwrap();
        assert!(!exists, "Model should not exist when only partial files are present");
    }

    #[tokio::test]
    async fn test_verify_checksum_valid() {
        let temp_dir = TempDir::new().unwrap();
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let mut file = temp_file.reopen().unwrap();
        file.write_all(b"hello world").unwrap();

        let manager = HuggingFaceModelManager::new_with_base_dir(temp_dir.path().to_path_buf()).unwrap();

        // SHA-256 of "hello world"
        let expected_hash = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
        let result = manager.verify_checksum(temp_file.path(), expected_hash).await.unwrap();
        assert!(result, "Checksum should match");
    }

    #[tokio::test]
    async fn test_verify_checksum_invalid() {
        let temp_dir = TempDir::new().unwrap();
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let mut file = temp_file.reopen().unwrap();
        file.write_all(b"hello world").unwrap();

        let manager = HuggingFaceModelManager::new_with_base_dir(temp_dir.path().to_path_buf()).unwrap();

        let wrong_hash = "0000000000000000000000000000000000000000000000000000000000000000";
        let result = manager.verify_checksum(temp_file.path(), wrong_hash).await.unwrap();
        assert!(!result, "Checksum should not match");
    }

    #[test]
    fn test_get_model_dir() {
        let temp_dir = TempDir::new().unwrap();
        let manager = HuggingFaceModelManager::new_with_base_dir(temp_dir.path().to_path_buf()).unwrap();

        let model_dir = manager.get_model_dir(PARAKEET_MODEL_NAME);
        assert_eq!(
            model_dir,
            temp_dir.path().join(PARAKEET_MODEL_NAME),
            "Model directory should be base_dir/model_name"
        );
    }
}
