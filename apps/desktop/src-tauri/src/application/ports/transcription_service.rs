use async_trait::async_trait;
use std::path::Path;
use crate::domain::entities::transcription::TranscriptionResult;

/// TranscriptionService port - abstract interface for transcription operations
/// Implements dependency inversion principle for Clean Architecture
#[async_trait]
pub trait TranscriptionService: Send + Sync {
    /// Transcribe a WAV audio file to text with word-level timestamps
    ///
    /// # Arguments
    /// * `audio_path` - Path to WAV file (16kHz mono PCM s16le)
    /// * `video_id` - Associated video identifier
    ///
    /// # Returns
    /// * `Ok(TranscriptionResult)` - Successful transcription with words and timestamps
    /// * `Err` - Transcription error
    async fn transcribe_file(
        &self,
        audio_path: &Path,
        video_id: String,
    ) -> Result<TranscriptionResult, Box<dyn std::error::Error + Send + Sync>>;
}
