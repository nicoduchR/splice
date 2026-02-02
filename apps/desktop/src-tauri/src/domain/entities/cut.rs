use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Cut - represents a video segment derived from text selections
///
/// A cut maps a time range in the source video that should be included
/// in the final edited output. Cuts are generated from selections with
/// margin padding and overlap merging.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct Cut {
    pub id: String,
    #[ts(rename = "projectId")]
    pub project_id: String,
    #[ts(rename = "segmentIndex")]
    pub segment_index: i64,
    #[ts(rename = "startTime")]
    pub start_time: f64,
    #[ts(rename = "endTime")]
    pub end_time: f64,
    #[ts(rename = "createdAt")]
    pub created_at: i64,
}
