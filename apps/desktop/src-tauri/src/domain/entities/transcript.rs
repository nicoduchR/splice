use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// TranscriptWord - represents a single word with timing information
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct TranscriptWord {
    pub index: i32,
    pub text: String,
    #[ts(rename = "startTime")]
    pub start_time: f64,
    #[ts(rename = "endTime")]
    pub end_time: f64,
    pub confidence: f64,
}

/// Transcript - represents a full video transcription
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct Transcript {
    pub id: String,
    #[ts(rename = "projectId")]
    pub project_id: String,
    pub words: Vec<TranscriptWord>,
}
