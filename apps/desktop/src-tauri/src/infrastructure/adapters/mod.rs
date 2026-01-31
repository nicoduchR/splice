pub mod mock_video_repository;
pub mod sqlite_video_repository;
pub mod sqlite_transcript_repository;
pub mod model_manager;
pub mod parakeet_transcription_service;
pub mod audio_extractor;

// Used in tests
#[allow(unused_imports)]
pub use mock_video_repository::MockVideoRepository;
pub use sqlite_video_repository::SqliteVideoRepository;
pub use sqlite_transcript_repository::SqliteTranscriptRepository;
// Used by tauri_commands
#[allow(unused_imports)]
pub use model_manager::HuggingFaceModelManager;
pub use parakeet_transcription_service::ParakeetTranscriptionService;
pub use audio_extractor::AudioExtractor;
