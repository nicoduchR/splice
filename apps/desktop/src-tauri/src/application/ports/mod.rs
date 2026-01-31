// Ports for external dependencies
pub mod model_downloader;
pub mod transcription_service;

// Used by model_manager.rs
#[allow(unused_imports)]
pub use model_downloader::ModelDownloader;
pub use transcription_service::TranscriptionService;
