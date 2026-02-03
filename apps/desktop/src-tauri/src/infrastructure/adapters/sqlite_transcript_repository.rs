use crate::domain::entities::transcript_stored::{TranscriptStored, TranscriptWordStored};
use crate::domain::errors::DomainError;
use crate::domain::repositories::TranscriptRepository;
use sqlx::SqlitePool;
use sqlx::Row;
use tracing::{debug, error, info};

/// SQLite implementation of TranscriptRepository
///
/// This repository handles persistence of transcripts and their word-level timestamps
/// using atomic transactions for data integrity.
pub struct SqliteTranscriptRepository {
    pool: SqlitePool,
}

impl SqliteTranscriptRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl TranscriptRepository for SqliteTranscriptRepository {
    fn save_transcript(
        &self,
        transcript: TranscriptStored,
        words: Vec<TranscriptWordStored>,
    ) -> Result<(), DomainError> {
        info!(
            event = "save_transcript",
            transcript_id = %transcript.id,
            project_id = %transcript.project_id,
            word_count = words.len(),
            "Saving transcript with words"
        );

        let pool = self.pool.clone();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                // Use transaction for atomic save operation
                let mut tx = pool.begin().await.map_err(|e| {
                    error!("Failed to begin transaction: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                // 1. Save transcript
                sqlx::query(
                    "INSERT INTO transcripts (id, project_id, full_text, language, created_at)
                     VALUES (?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET
                         full_text = excluded.full_text,
                         language = excluded.language"
                )
                .bind(&transcript.id)
                .bind(&transcript.project_id)
                .bind(&transcript.full_text)
                .bind(&transcript.language)
                .bind(transcript.created_at)
                .execute(&mut *tx)
                .await
                .map_err(|e| {
                    error!("Failed to save transcript: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                // 2. Delete existing words for this transcript (if upsert)
                sqlx::query("DELETE FROM transcript_words WHERE transcript_id = ?")
                    .bind(&transcript.id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| {
                        error!("Failed to delete existing words: {}", e);
                        DomainError::RepositoryError(e.to_string())
                    })?;

                // 3. Batch insert all words
                for word in &words {
                    sqlx::query(
                        "INSERT INTO transcript_words
                         (id, transcript_id, word, start_time, end_time, confidence, word_index)
                         VALUES (?, ?, ?, ?, ?, ?, ?)"
                    )
                    .bind(&word.id)
                    .bind(&word.transcript_id)
                    .bind(&word.word)
                    .bind(word.start_time)
                    .bind(word.end_time)
                    .bind(word.confidence)
                    .bind(word.word_index)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| {
                        error!("Failed to insert word: {}", e);
                        DomainError::RepositoryError(e.to_string())
                    })?;
                }

                // Commit transaction
                tx.commit().await.map_err(|e| {
                    error!("Failed to commit transaction: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                info!(
                    event = "save_transcript_success",
                    transcript_id = %transcript.id,
                    words_saved = words.len(),
                    "Transcript saved successfully"
                );

                Ok(())
            })
        })
    }

    fn find_by_project_id(&self, project_id: &str) -> Result<Option<TranscriptStored>, DomainError> {
        debug!("Finding transcript by project_id: {}", project_id);

        let pool = self.pool.clone();
        let project_id = project_id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let row = sqlx::query(
                    "SELECT id, project_id, full_text, language, created_at
                     FROM transcripts
                     WHERE project_id = ?"
                )
                .bind(&project_id)
                .fetch_optional(&pool)
                .await
                .map_err(|e| {
                    error!("Database query failed: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                match row {
                    Some(row) => Ok(Some(TranscriptStored {
                        id: row.get("id"),
                        project_id: row.get("project_id"),
                        full_text: row.get("full_text"),
                        language: row.get("language"),
                        created_at: row.get("created_at"),
                    })),
                    None => Ok(None),
                }
            })
        })
    }

    fn find_words_by_transcript_id(
        &self,
        transcript_id: &str,
    ) -> Result<Vec<TranscriptWordStored>, DomainError> {
        debug!("Finding words for transcript_id: {}", transcript_id);

        let pool = self.pool.clone();
        let transcript_id = transcript_id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let rows = sqlx::query(
                    "SELECT id, transcript_id, word, start_time, end_time, confidence, word_index
                     FROM transcript_words
                     WHERE transcript_id = ?
                     ORDER BY word_index ASC"
                )
                .bind(&transcript_id)
                .fetch_all(&pool)
                .await
                .map_err(|e| {
                    error!("Database query failed: {}", e);
                    DomainError::RepositoryError(e.to_string())
                })?;

                let words = rows.into_iter().map(|row| {
                    TranscriptWordStored {
                        id: row.get("id"),
                        transcript_id: row.get("transcript_id"),
                        word: row.get("word"),
                        start_time: row.get("start_time"),
                        end_time: row.get("end_time"),
                        confidence: row.get("confidence"),
                        word_index: row.get("word_index"),
                    }
                }).collect();

                Ok(words)
            })
        })
    }

    fn delete_by_project_id(&self, project_id: &str) -> Result<(), DomainError> {
        debug!("Deleting transcript for project_id: {}", project_id);

        let pool = self.pool.clone();
        let project_id = project_id.to_string();

        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                // CASCADE DELETE will automatically delete transcript_words
                sqlx::query("DELETE FROM transcripts WHERE project_id = ?")
                    .bind(&project_id)
                    .execute(&pool)
                    .await
                    .map_err(|e| {
                        error!("Failed to delete transcript: {}", e);
                        DomainError::RepositoryError(e.to_string())
                    })?;

                Ok(())
            })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use std::time::{SystemTime, UNIX_EPOCH};

    async fn create_test_pool() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(":memory:")
            .await
            .expect("Failed to create test pool");

        // Run migrations
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        pool
    }

    async fn create_test_project(pool: &SqlitePool, project_id: &str) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        sqlx::query(
            "INSERT INTO projects (id, file_path, file_name, duration_seconds, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(project_id)
        .bind("/test/video.mp4")
        .bind("video.mp4")
        .bind(60.0)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .expect("Failed to create test project");
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_save_and_retrieve_transcript() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-456").await;

        let repo = SqliteTranscriptRepository::new(pool);

        // Créer transcript avec 3 words
        let transcript = TranscriptStored {
            id: "transcript-123".to_string(),
            project_id: "project-456".to_string(),
            full_text: "Bonjour le monde".to_string(),
            language: "fr".to_string(),
            created_at: 1706745600,
        };

        let words = vec![
            TranscriptWordStored {
                id: "word-1".to_string(),
                transcript_id: "transcript-123".to_string(),
                word: "Bonjour".to_string(),
                start_time: 0.0,
                end_time: 0.45,
                confidence: 0.95,
                word_index: 0,
            },
            TranscriptWordStored {
                id: "word-2".to_string(),
                transcript_id: "transcript-123".to_string(),
                word: "le".to_string(),
                start_time: 0.45,
                end_time: 0.55,
                confidence: 0.98,
                word_index: 1,
            },
            TranscriptWordStored {
                id: "word-3".to_string(),
                transcript_id: "transcript-123".to_string(),
                word: "monde".to_string(),
                start_time: 0.55,
                end_time: 0.90,
                confidence: 0.97,
                word_index: 2,
            },
        ];

        // Save
        repo.save_transcript(transcript.clone(), words.clone()).unwrap();

        // Retrieve transcript
        let retrieved = repo.find_by_project_id("project-456").unwrap();
        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.full_text, transcript.full_text);
        assert_eq!(retrieved.language, "fr");

        // Retrieve words
        let retrieved_words = repo.find_words_by_transcript_id("transcript-123").unwrap();
        assert_eq!(retrieved_words.len(), 3);
        assert_eq!(retrieved_words[0].word, "Bonjour");
        assert_eq!(retrieved_words[1].word, "le");
        assert_eq!(retrieved_words[2].word, "monde");
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_save_large_transcript_performance() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-perf").await;

        let repo = SqliteTranscriptRepository::new(pool);

        // Générer 1000 words
        let words: Vec<TranscriptWordStored> = (0..1000)
            .map(|i| TranscriptWordStored {
                id: format!("word-{}", i),
                transcript_id: "transcript-perf".to_string(),
                word: format!("word{}", i),
                start_time: i as f64 * 0.5,
                end_time: (i as f64 * 0.5) + 0.4,
                confidence: 0.9,
                word_index: i as i64,
            })
            .collect();

        let transcript = TranscriptStored {
            id: "transcript-perf".to_string(),
            project_id: "project-perf".to_string(),
            full_text: "...".to_string(),
            language: "fr".to_string(),
            created_at: 1706745600,
        };

        // Mesurer temps save
        let start = std::time::Instant::now();
        repo.save_transcript(transcript, words).unwrap();
        let duration = start.elapsed();

        // Performance < 500ms pour 1000 words (in-memory database)
        assert!(duration.as_millis() < 500, "Save took {}ms", duration.as_millis());
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_words_ordered_by_index() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-order").await;

        let repo = SqliteTranscriptRepository::new(pool);

        // Sauvegarder words dans ordre aléatoire
        let words = vec![
            TranscriptWordStored {
                id: "word-5".to_string(),
                transcript_id: "transcript-order".to_string(),
                word: "five".to_string(),
                start_time: 2.0,
                end_time: 2.5,
                confidence: 0.9,
                word_index: 5,
            },
            TranscriptWordStored {
                id: "word-2".to_string(),
                transcript_id: "transcript-order".to_string(),
                word: "two".to_string(),
                start_time: 0.5,
                end_time: 1.0,
                confidence: 0.9,
                word_index: 2,
            },
            TranscriptWordStored {
                id: "word-1".to_string(),
                transcript_id: "transcript-order".to_string(),
                word: "one".to_string(),
                start_time: 0.0,
                end_time: 0.5,
                confidence: 0.9,
                word_index: 1,
            },
        ];

        let transcript = TranscriptStored {
            id: "transcript-order".to_string(),
            project_id: "project-order".to_string(),
            full_text: "one two five".to_string(),
            language: "fr".to_string(),
            created_at: 1706745600,
        };

        repo.save_transcript(transcript, words).unwrap();

        // Retrieve
        let retrieved = repo.find_words_by_transcript_id("transcript-order").unwrap();

        // Vérifier ordre: [1, 2, 5]
        assert_eq!(retrieved.len(), 3);
        assert_eq!(retrieved[0].word_index, 1);
        assert_eq!(retrieved[0].word, "one");
        assert_eq!(retrieved[1].word_index, 2);
        assert_eq!(retrieved[1].word, "two");
        assert_eq!(retrieved[2].word_index, 5);
        assert_eq!(retrieved[2].word, "five");
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_upsert_transcript() {
        let pool = create_test_pool().await;
        create_test_project(&pool, "project-upsert").await;

        let repo = SqliteTranscriptRepository::new(pool);

        let transcript_v1 = TranscriptStored {
            id: "transcript-upsert".to_string(),
            project_id: "project-upsert".to_string(),
            full_text: "Version 1".to_string(),
            language: "fr".to_string(),
            created_at: 1706745600,
        };

        let words_v1 = vec![
            TranscriptWordStored {
                id: "word-1".to_string(),
                transcript_id: "transcript-upsert".to_string(),
                word: "Version".to_string(),
                start_time: 0.0,
                end_time: 0.5,
                confidence: 0.9,
                word_index: 0,
            },
        ];

        // Save v1
        repo.save_transcript(transcript_v1, words_v1).unwrap();

        // Save v2 avec même ID (upsert)
        let transcript_v2 = TranscriptStored {
            id: "transcript-upsert".to_string(),
            project_id: "project-upsert".to_string(),
            full_text: "Version 2 updated".to_string(),
            language: "en".to_string(),
            created_at: 1706745600,
        };

        let words_v2 = vec![
            TranscriptWordStored {
                id: "word-new-1".to_string(),
                transcript_id: "transcript-upsert".to_string(),
                word: "Version".to_string(),
                start_time: 0.0,
                end_time: 0.5,
                confidence: 0.9,
                word_index: 0,
            },
            TranscriptWordStored {
                id: "word-new-2".to_string(),
                transcript_id: "transcript-upsert".to_string(),
                word: "2".to_string(),
                start_time: 0.5,
                end_time: 0.7,
                confidence: 0.95,
                word_index: 1,
            },
        ];

        repo.save_transcript(transcript_v2.clone(), words_v2).unwrap();

        // Verify updated
        let retrieved = repo.find_by_project_id("project-upsert").unwrap().unwrap();
        assert_eq!(retrieved.full_text, "Version 2 updated");
        assert_eq!(retrieved.language, "en");

        // Verify words replaced (not appended)
        let retrieved_words = repo.find_words_by_transcript_id("transcript-upsert").unwrap();
        assert_eq!(retrieved_words.len(), 2);
        assert_eq!(retrieved_words[0].word, "Version");
        assert_eq!(retrieved_words[1].word, "2");
    }
}
