use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Word - represents a single word with timestamp information from Parakeet transcription
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct Word {
    pub text: String,
    /// Start timestamp in seconds
    pub start: f64,
    /// End timestamp in seconds
    pub end: f64,
    /// Confidence score [0.0, 1.0] - transcription quality for this word
    ///
    /// Note: Parakeet TDT 0.6B v3 via parakeet-rs does not expose per-word confidence scores.
    /// Currently defaults to 1.0 for all words. Future versions may support actual scores.
    pub confidence: f64,
}

/// TranscriptionResult - represents the result of a Parakeet transcription operation
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct TranscriptionResult {
    #[ts(rename = "videoId")]
    pub video_id: String,
    /// Full concatenated text
    pub text: String,
    /// Individual words with timestamps
    pub words: Vec<Word>,
    #[ts(rename = "durationSeconds")]
    pub duration_seconds: f64,
    pub language: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_word_creation() {
        let word = Word {
            text: "Bonjour".to_string(),
            start: 0.0,
            end: 0.45,
            confidence: 0.95,
        };

        assert_eq!(word.text, "Bonjour");
        assert_eq!(word.start, 0.0);
        assert_eq!(word.end, 0.45);
        assert_eq!(word.confidence, 0.95);
    }

    #[test]
    fn test_transcription_result_creation() {
        let words = vec![
            Word {
                text: "Bonjour".to_string(),
                start: 0.0,
                end: 0.45,
                confidence: 0.95,
            },
            Word {
                text: "monde".to_string(),
                start: 0.45,
                end: 0.85,
                confidence: 0.98,
            },
        ];

        let result = TranscriptionResult {
            video_id: "test-123".to_string(),
            text: "Bonjour monde".to_string(),
            words: words.clone(),
            duration_seconds: 0.85,
            language: Some("fr".to_string()),
        };

        assert_eq!(result.video_id, "test-123");
        assert_eq!(result.text, "Bonjour monde");
        assert_eq!(result.words.len(), 2);
        assert_eq!(result.duration_seconds, 0.85);
        assert_eq!(result.language, Some("fr".to_string()));
    }
}
