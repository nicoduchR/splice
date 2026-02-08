use async_trait::async_trait;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::{Duration, Instant};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use crate::application::ports::transcription_service::TranscriptionService;
use crate::domain::entities::transcription::{TranscriptionResult, Word};

/// Maximum number of retry attempts when sidecar fails during model loading
const MAX_SIDECAR_RETRIES: u32 = 3;

/// Backoff delays between retries: 1s, 2s, 4s, 8s
const RETRY_BACKOFF_SECS: &[u64] = &[1, 2, 4, 8];

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

/// Check if a sidecar error is related to model download/loading (retryable network error)
fn is_model_loading_error(stderr: &str) -> bool {
    let lower = stderr.to_lowercase();
    // Network-related failures during model download
    lower.contains("downloading") || lower.contains("loading_model")
        || lower.contains("network") || lower.contains("connection")
        || lower.contains("timed out") || lower.contains("timeout")
        || lower.contains("urlsession") || lower.contains("nsurlerror")
        || lower.contains("could not connect") || lower.contains("downloadandload")
        || lower.contains("ssl error") || lower.contains("internet")
}

/// Sanitize sidecar error for user display: remove stack traces and technical details
fn sanitize_sidecar_error(raw_error: &str) -> String {
    // Remove Swift stack traces and technical info
    let sanitized = raw_error
        .lines()
        .filter(|line| {
            let trimmed = line.trim().to_lowercase();
            !trimmed.starts_with("0x")
                && !trimmed.contains("thread ")
                && !trimmed.contains("frame #")
                && !trimmed.contains(".swift:")
                && !trimmed.contains("fatal error")
                && !trimmed.contains("stack trace")
        })
        .collect::<Vec<_>>()
        .join(" ");

    // Try to extract a JSON error message
    if let Some(start) = sanitized.find("\"error\"") {
        if let Some(msg_start) = sanitized[start..].find(':') {
            let after_colon = &sanitized[start + msg_start + 1..];
            // Strip surrounding whitespace, quotes, and braces
            let trimmed = after_colon.trim()
                .trim_end_matches('}')
                .trim()
                .trim_matches('"')
                .trim();
            if !trimmed.is_empty() {
                return trimmed.to_string();
            }
        }
    }

    // Fallback: return first meaningful line, capped
    let first_line = sanitized.lines().next().unwrap_or(&sanitized);
    if first_line.len() > 200 {
        first_line[..200].to_string()
    } else {
        first_line.to_string()
    }
}

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

    /// Run sidecar with retry logic for model loading failures.
    /// Retries up to MAX_SIDECAR_RETRIES times with exponential backoff (1s, 2s, 4s, 8s)
    /// when the failure is related to model download/loading (network errors).
    async fn run_sidecar_with_retry(
        &self,
        audio_path: &Path,
        video_id: &str,
    ) -> Result<(Vec<u8>, Vec<u8>), Box<dyn std::error::Error + Send + Sync>> {
        let sidecar = Self::sidecar_path();
        let mut last_error = String::new();

        for attempt in 0..=MAX_SIDECAR_RETRIES {
            if attempt > 0 {
                let delay_secs = RETRY_BACKOFF_SECS
                    .get((attempt - 1) as usize)
                    .copied()
                    .unwrap_or(8);
                tracing::info!(
                    event = "sidecar_retry",
                    video_id = %video_id,
                    attempt = attempt,
                    delay_secs = delay_secs,
                    "Retrying sidecar after model loading failure (attempt {}/{})",
                    attempt + 1,
                    MAX_SIDECAR_RETRIES + 1,
                );
                tokio::time::sleep(Duration::from_secs(delay_secs)).await;
            }

            let mut child = match Command::new(&sidecar)
                .args(["transcribe", &audio_path.to_string_lossy(), "--output", "json"])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
            {
                Ok(child) => child,
                Err(e) => {
                    return Err(format!(
                        "Impossible de lancer le sidecar FluidAudio ({}): {}",
                        sidecar.display(), e
                    ).into());
                }
            };

            // Read stderr for progress in background
            let stderr_handle = child.stderr.take().expect("stderr captured");
            let video_id_clone = video_id.to_string();
            let stderr_task = tokio::spawn(async move {
                let reader = BufReader::new(stderr_handle);
                let mut lines = reader.lines();
                let mut collected = Vec::new();
                while let Ok(Some(line)) = lines.next_line().await {
                    tracing::debug!(
                        event = "fluidaudio_progress",
                        video_id = %video_id_clone,
                        message = %line,
                    );
                    collected.push(line);
                }
                collected.join("\n")
            });

            // Wait for process to complete
            let output = child.wait_with_output().await.map_err(|e| {
                format!("Erreur lors de l'exécution du sidecar FluidAudio: {}", e)
            })?;

            let stderr_collected = stderr_task.await.unwrap_or_default();

            if output.status.success() {
                return Ok((output.stdout, output.stderr));
            }

            // Process failed - check if it's a retryable model loading error
            let stderr_str = String::from_utf8_lossy(&output.stderr);
            let combined_stderr = format!("{} {}", stderr_str, stderr_collected);

            if is_model_loading_error(&combined_stderr) && attempt < MAX_SIDECAR_RETRIES {
                tracing::warn!(
                    event = "sidecar_model_loading_failed",
                    video_id = %video_id,
                    attempt = attempt + 1,
                    stderr = %combined_stderr,
                    "Model loading failed, will retry"
                );
                last_error = combined_stderr;
                continue;
            }

            // Non-retryable error or retries exhausted
            last_error = combined_stderr;
            break;
        }

        Err(format!(
            "Le sidecar FluidAudio a échoué après {} tentatives: {}",
            MAX_SIDECAR_RETRIES,
            sanitize_sidecar_error(&last_error)
        ).into())
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

        // Run sidecar with automatic retry for model loading failures
        let (stdout_bytes, _stderr_bytes) = self.run_sidecar_with_retry(audio_path, &video_id).await?;

        // Parse JSON output
        let stdout_str = String::from_utf8(stdout_bytes).map_err(|e| {
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

    // --- Tests for is_model_loading_error ---

    #[test]
    fn test_is_model_loading_error_network_keywords() {
        assert!(is_model_loading_error("network error occurred"));
        assert!(is_model_loading_error("Connection timed out"));
        assert!(is_model_loading_error("NSURLError domain"));
        assert!(is_model_loading_error("could not connect to host"));
        assert!(is_model_loading_error("URLSession task failed"));
        assert!(is_model_loading_error("downloading model failed"));
        assert!(is_model_loading_error("downloadAndLoad threw error"));
        assert!(is_model_loading_error("SSL error during download"));
        assert!(is_model_loading_error("loading_model stage failed"));
        assert!(is_model_loading_error("No internet connection"));
        assert!(is_model_loading_error("Timeout waiting for response"));
    }

    #[test]
    fn test_is_model_loading_error_false_for_other_errors() {
        assert!(!is_model_loading_error("Audio file not found"));
        assert!(!is_model_loading_error("Transcription failed: invalid format"));
        assert!(!is_model_loading_error("macOS 14.0+ required"));
        assert!(!is_model_loading_error(""));
    }

    // --- Tests for sanitize_sidecar_error ---

    #[test]
    fn test_sanitize_sidecar_error_extracts_json_message() {
        let raw = r#"{"error": "Transcription failed: network timeout"}"#;
        let result = sanitize_sidecar_error(raw);
        assert_eq!(result, "Transcription failed: network timeout");
    }

    #[test]
    fn test_sanitize_sidecar_error_removes_stack_traces() {
        let raw = "Error occurred\n0x7fff12345 in module\nThread 1: signal SIGABRT\nframe #0 main.swift:42\nfatal error: crash";
        let result = sanitize_sidecar_error(raw);
        assert!(!result.contains("0x7fff"));
        assert!(!result.contains("Thread 1"));
        assert!(!result.contains("frame #"));
        assert!(!result.contains("fatal error"));
    }

    #[test]
    fn test_sanitize_sidecar_error_truncates_long_messages() {
        let long_msg = "a".repeat(300);
        let result = sanitize_sidecar_error(&long_msg);
        assert!(result.len() <= 200);
    }

    #[test]
    fn test_sanitize_sidecar_error_plain_message() {
        let raw = "Model download failed due to network issue";
        let result = sanitize_sidecar_error(raw);
        assert_eq!(result, "Model download failed due to network issue");
    }

    // --- Tests for retry constants ---

    #[test]
    fn test_retry_backoff_values() {
        assert_eq!(RETRY_BACKOFF_SECS, &[1, 2, 4, 8]);
        assert_eq!(MAX_SIDECAR_RETRIES, 3);
    }

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
