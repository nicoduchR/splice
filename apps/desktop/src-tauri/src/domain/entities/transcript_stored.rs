use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// TranscriptStored - represents a persisted transcript in SQLite database
///
/// This entity is distinct from TranscriptionResult (which is the in-memory result from Parakeet).
/// TranscriptStored is the database-persisted version with additional metadata like id and created_at.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct TranscriptStored {
    pub id: String,
    #[ts(rename = "projectId")]
    pub project_id: String,
    #[ts(rename = "fullText")]
    pub full_text: String,
    pub language: String,
    #[ts(rename = "createdAt")]
    pub created_at: i64,
}

/// TranscriptWordStored - represents a single persisted word with timestamp in SQLite database
///
/// Each word is stored individually to enable:
/// - Precise word-level timestamp queries
/// - Efficient partial transcript saves during long transcriptions
/// - Crash recovery with word-level granularity
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct TranscriptWordStored {
    pub id: String,
    #[ts(rename = "transcriptId")]
    pub transcript_id: String,
    pub word: String,
    #[ts(rename = "startTime")]
    pub start_time: f64,
    #[ts(rename = "endTime")]
    pub end_time: f64,
    pub confidence: f64,
    #[ts(rename = "wordIndex")]
    pub word_index: i64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transcript_stored_creation() {
        let transcript = TranscriptStored {
            id: "transcript-123".to_string(),
            project_id: "project-456".to_string(),
            full_text: "Bonjour le monde".to_string(),
            language: "fr".to_string(),
            created_at: 1706745600,
        };

        assert_eq!(transcript.id, "transcript-123");
        assert_eq!(transcript.project_id, "project-456");
        assert_eq!(transcript.full_text, "Bonjour le monde");
        assert_eq!(transcript.language, "fr");
        assert_eq!(transcript.created_at, 1706745600);
    }

    #[test]
    fn test_transcript_word_stored_creation() {
        let word = TranscriptWordStored {
            id: "word-1".to_string(),
            transcript_id: "transcript-123".to_string(),
            word: "Bonjour".to_string(),
            start_time: 0.0,
            end_time: 0.45,
            confidence: 0.95,
            word_index: 0,
        };

        assert_eq!(word.id, "word-1");
        assert_eq!(word.transcript_id, "transcript-123");
        assert_eq!(word.word, "Bonjour");
        assert_eq!(word.start_time, 0.0);
        assert_eq!(word.end_time, 0.45);
        assert_eq!(word.confidence, 0.95);
        assert_eq!(word.word_index, 0);
    }
}
