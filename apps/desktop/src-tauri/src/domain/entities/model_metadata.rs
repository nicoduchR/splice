use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Metadata for an ML model (e.g., Parakeet transcription model)
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub struct ModelMetadata {
    /// Model name (e.g., "parakeet-tdt-0.6b-v3")
    pub name: String,
    /// Model version (e.g., "v3")
    pub version: String,
    /// Current status of the model
    pub status: ModelStatus,
    /// Download URL (HuggingFace repository)
    pub download_url: String,
    /// Total size in bytes (≈670 MB for INT8 quantized)
    pub total_size_bytes: u64,
    /// Unix timestamp when the model was downloaded (None if not downloaded)
    pub downloaded_at: Option<i64>,
}

/// Status of an ML model
#[derive(Debug, Clone, Serialize, Deserialize, TS, PartialEq, Eq)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
#[serde(rename_all = "lowercase")]
pub enum ModelStatus {
    /// Model is not present on disk
    Missing,
    /// Model download is in progress
    Downloading,
    /// Model is ready for use
    Ready,
    /// Model file is corrupted (checksum failed)
    Corrupted,
}

impl std::fmt::Display for ModelStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ModelStatus::Missing => write!(f, "missing"),
            ModelStatus::Downloading => write!(f, "downloading"),
            ModelStatus::Ready => write!(f, "ready"),
            ModelStatus::Corrupted => write!(f, "corrupted"),
        }
    }
}

impl std::str::FromStr for ModelStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "missing" => Ok(ModelStatus::Missing),
            "downloading" => Ok(ModelStatus::Downloading),
            "ready" => Ok(ModelStatus::Ready),
            "corrupted" => Ok(ModelStatus::Corrupted),
            _ => Err(format!("Invalid ModelStatus: {}", s)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_status_display() {
        assert_eq!(ModelStatus::Missing.to_string(), "missing");
        assert_eq!(ModelStatus::Downloading.to_string(), "downloading");
        assert_eq!(ModelStatus::Ready.to_string(), "ready");
        assert_eq!(ModelStatus::Corrupted.to_string(), "corrupted");
    }

    #[test]
    fn test_model_status_from_str() {
        assert_eq!("missing".parse::<ModelStatus>().unwrap(), ModelStatus::Missing);
        assert_eq!("downloading".parse::<ModelStatus>().unwrap(), ModelStatus::Downloading);
        assert_eq!("ready".parse::<ModelStatus>().unwrap(), ModelStatus::Ready);
        assert_eq!("corrupted".parse::<ModelStatus>().unwrap(), ModelStatus::Corrupted);
    }

    #[test]
    fn test_model_status_from_str_invalid() {
        assert!("invalid".parse::<ModelStatus>().is_err());
    }
}
