use async_trait::async_trait;
use once_cell::sync::OnceCell;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use parakeet_rs::{ParakeetTDT, Transcriber, TimestampMode};
use crate::application::ports::transcription_service::TranscriptionService;
use crate::domain::entities::transcription::{TranscriptionResult, Word};

/// Singleton instance of the Parakeet model
static MODEL: OnceCell<Arc<Mutex<ParakeetTDT>>> = OnceCell::new();

/// ParakeetTranscriptionService - implements transcription using Parakeet TDT 0.6B v3 model
pub struct ParakeetTranscriptionService;

impl ParakeetTranscriptionService {
    /// Get or initialize the Parakeet model (lazy loading, thread-safe singleton)
    /// Model is loaded once and reused for all transcriptions (2 GB RAM)
    fn get_model() -> Result<Arc<Mutex<ParakeetTDT>>, Box<dyn std::error::Error + Send + Sync>> {
        MODEL
            .get_or_try_init(|| {
                tracing::info!("Loading Parakeet TDT 0.6B v3 model (first time, ~2 GB RAM)...");

                // Model path: ~/.splice/models/parakeet-tdt-0.6b-v3/
                let model_dir = dirs::home_dir()
                    .ok_or("Impossible de trouver le répertoire home")?
                    .join(".splice")
                    .join("models")
                    .join("parakeet-tdt-0.6b-v3");

                if !model_dir.exists() {
                    return Err(format!(
                        "Modèle Parakeet introuvable à: {}. Veuillez télécharger le modèle d'abord.",
                        model_dir.display()
                    )
                    .into());
                }

                // Load model in CPU-only mode
                let model = ParakeetTDT::from_pretrained(
                    model_dir.to_str().unwrap(),
                    None, // CPU-only (no GPU required)
                )?;

                tracing::info!("✅ Parakeet model loaded successfully");

                Ok(Arc::new(Mutex::new(model)))
            })
            .map(|m| m.clone())
    }
}

#[async_trait]
impl TranscriptionService for ParakeetTranscriptionService {
    async fn transcribe_audio(
        &self,
        audio_samples: Vec<f32>,
        sample_rate: u32,
        channels: u32,
        video_id: String,
    ) -> Result<TranscriptionResult, Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!(
            event = "transcription_started",
            video_id = %video_id,
            sample_count = audio_samples.len(),
            sample_rate = sample_rate,
            channels = channels,
        );

        // Get the model (lazy load on first call)
        let model = Self::get_model()?;

        // Start performance timer for RTF calculation
        let start_time = Instant::now();

        // Transcription is CPU-bound, so we use spawn_blocking to avoid blocking Tokio's event loop
        let result = tokio::task::spawn_blocking(move || {
            let mut model_lock = model.lock().map_err(|e| {
                format!("Impossible d'acquérir le verrou du modèle: {}", e)
            })?;

            // Transcribe with word-level timestamps
            let transcription = model_lock
                .transcribe_samples(
                    audio_samples,
                    sample_rate,
                    channels as u16, // Convert u32 to u16
                    Some(TimestampMode::Words), // Enable word-level timestamps
                )
                .map_err(|e| format!("La transcription a échoué: {}", e))?;

            Ok::<_, Box<dyn std::error::Error + Send + Sync>>(transcription)
        })
        .await
        .map_err(|e| format!("La tâche de transcription a paniqué: {}", e))??;

        // Convert Parakeet result to domain entity
        // Note: Parakeet TDT v3 does not provide per-word confidence scores in TimedToken
        // Using 1.0 as default confidence since Parakeet is a high-quality model
        let words: Vec<Word> = result
            .tokens
            .into_iter()
            .map(|token| Word {
                text: token.text,
                start: token.start as f64, // Convert f32 to f64
                end: token.end as f64,     // Convert f32 to f64
                confidence: 1.0, // Parakeet TDT v3 doesn't expose per-word confidence
            })
            .collect();

        let duration_seconds = words
            .last()
            .map(|w| w.end)
            .unwrap_or(0.0);

        let transcription_result = TranscriptionResult {
            video_id,
            text: result.text,
            words,
            duration_seconds,
            language: None, // Parakeet TDT v3 is multilingual but doesn't return language detection
        };

        // Calculate performance metrics
        let elapsed_time = start_time.elapsed();
        let elapsed_seconds = elapsed_time.as_secs_f64();
        let rtf = if elapsed_seconds > 0.0 {
            transcription_result.duration_seconds / elapsed_seconds
        } else {
            0.0
        };

        tracing::info!(
            event = "transcription_completed",
            video_id = %transcription_result.video_id,
            word_count = transcription_result.words.len(),
            audio_duration_seconds = transcription_result.duration_seconds,
            transcription_time_seconds = elapsed_seconds,
            rtf = rtf,
            performance_status = if rtf >= 720.0 { "✅ NFR1 OK (60min < 5s)" } else { "⚠️ NFR1 NOT MET" },
        );

        Ok(transcription_result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lazy_model_loading() {
        // Note: This test requires the model to be downloaded first
        // It will be skipped in CI if model is not present

        let model_dir = dirs::home_dir()
            .unwrap()
            .join(".splice")
            .join("models")
            .join("parakeet-tdt-0.6b-v3");

        if !model_dir.exists() {
            eprintln!("⚠️  Skipping test: Parakeet model not downloaded");
            return;
        }

        // Verify OnceCell is initially empty (if this is first test run)
        // Note: Can't truly verify initial state due to static lifetime

        // First call: loads the model
        let start_time = std::time::Instant::now();
        let model1 = ParakeetTranscriptionService::get_model();
        let first_load_duration = start_time.elapsed();
        assert!(model1.is_ok(), "First model load should succeed");
        println!("First model load took: {:?}", first_load_duration);

        // Second call: should reuse the model (much faster)
        let start_time = std::time::Instant::now();
        let model2 = ParakeetTranscriptionService::get_model();
        let second_load_duration = start_time.elapsed();
        assert!(model2.is_ok(), "Second model load should succeed");
        println!("Second model load took: {:?}", second_load_duration);

        // Verify it's the same model instance (same Arc pointer)
        assert!(
            Arc::ptr_eq(&model1.unwrap(), &model2.unwrap()),
            "Model should be reused (singleton pattern)"
        );

        // Second load should be significantly faster (cached)
        // Note: Only reliable if OnceCell was empty before test
        if first_load_duration.as_millis() > 100 {
            // Only check if first load was slow (actual loading)
            assert!(
                second_load_duration < first_load_duration / 10,
                "Second load should be at least 10x faster (cached): first={:?}, second={:?}",
                first_load_duration,
                second_load_duration
            );
        }

        // Verify model is functional
        let model = model1.ok().unwrap();
        let model_lock = model.lock();
        assert!(model_lock.is_ok(), "Should be able to lock the model");
    }
}
