use async_trait::async_trait;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::Instant;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use crate::application::ports::transcription_service::TranscriptionService;
use crate::domain::entities::transcription::{TranscriptionResult, Word};

/// Sidecar JSON output matching the Swift CLI's TranscriptionOutput
#[derive(serde::Deserialize)]
struct SidecarOutput {
    text: String,
    words: Vec<SidecarWord>,
    duration_seconds: f64,
    language: String,
}

#[derive(serde::Deserialize)]
struct SidecarWord {
    text: String,
    start: f64,
    end: f64,
    confidence: f64,
}

/// FluidAudioTranscriptionService - transcription via FluidAudio CoreML sidecar
///
/// Spawns the `fluidaudio-sidecar` binary which uses Parakeet CoreML on the
/// Apple Neural Engine for ~110x real-time transcription speed.
pub struct FluidAudioTranscriptionService;

impl FluidAudioTranscriptionService {
    /// Resolve the path to the fluidaudio-sidecar binary.
    /// Production: next to the running executable.
    /// Dev: binaries/ directory relative to CARGO_MANIFEST_DIR.
    fn sidecar_path() -> PathBuf {
        // Try production path first (next to the running binary)
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()));

        if let Some(dir) = &exe_dir {
            let candidate = dir.join("fluidaudio-sidecar");
            if candidate.exists() {
                return candidate;
            }
        }

        // Dev mode: resolve from CARGO_MANIFEST_DIR
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let arch_target = format!("fluidaudio-sidecar-{}-apple-darwin", std::env::consts::ARCH);
        let dev_path = PathBuf::from(manifest_dir)
            .join("binaries")
            .join(&arch_target);
        if dev_path.exists() {
            return dev_path;
        }

        // Fallback: hope it's on PATH
        PathBuf::from("fluidaudio-sidecar")
    }
}

#[async_trait]
impl TranscriptionService for FluidAudioTranscriptionService {
    async fn transcribe_file(
        &self,
        audio_path: &Path,
        video_id: String,
    ) -> Result<TranscriptionResult, Box<dyn std::error::Error + Send + Sync>> {
        let sidecar = Self::sidecar_path();

        tracing::info!(
            event = "fluidaudio_transcription_started",
            video_id = %video_id,
            audio_path = %audio_path.display(),
            sidecar = %sidecar.display(),
        );

        let start_time = Instant::now();

        let mut child = Command::new(&sidecar)
            .args(["transcribe", &audio_path.to_string_lossy(), "--output", "json"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!(
                "Impossible de lancer le sidecar FluidAudio ({}): {}",
                sidecar.display(), e
            ))?;

        // Read stderr for progress in background
        let stderr = child.stderr.take().expect("stderr captured");
        let video_id_clone = video_id.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                tracing::debug!(
                    event = "fluidaudio_progress",
                    video_id = %video_id_clone,
                    message = %line,
                );
            }
        });

        // Wait for process to complete and capture stdout
        let output = child.wait_with_output().await.map_err(|e| {
            format!("Erreur lors de l'exécution du sidecar FluidAudio: {}", e)
        })?;

        if !output.status.success() {
            let stderr_str = String::from_utf8_lossy(&output.stderr);
            return Err(format!(
                "Le sidecar FluidAudio a échoué (code {}): {}",
                output.status.code().unwrap_or(-1),
                stderr_str
            ).into());
        }

        // Parse JSON output
        let stdout_str = String::from_utf8(output.stdout).map_err(|e| {
            format!("Sortie du sidecar non-UTF8: {}", e)
        })?;

        let sidecar_output: SidecarOutput = serde_json::from_str(&stdout_str).map_err(|e| {
            format!("Erreur de parsing JSON du sidecar: {} — sortie: {}", e, &stdout_str[..stdout_str.len().min(500)])
        })?;

        // Convert to domain entities
        let raw_words: Vec<Word> = sidecar_output.words.into_iter().map(|w| Word {
            text: w.text,
            start: w.start,
            end: w.end,
            confidence: w.confidence,
        }).collect();

        let words = merge_subword_tokens(raw_words);

        let result = TranscriptionResult {
            video_id: video_id.clone(),
            text: sidecar_output.text,
            words,
            duration_seconds: sidecar_output.duration_seconds,
            language: Some(sidecar_output.language),
        };

        // Performance metrics
        let elapsed = start_time.elapsed().as_secs_f64();
        let rtf = if elapsed > 0.0 { result.duration_seconds / elapsed } else { 0.0 };

        tracing::info!(
            event = "fluidaudio_transcription_completed",
            video_id = %video_id,
            word_count = result.words.len(),
            audio_duration_seconds = result.duration_seconds,
            transcription_time_seconds = elapsed,
            rtf = rtf,
        );

        Ok(result)
    }
}

