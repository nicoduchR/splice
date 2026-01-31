pub mod mock_video_repository;
pub mod sqlite_video_repository;
pub mod model_manager;

// Used in tests
#[allow(unused_imports)]
pub use mock_video_repository::MockVideoRepository;
pub use sqlite_video_repository::SqliteVideoRepository;
// Used by tauri_commands
#[allow(unused_imports)]
pub use model_manager::HuggingFaceModelManager;
