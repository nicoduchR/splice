use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// ProjectState - persisted state for crash recovery and auto-save
///
/// Singleton row (id=1) tracking the current project's runtime state
/// including timeline position, volume, and clean shutdown flag.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct ProjectState {
    pub id: i64,
    #[ts(rename = "projectId")]
    pub project_id: Option<String>,
    #[ts(rename = "timelinePosition")]
    pub timeline_position: f64,
    pub volume: f64,
    #[ts(rename = "lastSavedAt")]
    pub last_saved_at: Option<i64>,
    #[ts(rename = "wasCleanShutdown")]
    pub was_clean_shutdown: bool,
}
