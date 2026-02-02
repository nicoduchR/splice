use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub struct VideoMetadata {
    pub codec_name: String,
    pub codec_type: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub duration: f64,
    pub file_size: u64,
}
