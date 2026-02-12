use async_trait::async_trait;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::Instant;
use tokio::process::Command;

use crate::application::ports::transcription_service::TranscriptionService;
use crate::domain::entities::transcription::{TranscriptionResult, Word};

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

/// WhisperTranscriptionService - transcription via local whisper-sidecar.
///
/// The sidecar is expected to implement:
/// `whisper-sidecar transcribe <audio.wav> --language <fr|en|auto> --profile fast --output json`
pub struct WhisperTranscriptionService;

impl WhisperTranscriptionService {
    fn sidecar_path() -> PathBuf {
        // Production path: next to the running executable
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()));

        if let Some(dir) = &exe_dir {
            let candidate = dir.join("whisper-sidecar");
            if candidate.exists() {
                return candidate;
            }
        }

        // Dev path: binaries/<name>-<target-triple>
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let arch_target = format!("whisper-sidecar-{}-apple-darwin", std::env::consts::ARCH);
        let dev_path = PathBuf::from(manifest_dir)
            .join("binaries")
            .join(&arch_target);

        if dev_path.exists() {
            return dev_path;
        }

        PathBuf::from("whisper-sidecar")
    }

    fn sanitize_sidecar_error(raw_error: &str) -> String {
        let first_line = raw_error.lines().find(|line| !line.trim().is_empty()).unwrap_or(raw_error);
        let first_line = first_line.trim();

        if first_line.len() > 240 {
            first_line[..240].to_string()
        } else {
            first_line.to_string()
        }
    }

    pub async fn transcribe_file_with_options(
        &self,
        audio_path: &Path,
        video_id: String,
        language: &str,
        profile: &str,
    ) -> Result<TranscriptionResult, Box<dyn std::error::Error + Send + Sync>> {
        let sidecar = Self::sidecar_path();

        tracing::info!(
            event = "whisper_transcription_started",
            video_id = %video_id,
            audio_path = %audio_path.display(),
            sidecar = %sidecar.display(),
            forced_language = %language,
            profile = %profile,
        );

        let start_time = Instant::now();

        let output = Command::new(&sidecar)
            .args([
                "transcribe",
                &audio_path.to_string_lossy(),
                "--language",
                language,
                "--profile",
                profile,
                "--output",
                "json",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| {
                format!(
                    "Impossible de lancer le sidecar Whisper ({}): {}",
                    sidecar.display(),
                    e
                )
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(format!(
                "Le sidecar Whisper a échoué: {}",
                Self::sanitize_sidecar_error(&stderr)
            )
            .into());
        }

        let stdout_str = String::from_utf8(output.stdout).map_err(|e| {
            format!("Sortie du sidecar Whisper non-UTF8: {}", e)
        })?;

        let sidecar_output: SidecarOutput = serde_json::from_str(&stdout_str).map_err(|e| {
            format!(
                "Erreur de parsing JSON du sidecar Whisper: {} — sortie: {}",
                e,
                &stdout_str[..stdout_str.len().min(500)]
            )
        })?;

        let raw_words: Vec<Word> = sidecar_output
            .words
            .into_iter()
            .map(|w| Word {
                text: w.text,
                start: w.start,
                end: w.end,
                confidence: w.confidence,
            })
            .collect();

        let words = merge_subword_tokens(raw_words);

        let result = TranscriptionResult {
            video_id: video_id.clone(),
            text: sidecar_output.text,
            words,
            duration_seconds: sidecar_output.duration_seconds,
            language: Some(sidecar_output.language),
        };

        let elapsed = start_time.elapsed().as_secs_f64();
        let rtf = if elapsed > 0.0 {
            result.duration_seconds / elapsed
        } else {
            0.0
        };

        tracing::info!(
            event = "whisper_transcription_completed",
            video_id = %video_id,
            word_count = result.words.len(),
            audio_duration_seconds = result.duration_seconds,
            transcription_time_seconds = elapsed,
            rtf = rtf,
            forced_language = %language,
            profile = %profile,
        );

        Ok(result)
    }
}

#[async_trait]
impl TranscriptionService for WhisperTranscriptionService {
    async fn transcribe_file(
        &self,
        audio_path: &Path,
        video_id: String,
    ) -> Result<TranscriptionResult, Box<dyn std::error::Error + Send + Sync>> {
        self.transcribe_file_with_options(audio_path, video_id, "auto", "fast")
            .await
    }
}

/// Merge SentencePiece-style subword tokens into proper words.
fn merge_subword_tokens(tokens: Vec<Word>) -> Vec<Word> {
    let mut merged: Vec<Word> = Vec::new();

    for token in tokens {
        let starts_new_word = token.text.starts_with('\u{2581}') || token.text.starts_with(' ');

        if starts_new_word || merged.is_empty() {
            let text = token
                .text
                .trim_start_matches('\u{2581}')
                .trim_start()
                .to_string();
            merged.push(Word {
                text,
                start: token.start,
                end: token.end,
                confidence: token.confidence,
            });
        } else {
            let current = merged.last_mut().expect("merged should contain a current word");
            current.text.push_str(&token.text);
            current.end = token.end;
            if token.confidence < current.confidence {
                current.confidence = token.confidence;
            }
        }
    }

    for word in &mut merged {
        word.text = word.text.trim().to_string();
    }

    merged.retain(|w| !w.text.is_empty());
    merged
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn merge_subword_tokens_merges_continuations() {
        let tokens = vec![
            Word {
                text: "▁invest".to_string(),
                start: 0.0,
                end: 0.1,
                confidence: 0.9,
            },
            Word {
                text: "isse".to_string(),
                start: 0.1,
                end: 0.2,
                confidence: 0.8,
            },
            Word {
                text: "urs".to_string(),
                start: 0.2,
                end: 0.3,
                confidence: 0.85,
            },
        ];

        let merged = merge_subword_tokens(tokens);
        assert_eq!(merged.len(), 1);
        assert_eq!(merged[0].text, "investisseurs");
        assert_eq!(merged[0].start, 0.0);
        assert_eq!(merged[0].end, 0.3);
        assert_eq!(merged[0].confidence, 0.8);
    }
}
