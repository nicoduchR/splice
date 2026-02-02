pub mod mock_video_repository;
pub mod sqlite_video_repository;
pub mod sqlite_transcript_repository;
pub mod sqlite_selection_repository;
pub mod model_manager;
pub mod fluidaudio_transcription_service;
pub mod audio_extractor;
pub mod proxy_generator;

// Used in tests
#[allow(unused_imports)]
pub use mock_video_repository::MockVideoRepository;
pub use sqlite_video_repository::SqliteVideoRepository;
pub use sqlite_transcript_repository::SqliteTranscriptRepository;
pub use sqlite_selection_repository::SqliteSelectionRepository;
// Used by tauri_commands
#[allow(unused_imports)]
pub use model_manager::HuggingFaceModelManager;
pub use fluidaudio_transcription_service::FluidAudioTranscriptionService;
pub use audio_extractor::{AudioExtractor, ffmpeg_path};
