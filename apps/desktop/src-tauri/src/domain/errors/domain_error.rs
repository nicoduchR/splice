use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub enum DomainError {
    #[serde(rename = "VIDEO_NOT_FOUND")]
    VideoNotFound(String),

    #[serde(rename = "VIDEO_FILE_NOT_FOUND")]
    FileNotFound(String),

    #[serde(rename = "VIDEO_UNSUPPORTED_FORMAT")]
    UnsupportedFormat(String),

    #[serde(rename = "VIDEO_TOO_LARGE")]
    VideoTooLarge { size_gb: f64, max_gb: f64 },

    #[serde(rename = "VIDEO_CORRUPTED")]
    VideoCorrupted { details: String },

    #[serde(rename = "VIDEO_UNSUPPORTED_CODEC")]
    UnsupportedVideoCodec {
        codec: String,
        supported: Vec<String>,
    },

    #[serde(rename = "FFMPEG_NOT_AVAILABLE")]
    FfmpegNotAvailable { message: String },

    #[serde(rename = "INVALID_FILE_NAME")]
    InvalidFileName,

    #[serde(rename = "INVALID_FILE_PATH")]
    InvalidFilePath(String),

    #[serde(rename = "INVALID_DURATION")]
    InvalidDuration(f64),

    #[serde(rename = "REPOSITORY_ERROR")]
    RepositoryError(String),

    #[serde(rename = "DATABASE_ERROR")]
    DatabaseError(String),
}

impl std::fmt::Display for DomainError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DomainError::VideoNotFound(id) => write!(f, "VideoNotFound(\"{}\")", id),
            DomainError::FileNotFound(path) => write!(f, "FileNotFound(\"{}\")", path),
            DomainError::UnsupportedFormat(ext) => write!(f, "UnsupportedFormat(\"{}\")", ext),
            DomainError::VideoTooLarge { size_gb, max_gb } => {
                write!(f, "VideoTooLarge(size: {:.2}GB, max: {}GB)", size_gb, max_gb)
            }
            DomainError::VideoCorrupted { details } => {
                write!(f, "VideoCorrupted(\"{}\")", details)
            }
            DomainError::UnsupportedVideoCodec { codec, supported } => {
                write!(
                    f,
                    "UnsupportedVideoCodec(codec: \"{}\", supported: {:?})",
                    codec, supported
                )
            }
            DomainError::FfmpegNotAvailable { message } => {
                write!(f, "FfmpegNotAvailable(\"{}\")", message)
            }
            DomainError::InvalidFileName => write!(f, "InvalidFileName"),
            DomainError::InvalidFilePath(path) => write!(f, "InvalidFilePath(\"{}\")", path),
            DomainError::InvalidDuration(dur) => write!(f, "InvalidDuration({})", dur),
            DomainError::RepositoryError(msg) => write!(f, "RepositoryError(\"{}\")", msg),
            DomainError::DatabaseError(msg) => write!(f, "DatabaseError(\"{}\")", msg),
        }
    }
}

impl std::error::Error for DomainError {}
