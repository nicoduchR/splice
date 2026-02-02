use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// SegmentValidation - result of validating a video segment
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct SegmentValidation {
    pub path: String,
    pub duration: f64,
    pub codec: String,
    pub width: u32,
    pub height: u32,
    #[ts(rename = "frameRate")]
    pub frame_rate: String,
    #[ts(rename = "isValid")]
    pub is_valid: bool,
    #[ts(rename = "errorMessage")]
    pub error_message: Option<String>,
}
