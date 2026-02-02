use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Selection - represents a persisted text selection range in SQLite database
///
/// A selection maps a range of transcript words that the user has highlighted
/// for inclusion in their final video cut.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct Selection {
    pub id: String,
    #[ts(rename = "projectId")]
    pub project_id: String,
    #[ts(rename = "startWordIndex")]
    pub start_word_index: i64,
    #[ts(rename = "endWordIndex")]
    pub end_word_index: i64,
    #[ts(rename = "startTime")]
    pub start_time: f64,
    #[ts(rename = "endTime")]
    pub end_time: f64,
    #[ts(rename = "createdAt")]
    pub created_at: i64,
}
