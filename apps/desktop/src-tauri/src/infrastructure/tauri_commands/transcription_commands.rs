use tauri::{AppHandle, Emitter, State};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use crate::domain::entities::transcription::TranscriptionResult;
use crate::domain::entities::transcript_stored::{TranscriptStored, TranscriptWordStored};
use crate::domain::repositories::TranscriptRepository;
use crate::infrastructure::adapters::{AudioExtractor, ParakeetTranscriptionService};
use crate::infrastructure::config::app_state::AppState;
use crate::application::ports::transcription_service::TranscriptionService;
use crate::application::use_cases::SaveTranscriptUseCase;

// Progress tracking constants
const PROGRESS_EXTRACTION: f64 = 0.2;
const PROGRESS_LOADING: f64 = 0.4;
const PROGRESS_TRANSCRIBING: f64 = 0.6;
const PROGRESS_COMPLETED: f64 = 1.0;

/// Progress event payload for transcription
#[derive(Clone, Serialize)]
struct TranscriptionProgress {
    video_id: String,
    stage: String,
    progress: f64,
    message: String,
}

/// Transcribe video audio to text with word-level timestamps
///
/// This command orchestrates the full transcription pipeline:
/// 1. Extract audio from video (FFmpeg) → 20%
/// 2. Load audio into memory → 40%
/// 3. Transcribe with Parakeet model (CPU) → 60%
/// 4. Complete and cleanup → 100%
///
/// Progress events are emitted to frontend via `transcription:progress` channel
///
/// **Limitation:** Cancellation is not yet implemented. Once started, transcription
/// runs to completion. Future Story 2.4+ will add CancellationToken support.
///
/// See: https://github.com/your-org/splice/issues/XXX
#[tauri::command]
pub async fn transcribe_video<R: tauri::Runtime>(
    video_id: String,
    video_path: String,
    app_handle: AppHandle<R>,
    app_state: State<'_, AppState>,
) -> Result<TranscriptionResult, String> {
    tracing::info!(
        event = "transcribe_video_command",
        video_id = %video_id,
        video_path = %video_path,
    );

    // Create and store cancellation flag
    let cancel_flag = Arc::new(AtomicBool::new(false));
    app_state.set_cancel_flag(video_id.clone(), cancel_flag.clone());

    // Validation: Check video_id is not empty
    if video_id.trim().is_empty() {
        return Err("L'identifiant vidéo ne peut pas être vide".to_string());
    }

    // Validation: Check video_path exists
    let video_path_buf = PathBuf::from(&video_path);
    if !video_path_buf.exists() {
        return Err(format!("Le fichier vidéo n'existe pas: {}", video_path));
    }

    // Validation: Check it's a file (not a directory)
    if !video_path_buf.is_file() {
        return Err(format!("Le chemin n'est pas un fichier valide: {}", video_path));
    }

    // Validation: Check file size is reasonable (max 10 GB)
    const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024 * 1024; // 10 GB
    if let Ok(metadata) = std::fs::metadata(&video_path_buf) {
        let file_size = metadata.len();
        if file_size > MAX_FILE_SIZE {
            return Err(format!(
                "Le fichier vidéo est trop volumineux: {:.2} GB (max: 10 GB)",
                file_size as f64 / (1024.0 * 1024.0 * 1024.0)
            ));
        }
    }

    // Create temp directory for audio extraction
    let temp_dir = dirs::home_dir()
        .ok_or("Impossible de trouver le répertoire home")?
        .join(".splice")
        .join("temp");

    std::fs::create_dir_all(&temp_dir).map_err(|e| {
        format!("Erreur lors de la création du répertoire temporaire: {}", e)
    })?;

    let audio_path = temp_dir.join(format!("audio-{}.wav", video_id));

    // Stage 1: Extract audio (20%)
    emit_progress(
        &app_handle,
        &video_id,
        "extracting",
        PROGRESS_EXTRACTION,
        "Extraction de l'audio...",
    )
    .map_err(|e| format!("Erreur d'émission d'événement: {}", e))?;

    // Check for cancellation before extraction
    if cancel_flag.load(Ordering::Relaxed) {
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    AudioExtractor::extract_audio(&PathBuf::from(&video_path), &audio_path)
        .await
        .map_err(|e| format!("Erreur d'extraction audio: {}", e))?;

    // Check for cancellation after extraction
    if cancel_flag.load(Ordering::Relaxed) {
        // Cleanup extracted audio file
        let _ = tokio::fs::remove_file(&audio_path).await;
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    // Stage 2: Load audio (40%)
    emit_progress(
        &app_handle,
        &video_id,
        "loading",
        PROGRESS_LOADING,
        "Chargement de l'audio en mémoire...",
    )
    .map_err(|e| format!("Erreur d'émission d'événement: {}", e))?;

    // Check for cancellation before loading
    if cancel_flag.load(Ordering::Relaxed) {
        let _ = tokio::fs::remove_file(&audio_path).await;
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    let (audio_samples, sample_rate, channels) =
        AudioExtractor::load_wav_as_f32(&audio_path)
            .map_err(|e| format!("Erreur de lecture du fichier WAV: {}", e))?;

    tracing::info!(
        event = "audio_loaded",
        sample_count = audio_samples.len(),
        sample_rate = sample_rate,
        channels = channels,
    );

    // Check for cancellation after loading
    if cancel_flag.load(Ordering::Relaxed) {
        let _ = tokio::fs::remove_file(&audio_path).await;
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    // Stage 3: Transcription (60%)
    emit_progress(
        &app_handle,
        &video_id,
        "transcribing",
        PROGRESS_TRANSCRIBING,
        "Transcription en cours (CPU)...",
    )
    .map_err(|e| format!("Erreur d'émission d'événement: {}", e))?;

    // Check for cancellation before transcription
    if cancel_flag.load(Ordering::Relaxed) {
        let _ = tokio::fs::remove_file(&audio_path).await;
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    let service = ParakeetTranscriptionService;
    let result = service
        .transcribe_audio(audio_samples, sample_rate, channels, video_id.clone())
        .await
        .map_err(|e| {
            // Cleanup on error
            let _ = std::fs::remove_file(&audio_path);
            app_state.remove_cancel_flag(&video_id);
            format!("Erreur de transcription: {}", e)
        })?;

    // Check for cancellation after transcription
    if cancel_flag.load(Ordering::Relaxed) {
        let _ = tokio::fs::remove_file(&audio_path).await;
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    // Stage 4: Completed (100%)
    emit_progress(
        &app_handle,
        &video_id,
        "completed",
        PROGRESS_COMPLETED,
        &format!(
            "Transcription terminée ({} mots, {:.1}s)",
            result.words.len(),
            result.duration_seconds
        ),
    )
    .map_err(|e| format!("Erreur d'émission d'événement: {}", e))?;

    // Cleanup: remove temporary WAV file
    if let Err(e) = tokio::fs::remove_file(&audio_path).await {
        tracing::warn!(
            event = "cleanup_failed",
            audio_path = %audio_path.display(),
            error = %e,
            "Failed to remove temporary audio file"
        );
    } else {
        tracing::info!(
            event = "cleanup_completed",
            audio_path = %audio_path.display(),
        );
    }

    // Remove cancellation flag on successful completion
    app_state.remove_cancel_flag(&video_id);

    Ok(result)
}

/// Helper function to emit progress events
fn emit_progress<R: tauri::Runtime>(
    app_handle: &AppHandle<R>,
    video_id: &str,
    stage: &str,
    progress: f64,
    message: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    app_handle.emit(
        "transcription:progress",
        TranscriptionProgress {
            video_id: video_id.to_string(),
            stage: stage.to_string(),
            progress,
            message: message.to_string(),
        },
    )?;

    tracing::debug!(
        event = "transcription_progress",
        video_id = %video_id,
        stage = %stage,
        progress = progress,
        message = %message,
    );

    Ok(())
}

/// Save a transcription result to database
///
/// Takes an in-memory TranscriptionResult and persists it to SQLite
/// with generated IDs and metadata.
///
/// # Arguments
/// * `transcript_result` - The transcription result from Parakeet
/// * `project_id` - The project ID this transcript belongs to
/// * `app_state` - The application state (injected by Tauri)
///
/// # Returns
/// * `Ok(TranscriptStored)` - The saved transcript with ID
/// * `Err(String)` - Error message in French
#[tauri::command]
pub async fn save_transcript(
    transcript_result: TranscriptionResult,
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<TranscriptStored, String> {
    tracing::info!(
        event = "save_transcript_command",
        project_id = %project_id,
        word_count = transcript_result.words.len(),
    );

    // Validation: Check project_id is not empty
    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    // Create use case and execute
    let use_case = SaveTranscriptUseCase::new(app_state.transcript_repository.clone());

    match use_case.execute(transcript_result, project_id) {
        Ok(transcript) => {
            tracing::info!(
                event = "save_transcript_success",
                transcript_id = %transcript.id,
            );
            Ok(transcript)
        }
        Err(e) => {
            tracing::error!(
                event = "save_transcript_failed",
                error = %e,
            );
            Err(format!("Erreur lors de la sauvegarde du transcript: {}", e))
        }
    }
}

/// Combined transcript with words for frontend
#[derive(Clone, Serialize)]
pub struct FullTranscript {
    pub transcript: TranscriptStored,
    pub words: Vec<TranscriptWordStored>,
}

/// Get a transcript by project ID
///
/// Retrieves the transcript and all its words from the database.
///
/// # Arguments
/// * `project_id` - The project ID to search for
/// * `app_state` - The application state (injected by Tauri)
///
/// # Returns
/// * `Ok(Some(FullTranscript))` - The transcript with words
/// * `Ok(None)` - No transcript found for this project
/// * `Err(String)` - Error message in French
#[tauri::command]
pub async fn get_transcript(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<Option<FullTranscript>, String> {
    tracing::info!(
        event = "get_transcript_command",
        project_id = %project_id,
    );

    // Validation: Check project_id is not empty
    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    // Find transcript
    let transcript = match app_state.transcript_repository.find_by_project_id(&project_id) {
        Ok(Some(t)) => t,
        Ok(None) => {
            tracing::info!(
                event = "get_transcript_not_found",
                project_id = %project_id,
            );
            return Ok(None);
        }
        Err(e) => {
            tracing::error!(
                event = "get_transcript_failed",
                error = %e,
            );
            return Err(format!("Erreur lors de la récupération du transcript: {}", e));
        }
    };

    // Find words
    let words = match app_state.transcript_repository.find_words_by_transcript_id(&transcript.id) {
        Ok(w) => w,
        Err(e) => {
            tracing::error!(
                event = "get_transcript_words_failed",
                error = %e,
            );
            return Err(format!("Erreur lors de la récupération des mots: {}", e));
        }
    };

    tracing::info!(
        event = "get_transcript_success",
        transcript_id = %transcript.id,
        word_count = words.len(),
    );

    Ok(Some(FullTranscript {
        transcript,
        words,
    }))
}

/// Cancel an ongoing transcription
///
/// Sets the cancellation flag for the specified video ID, which will
/// cause the transcription to abort at the next checkpoint.
///
/// # Arguments
/// * `video_id` - The video ID of the transcription to cancel
/// * `app_state` - The application state (injected by Tauri)
///
/// # Returns
/// * `Ok(())` - Cancellation flag set successfully
/// * `Err(String)` - Error message in French
#[tauri::command]
pub async fn cancel_transcription(
    video_id: String,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(
        event = "cancel_transcription_command",
        video_id = %video_id,
    );

    // Validation: Check video_id is not empty
    if video_id.trim().is_empty() {
        return Err("L'identifiant vidéo ne peut pas être vide".to_string());
    }

    // Get the cancellation flag
    if let Some(flag) = app_state.get_cancel_flag(&video_id) {
        // Set the flag to signal cancellation
        flag.store(true, Ordering::Relaxed);

        tracing::info!(
            event = "cancel_transcription_flagged",
            video_id = %video_id,
        );

        Ok(())
    } else {
        // No active transcription found
        tracing::warn!(
            event = "cancel_transcription_not_found",
            video_id = %video_id,
            "No active transcription found for this video ID"
        );

        // Return Ok anyway since the desired state (no transcription running) is achieved
        Ok(())
    }
}

/// Clean up old temporary audio files on app startup
/// This prevents temp directory from accumulating orphaned WAV files
pub fn cleanup_temp_directory() {
    let temp_dir = match dirs::home_dir() {
        Some(home) => home.join(".splice").join("temp"),
        None => {
            tracing::warn!("Impossible de trouver le répertoire home pour le cleanup");
            return;
        }
    };

    if !temp_dir.exists() {
        tracing::debug!("Répertoire temporaire n'existe pas encore, cleanup non nécessaire");
        return;
    }

    tracing::info!(
        event = "temp_cleanup_started",
        temp_dir = %temp_dir.display(),
    );

    match std::fs::read_dir(&temp_dir) {
        Ok(entries) => {
            let mut cleaned_count = 0;
            let mut error_count = 0;

            for entry in entries.flatten() {
                if let Ok(file_type) = entry.file_type() {
                    if file_type.is_file() {
                        if let Some(extension) = entry.path().extension() {
                            if extension == "wav" {
                                match std::fs::remove_file(entry.path()) {
                                    Ok(_) => {
                                        cleaned_count += 1;
                                        tracing::debug!(
                                            "Supprimé: {}",
                                            entry.path().display()
                                        );
                                    }
                                    Err(e) => {
                                        error_count += 1;
                                        tracing::warn!(
                                            "Erreur suppression {}: {}",
                                            entry.path().display(),
                                            e
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }

            tracing::info!(
                event = "temp_cleanup_completed",
                cleaned_files = cleaned_count,
                errors = error_count,
            );
        }
        Err(e) => {
            tracing::error!(
                event = "temp_cleanup_failed",
                error = %e,
                "Impossible de lire le répertoire temporaire"
            );
        }
    }
}
