use crate::domain::entities::transcription::{TranscriptionResult, Word};
use crate::domain::entities::transcript_stored::{TranscriptStored, TranscriptWordStored};
use crate::domain::errors::DomainError;
use crate::domain::repositories::TranscriptRepository;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{debug, info};

/// SaveTranscript Use Case
///
/// Orchestrates the conversion of in-memory TranscriptionResult (from Parakeet)
/// to persistent TranscriptStored entities and saves them to the database.
///
/// Responsibilities:
/// - Convert TranscriptionResult → TranscriptStored
/// - Convert Vec<Word> → Vec<TranscriptWordStored>
/// - Generate unique IDs (UUID v4) for transcript and words
/// - Add metadata (created_at timestamp, language detection)
/// - Call repository for atomic persistence
pub struct SaveTranscriptUseCase {
    transcript_repository: Arc<dyn TranscriptRepository>,
}

impl SaveTranscriptUseCase {
    pub fn new(transcript_repository: Arc<dyn TranscriptRepository>) -> Self {
        Self {
            transcript_repository,
        }
    }

    /// Execute the use case to save a transcription result
    ///
    /// # Arguments
    /// * `result` - The in-memory transcription result from Parakeet
    /// * `project_id` - The project ID this transcript belongs to
    ///
    /// # Returns
    /// * `Ok(TranscriptStored)` - The saved transcript with generated ID
    /// * `Err(DomainError)` - If save failed
    pub fn execute(
        &self,
        result: TranscriptionResult,
        project_id: String,
    ) -> Result<TranscriptStored, DomainError> {
        info!(
            event = "save_transcript_use_case",
            project_id = %project_id,
            word_count = result.words.len(),
            "Converting and saving transcription result"
        );

        // Generate unique transcript ID
        let transcript_id = uuid::Uuid::new_v4().to_string();

        // Get current timestamp
        let created_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| {
                DomainError::ValidationError(format!("Failed to get timestamp: {}", e))
            })?
            .as_secs() as i64;

        // Convert TranscriptionResult → TranscriptStored
        let transcript = TranscriptStored {
            id: transcript_id.clone(),
            project_id: project_id.clone(),
            full_text: result.text.clone(),
            language: result.language.unwrap_or_else(|| "fr".to_string()),
            created_at,
        };

        debug!(
            transcript_id = %transcript.id,
            language = %transcript.language,
            "Created transcript entity"
        );

        // Convert Vec<Word> → Vec<TranscriptWordStored>
        let words: Vec<TranscriptWordStored> = result.words
            .into_iter()
            .enumerate()
            .map(|(index, word)| {
                TranscriptWordStored {
                    id: uuid::Uuid::new_v4().to_string(),
                    transcript_id: transcript_id.clone(),
                    word: word.text,
                    start_time: word.start,
                    end_time: word.end,
                    confidence: word.confidence,
                    word_index: index as i64,
                }
            })
            .collect();

        debug!(
            word_count = words.len(),
            "Converted words to stored entities"
        );

        // Persist to database (atomic transaction)
        self.transcript_repository
            .save_transcript(transcript.clone(), words)?;

        info!(
            event = "save_transcript_success",
            transcript_id = %transcript.id,
            project_id = %project_id,
            "Transcript saved successfully"
        );

        Ok(transcript)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::repositories::TranscriptRepository;

    struct MockTranscriptRepository;

    impl TranscriptRepository for MockTranscriptRepository {
        fn save_transcript(
            &self,
            _transcript: TranscriptStored,
            _words: Vec<TranscriptWordStored>,
        ) -> Result<(), DomainError> {
            Ok(())
        }

        fn find_by_project_id(&self, _project_id: &str) -> Result<Option<TranscriptStored>, DomainError> {
            Ok(None)
        }

        fn find_words_by_transcript_id(
            &self,
            _transcript_id: &str,
        ) -> Result<Vec<TranscriptWordStored>, DomainError> {
            Ok(vec![])
        }

        fn delete_by_project_id(&self, _project_id: &str) -> Result<(), DomainError> {
            Ok(())
        }
    }

    #[test]
    fn test_save_transcript_use_case() {
        let repo = Arc::new(MockTranscriptRepository);
        let use_case = SaveTranscriptUseCase::new(repo);

        let transcription_result = TranscriptionResult {
            video_id: "video-123".to_string(),
            text: "Bonjour le monde".to_string(),
            words: vec![
                Word {
                    text: "Bonjour".to_string(),
                    start: 0.0,
                    end: 0.45,
                    confidence: 0.95,
                },
                Word {
                    text: "le".to_string(),
                    start: 0.45,
                    end: 0.55,
                    confidence: 0.98,
                },
                Word {
                    text: "monde".to_string(),
                    start: 0.55,
                    end: 0.90,
                    confidence: 0.97,
                },
            ],
            duration_seconds: 0.90,
            language: Some("fr".to_string()),
        };

        let result = use_case.execute(transcription_result, "project-456".to_string());

        assert!(result.is_ok());
        let transcript = result.unwrap();
        assert_eq!(transcript.project_id, "project-456");
        assert_eq!(transcript.full_text, "Bonjour le monde");
        assert_eq!(transcript.language, "fr");
        assert!(!transcript.id.is_empty());
    }

    #[test]
    fn test_save_transcript_default_language() {
        let repo = Arc::new(MockTranscriptRepository);
        let use_case = SaveTranscriptUseCase::new(repo);

        let transcription_result = TranscriptionResult {
            video_id: "video-123".to_string(),
            text: "Test".to_string(),
            words: vec![],
            duration_seconds: 1.0,
            language: None, // No language specified
        };

        let result = use_case.execute(transcription_result, "project-456".to_string());

        assert!(result.is_ok());
        let transcript = result.unwrap();
        assert_eq!(transcript.language, "fr"); // Default to French
    }
}
