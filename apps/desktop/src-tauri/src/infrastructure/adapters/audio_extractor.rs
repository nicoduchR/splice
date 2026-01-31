use std::path::Path;
use std::process::Command;
use hound::WavReader;

/// AudioExtractor - handles audio extraction from video files using FFmpeg
pub struct AudioExtractor;

impl AudioExtractor {
    /// Extract audio from video file to WAV format (16kHz mono PCM s16le)
    ///
    /// # Arguments
    /// * `video_path` - Path to source video file
    /// * `output_path` - Path for output WAV file
    ///
    /// # Returns
    /// * `Ok(())` - Extraction successful
    /// * `Err` - FFmpeg error
    pub async fn extract_audio(
        video_path: &Path,
        output_path: &Path,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // Security: Validate paths exist and are files (not directories)
        if !video_path.exists() {
            return Err(format!("Le fichier vidéo n'existe pas: {}", video_path.display()).into());
        }

        if !video_path.is_file() {
            return Err(format!("Le chemin vidéo n'est pas un fichier: {}", video_path.display()).into());
        }

        // Security: Validate video file extension
        let valid_extensions = ["mp4", "mov", "avi", "mkv", "webm", "flv"];
        let extension = video_path.extension()
            .and_then(|ext| ext.to_str())
            .map(|s| s.to_lowercase());

        if !extension.as_ref().map(|e| valid_extensions.contains(&e.as_str())).unwrap_or(false) {
            return Err(format!(
                "Extension de fichier vidéo non supportée. Extensions valides: {}",
                valid_extensions.join(", ")
            ).into());
        }

        tracing::info!(
            event = "audio_extraction_started",
            video_path = %video_path.display(),
            output_path = %output_path.display(),
        );

        // Use tokio::task::spawn_blocking for FFmpeg (I/O and CPU intensive)
        let video_path_str = video_path.to_string_lossy().to_string();
        let output_path_str = output_path.to_string_lossy().to_string();

        tokio::task::spawn_blocking(move || {
            let output = Command::new("ffmpeg")
                .args([
                    "-i",
                    &video_path_str,
                    "-vn", // No video
                    "-acodec",
                    "pcm_s16le", // PCM signed 16-bit little-endian
                    "-ac",
                    "1", // Mono (1 channel)
                    "-ar",
                    "16000", // 16 kHz sample rate
                    "-y", // Overwrite output file
                    &output_path_str,
                ])
                .output()?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("FFmpeg extraction failed: {}", stderr).into());
            }

            tracing::info!(
                event = "audio_extraction_completed",
                output_path = %output_path_str,
            );

            Ok::<_, Box<dyn std::error::Error + Send + Sync>>(())
        })
        .await
        .map_err(|e| format!("Audio extraction task failed: {}", e))??;

        Ok(())
    }

    /// Load WAV file and convert to normalized f32 samples [-1.0, 1.0]
    ///
    /// **Memory Limitation:** This function loads the entire audio file into memory.
    /// For a 2-hour video at 16kHz mono: ~230 MB RAM
    /// Combined with Parakeet model (~2 GB), total memory usage: ~2.3 GB
    ///
    /// **Supported:** Videos up to 2 hours (FR13)
    /// **Warning:** Videos >2 hours may cause OOM on systems with <4 GB RAM
    ///
    /// # Arguments
    /// * `wav_path` - Path to WAV file (16kHz mono PCM s16le)
    ///
    /// # Returns
    /// * `Ok((samples, sample_rate, channels))` - Normalized audio data
    /// * `Err` - WAV reading error
    pub fn load_wav_as_f32(
        wav_path: &Path,
    ) -> Result<(Vec<f32>, u32, u32), Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!(
            event = "wav_loading_started",
            wav_path = %wav_path.display(),
        );

        let mut reader = WavReader::open(wav_path)?;
        let spec = reader.spec();

        // Verify format expectations
        if spec.bits_per_sample != 16 {
            return Err(format!(
                "Expected 16-bit PCM, got {} bits",
                spec.bits_per_sample
            )
            .into());
        }

        if spec.sample_format != hound::SampleFormat::Int {
            return Err("Expected integer PCM format".into());
        }

        // Read and normalize i16 samples to f32 [-1.0, 1.0]
        let samples: Result<Vec<f32>, _> = reader
            .samples::<i16>()
            .map(|s| {
                s.map(|sample| {
                    // Normalize i16 [-32768, 32767] to f32 [-1.0, 1.0]
                    sample as f32 / 32768.0
                })
            })
            .collect();

        let samples = samples.map_err(|e| {
            format!("Erreur lors de la lecture des échantillons audio: {}", e)
        })?;

        tracing::info!(
            event = "wav_loading_completed",
            sample_count = samples.len(),
            sample_rate = spec.sample_rate,
            channels = spec.channels,
        );

        Ok((samples, spec.sample_rate, spec.channels as u32))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_extract_audio_from_video() {
        // This test requires a test video fixture
        let test_video = PathBuf::from("tests/fixtures/test_video_5s.mp4");

        if !test_video.exists() {
            eprintln!("⚠️  Skipping test: test video fixture not found");
            return;
        }

        let output_wav = PathBuf::from("/tmp/test_audio_extract.wav");

        let result = AudioExtractor::extract_audio(&test_video, &output_wav).await;
        assert!(result.is_ok(), "Audio extraction should succeed");

        // Verify output file exists
        assert!(
            output_wav.exists(),
            "Output WAV file should exist after extraction"
        );

        // Cleanup
        std::fs::remove_file(&output_wav).ok();
    }

    #[test]
    fn test_load_wav_normalized() {
        // This test requires a test WAV fixture
        let wav_path = PathBuf::from("tests/fixtures/test_audio_16khz_mono.wav");

        if !wav_path.exists() {
            eprintln!("⚠️  Skipping test: test WAV fixture not found");
            return;
        }

        let result = AudioExtractor::load_wav_as_f32(&wav_path);
        assert!(result.is_ok(), "WAV loading should succeed");

        let (samples, sample_rate, channels) = result.unwrap();

        // Verify format
        assert_eq!(sample_rate, 16000, "Sample rate should be 16kHz");
        assert_eq!(channels, 1, "Should be mono (1 channel)");

        // Verify normalization: all samples should be in [-1.0, 1.0]
        for (i, sample) in samples.iter().enumerate() {
            assert!(
                *sample >= -1.0 && *sample <= 1.0,
                "Sample {} out of range: {}",
                i,
                sample
            );
        }
    }
}