/// Merge SentencePiece subword tokens into proper words.
///
/// The Parakeet TDT model produces subword tokens where a word boundary is
/// marked by either `▁` (U+2581, SentencePiece) or a leading space ` `.
/// Tokens without these prefixes are continuations of the previous token
/// (e.g. ` invest`, `isse`, `urs` → `investisseurs`).
fn merge_subword_tokens(tokens: Vec<Word>) -> Vec<Word> {
    let mut merged: Vec<Word> = Vec::new();

    for token in tokens {
        let starts_new_word = token.text.starts_with('\u{2581}') || token.text.starts_with(' ');

        if starts_new_word || merged.is_empty() {
            let text = token.text.trim_start_matches('\u{2581}').trim_start().to_string();
            merged.push(Word {
                text,
                start: token.start,
                end: token.end,
                confidence: token.confidence,
            });
        } else {
            // Append to current word
            let current = merged.last_mut().unwrap();
            current.text.push_str(&token.text);
            current.end = token.end;
            if token.confidence < current.confidence {
                current.confidence = token.confidence;
            }
        }
    }

    // Trim whitespace from all words
    for word in &mut merged {
        word.text = word.text.trim().to_string();
    }

    // Remove empty words
    merged.retain(|w| !w.text.is_empty());

    merged
}

#[cfg(test)]
mod tests {
    use super::*;

    fn word(text: &str, start: f64, end: f64, confidence: f64) -> Word {
        Word { text: text.to_string(), start, end, confidence }
    }

    #[test]
    fn test_merge_subword_tokens_french() {
        let tokens = vec![
            word("\u{2581}invest", 0.0, 0.3, 0.95),
            word("isse", 0.3, 0.5, 0.90),
            word("urs", 0.5, 0.7, 0.92),
            word("\u{2581}sont", 0.8, 1.0, 0.98),
        ];
        let result = merge_subword_tokens(tokens);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].text, "investisseurs");
        assert_eq!(result[0].start, 0.0);
        assert_eq!(result[0].end, 0.7);
        assert_eq!(result[0].confidence, 0.90); // min
        assert_eq!(result[1].text, "sont");
    }

    #[test]
    fn test_merge_single_tokens() {
        let tokens = vec![
            word("\u{2581}hello", 0.0, 0.5, 0.99),
            word("\u{2581}world", 0.6, 1.0, 0.98),
        ];
        let result = merge_subword_tokens(tokens);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].text, "hello");
        assert_eq!(result[1].text, "world");
    }

    #[test]
    fn test_merge_empty() {
        assert_eq!(merge_subword_tokens(vec![]).len(), 0);
    }

    #[test]
    fn test_merge_no_prefix_first_token() {
        // First token without ▁ should still start a word
        let tokens = vec![
            word("bonjour", 0.0, 0.5, 0.95),
            word("\u{2581}monde", 0.6, 1.0, 0.98),
        ];
        let result = merge_subword_tokens(tokens);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].text, "bonjour");
        assert_eq!(result[1].text, "monde");
    }

    #[test]
    fn test_merge_space_prefix_tokens() {
        // FluidAudio returns tokens with leading space instead of ▁
        let tokens = vec![
            word(" Si", 52.40, 52.72, 0.95),
            word(" tu", 52.72, 52.96, 0.98),
            word(" pit", 52.96, 53.28, 0.90),
            word("ches", 53.28, 53.52, 0.92),
            word(" les", 53.52, 53.76, 0.97),
        ];
        let result = merge_subword_tokens(tokens);
        assert_eq!(result.len(), 4);
        assert_eq!(result[0].text, "Si");
        assert_eq!(result[1].text, "tu");
        assert_eq!(result[2].text, "pitches");
        assert_eq!(result[2].start, 52.96);
        assert_eq!(result[2].end, 53.52);
        assert_eq!(result[2].confidence, 0.90); // min of 0.90 and 0.92
        assert_eq!(result[3].text, "les");
    }
}
