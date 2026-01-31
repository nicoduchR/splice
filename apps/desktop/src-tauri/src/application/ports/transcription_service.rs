use async_trait::async_trait;
use crate::domain::entities::transcription::TranscriptionResult;

/// TranscriptionService port - abstract interface for transcription operations
/// Implements dependency inversion principle for Clean Architecture
#[async_trait]
pub trait TranscriptionService: Send + Sync {
    /// Transcribe audio samples to text with word-level timestamps
    ///
    /// # Arguments
    /// * `audio_samples` - Normalized audio samples in f32 [-1.0, 1.0]
    /// * `sample_rate` - Sample rate in Hz (typically 16000)
    /// * `channels` - Number of audio channels (typically 1 for mono)
    /// * `video_id` - Associated video identifier
    ///
    /// # Returns
    /// * `Ok(TranscriptionResult)` - Successful transcription with words and timestamps
    /// * `Err` - Transcription error (model loading, inference, etc.)
    async fn transcribe_audio(
        &self,
        audio_samples: Vec<f32>,
        sample_rate: u32,
        channels: u32,
        video_id: String,
    ) -> Result<TranscriptionResult, Box<dyn std::error::Error + Send + Sync>>;
}
