use crate::domain::entities::transcript_stored::{TranscriptStored, TranscriptWordStored};
use crate::domain::errors::DomainError;

/// TranscriptRepository trait defines the contract for transcript persistence
/// This trait lives in Domain layer and is implemented in Infrastructure layer
///
/// Design decisions:
/// - save_transcript takes both transcript and words for atomic transaction
/// - find_by_project_id returns Optional to handle case where no transcript exists yet
/// - find_words_by_transcript_id returns Vec<TranscriptWordStored> ordered by word_index
/// - delete_by_project_id leverages CASCADE DELETE via foreign keys
pub trait TranscriptRepository: Send + Sync {
    /// Save a transcript with all its words in an atomic transaction
    ///
    /// # Arguments
    /// * `transcript` - The transcript metadata to save
    /// * `words` - The list of words with timestamps to save
    ///
    /// # Returns
    /// * `Ok(())` if save succeeded
    /// * `Err(DomainError)` if save failed (transaction will be rolled back)
    fn save_transcript(
        &self,
        transcript: TranscriptStored,
        words: Vec<TranscriptWordStored>,
    ) -> Result<(), DomainError>;

    /// Find a transcript by project ID
    ///
    /// # Arguments
    /// * `project_id` - The project ID to search for
    ///
    /// # Returns
    /// * `Ok(Some(TranscriptStored))` if transcript found
    /// * `Ok(None)` if no transcript exists for this project
    /// * `Err(DomainError)` if query failed
    fn find_by_project_id(&self, project_id: &str) -> Result<Option<TranscriptStored>, DomainError>;

    /// Find all words for a transcript, ordered by word_index ASC
    ///
    /// # Arguments
    /// * `transcript_id` - The transcript ID to search for
    ///
    /// # Returns
    /// * `Ok(Vec<TranscriptWordStored>)` - Words ordered by word_index
    /// * `Err(DomainError)` if query failed
    fn find_words_by_transcript_id(
        &self,
        transcript_id: &str,
    ) -> Result<Vec<TranscriptWordStored>, DomainError>;

    /// Delete a transcript by project ID (CASCADE deletes words automatically)
    ///
    /// # Arguments
    /// * `project_id` - The project ID whose transcript should be deleted
    ///
    /// # Returns
    /// * `Ok(())` if delete succeeded (or transcript didn't exist)
    /// * `Err(DomainError)` if delete failed
    fn delete_by_project_id(&self, project_id: &str) -> Result<(), DomainError>;
}
