pub mod mock_video_repository;
pub mod sqlite_video_repository;
pub mod sqlite_transcript_repository;
pub mod sqlite_selection_repository;
pub mod model_manager;
pub mod fluidaudio_transcription_service;
pub mod audio_extractor;
pub mod proxy_generator;
pub mod sqlite_cut_repository;
pub mod video_segmenter;
pub mod segment_validator;
pub mod video_concatenator;
pub mod video_exporter;
pub mod macos_credential_store;
pub mod windows_credential_store;
pub mod sqlite_license_repository;
pub mod http_license_api_client;
pub mod sqlite_project_state_repository;

// Used in tests
#[allow(unused_imports)]
pub use mock_video_repository::MockVideoRepository;
pub use sqlite_video_repository::SqliteVideoRepository;
pub use sqlite_transcript_repository::SqliteTranscriptRepository;
pub use sqlite_selection_repository::SqliteSelectionRepository;
pub use sqlite_cut_repository::SqliteCutRepository;
// Used by tauri_commands
#[allow(unused_imports)]
pub use model_manager::HuggingFaceModelManager;
pub use fluidaudio_transcription_service::FluidAudioTranscriptionService;
pub use audio_extractor::{AudioExtractor, ffmpeg_path};
pub use macos_credential_store::MacOSCredentialStore;
pub use windows_credential_store::WindowsCredentialStore;
pub use sqlite_license_repository::SqliteLicenseRepository;
pub use http_license_api_client::HttpLicenseApiClient;
pub use sqlite_project_state_repository::SqliteProjectStateRepository;
