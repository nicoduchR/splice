use sqlx::SqlitePool;
use std::sync::{Arc, Mutex};
use std::sync::atomic::AtomicBool;
use std::collections::HashMap;
use crate::domain::repositories::{VideoRepository, TranscriptRepository, SelectionRepository, CutRepository};
use crate::domain::entities::{UpdateInfo, UpdateStatus, DownloadProgress};
use crate::infrastructure::adapters::{SqliteVideoRepository, SqliteTranscriptRepository, SqliteSelectionRepository, SqliteCutRepository};

/// State for tracking update operations
#[derive(Debug, Clone, Default)]
pub struct UpdateState {
    pub status: UpdateStatus,
    pub update_info: Option<UpdateInfo>,
    pub download_progress: Option<DownloadProgress>,
    pub error: Option<String>,
    pub last_check: Option<i64>,
}

/// Application state managed by Tauri
pub struct AppState {
    pub db_pool: SqlitePool,
    pub video_repository: Arc<dyn VideoRepository>,
    pub transcript_repository: Arc<dyn TranscriptRepository>,
    pub selection_repository: Arc<dyn SelectionRepository>,
    pub cut_repository: Arc<dyn CutRepository>,
    /// Cancellation flags for ongoing transcriptions (video_id -> cancel_flag)
    pub transcription_cancel_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    /// Cancellation flags for ongoing segmentations (project_id -> cancel_flag)
    pub segmentation_cancel_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    /// Cancellation flags for ongoing exports (project_id -> cancel_flag)
    pub export_cancel_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    /// Current update state
    pub update_state: Mutex<UpdateState>,
    /// Cancellation flag for ongoing update download
    pub update_cancel_flag: Mutex<Option<Arc<AtomicBool>>>,
}

impl AppState {
    pub fn new(db_pool: SqlitePool) -> Self {
        let video_repository: Arc<dyn VideoRepository> =
            Arc::new(SqliteVideoRepository::new(db_pool.clone()));

        let transcript_repository: Arc<dyn TranscriptRepository> =
            Arc::new(SqliteTranscriptRepository::new(db_pool.clone()));

        let selection_repository: Arc<dyn SelectionRepository> =
            Arc::new(SqliteSelectionRepository::new(db_pool.clone()));

        let cut_repository: Arc<dyn CutRepository> =
            Arc::new(SqliteCutRepository::new(db_pool.clone()));

        Self {
            db_pool,
            video_repository,
            transcript_repository,
            selection_repository,
            cut_repository,
            transcription_cancel_flags: Arc::new(Mutex::new(HashMap::new())),
            segmentation_cancel_flags: Arc::new(Mutex::new(HashMap::new())),
            export_cancel_flags: Arc::new(Mutex::new(HashMap::new())),
            update_state: Mutex::new(UpdateState::default()),
            update_cancel_flag: Mutex::new(None),
        }
    }

    /// Update the update state
    pub fn set_update_state(&self, state: UpdateState) {
        let mut update_state = self.update_state.lock().unwrap();
        *update_state = state;
    }

    /// Get the current update state
    pub fn get_update_state(&self) -> UpdateState {
        let update_state = self.update_state.lock().unwrap();
        update_state.clone()
    }

    /// Set a cancellation flag for a specific transcription
    pub fn set_cancel_flag(&self, video_id: String, flag: Arc<AtomicBool>) {
        let mut flags = self.transcription_cancel_flags.lock().unwrap();
        flags.insert(video_id, flag);
    }

    /// Get the cancellation flag for a specific transcription
    pub fn get_cancel_flag(&self, video_id: &str) -> Option<Arc<AtomicBool>> {
        let flags = self.transcription_cancel_flags.lock().unwrap();
        flags.get(video_id).cloned()
    }

    /// Remove the cancellation flag for a specific transcription
    pub fn remove_cancel_flag(&self, video_id: &str) {
        let mut flags = self.transcription_cancel_flags.lock().unwrap();
        flags.remove(video_id);
    }
}
