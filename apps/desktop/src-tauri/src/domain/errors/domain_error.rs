use thiserror::Error;

#[derive(Error, Debug)]
pub enum DomainError {
    #[error("Video project not found: {0}")]
    VideoNotFound(String),

    #[error("Invalid file path: {0}")]
    InvalidFilePath(String),

    #[error("Invalid duration: {0}")]
    InvalidDuration(f64),

    #[error("Repository error: {0}")]
    RepositoryError(String),
}
