use tauri::{AppHandle, Emitter, State};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use crate::domain::entities::transcription::TranscriptionResult;
use crate::domain::entities::transcript_stored::{TranscriptStored, TranscriptWordStored};
use crate::domain::repositories::TranscriptRepository;
use crate::infrastructure::adapters::{AudioExtractor, FluidAudioTranscriptionService};
use crate::infrastructure::config::app_state::AppState;
use crate::application::ports::transcription_service::TranscriptionService;
use crate::application::use_cases::SaveTranscriptUseCase;

// Progress tracking constants
const PROGRESS_EXTRACTION: f64 = 0.2;
const PROGRESS_TRANSCRIBING: f64 = 0.4;
const PROGRESS_COMPLETED: f64 = 1.0;

/// Progress event payload for transcription
#[derive(Clone, Serialize)]
struct TranscriptionProgress {
    video_id: String,
    stage: String,
    progress: f64,
    message: String,
}

/// Error event payload for transcription
#[derive(Clone, Serialize)]
struct TranscriptionError {
    message: String,
}

/// Transcribe video audio to text with word-level timestamps
///
/// Pipeline (simplified with FluidAudio CoreML):
/// 1. Extract audio from video (FFmpeg) → 20%
/// 2. Transcribe with FluidAudio sidecar (CoreML Neural Engine) → 40-95%
/// 3. Complete and cleanup → 100%
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

    // Validation
    if video_id.trim().is_empty() {
        return Err("L'identifiant vidéo ne peut pas être vide".to_string());
    }

    let video_path_buf = PathBuf::from(&video_path);
    if !video_path_buf.exists() {
        return Err(format!("Le fichier vidéo n'existe pas: {}", video_path));
    }
    if !video_path_buf.is_file() {
        return Err(format!("Le chemin n'est pas un fichier valide: {}", video_path));
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

    if cancel_flag.load(Ordering::Relaxed) {
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    AudioExtractor::extract_audio(&video_path_buf, &audio_path)
        .await
        .map_err(|e| format!("Erreur d'extraction audio: {}", e))?;

    if cancel_flag.load(Ordering::Relaxed) {
        let _ = tokio::fs::remove_file(&audio_path).await;
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    // Stage 2: Transcribe with FluidAudio (single pass, no chunking needed)
    emit_progress(
        &app_handle,
        &video_id,
        "transcribing",
        PROGRESS_TRANSCRIBING,
        "Transcription en cours (CoreML Neural Engine)...",
    )
    .map_err(|e| format!("Erreur d'émission d'événement: {}", e))?;

    if cancel_flag.load(Ordering::Relaxed) {
        let _ = tokio::fs::remove_file(&audio_path).await;
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    let service = FluidAudioTranscriptionService;
    let result = match service.transcribe_file(&audio_path, video_id.clone()).await {
        Ok(r) => r,
        Err(e) => {
            let _ = tokio::fs::remove_file(&audio_path).await;
            app_state.remove_cancel_flag(&video_id);

            let error_string = e.to_string();
            let user_message = if error_string.contains("sidecar") {
                format!("Erreur du moteur de transcription FluidAudio: {}", error_string)
            } else {
                format!("Erreur de transcription: {}", error_string)
            };

            let _ = app_handle.emit("transcription:error", TranscriptionError {
                message: user_message.clone()
            });

            tracing::error!(
                event = "transcription_failed",
                error = %e,
            );

            return Err(user_message);
        }
    };

    if cancel_flag.load(Ordering::Relaxed) {
        let _ = tokio::fs::remove_file(&audio_path).await;
        app_state.remove_cancel_flag(&video_id);
        return Err("Transcription annulée par l'utilisateur".to_string());
    }

    // Stage 3: Completed (100%)
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

    app_handle.emit("transcription:completed", &result)
        .map_err(|e| format!("Erreur d'émission d'événement de complétion: {}", e))?;

    // Cleanup temporary WAV file
    if let Err(e) = tokio::fs::remove_file(&audio_path).await {
        tracing::warn!(
            event = "cleanup_failed",
            audio_path = %audio_path.display(),
            error = %e,
        );
    }

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

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

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
#[tauri::command]
pub async fn get_transcript(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<Option<FullTranscript>, String> {
    tracing::info!(
        event = "get_transcript_command",
        project_id = %project_id,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    let transcript = match app_state.transcript_repository.find_by_project_id(&project_id) {
        Ok(Some(t)) => t,
        Ok(None) => return Ok(None),
        Err(e) => {
            tracing::error!(event = "get_transcript_failed", error = %e);
            return Err(format!("Erreur lors de la récupération du transcript: {}", e));
        }
    };

    let words = match app_state.transcript_repository.find_words_by_transcript_id(&transcript.id) {
        Ok(w) => w,
        Err(e) => {
            tracing::error!(event = "get_transcript_words_failed", error = %e);
            return Err(format!("Erreur lors de la récupération des mots: {}", e));
        }
    };

    Ok(Some(FullTranscript { transcript, words }))
}

/// Cancel an ongoing transcription
#[tauri::command]
pub async fn cancel_transcription(
    video_id: String,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(
        event = "cancel_transcription_command",
        video_id = %video_id,
    );

    if video_id.trim().is_empty() {
        return Err("L'identifiant vidéo ne peut pas être vide".to_string());
    }

    if let Some(flag) = app_state.get_cancel_flag(&video_id) {
        flag.store(true, Ordering::Relaxed);
        tracing::info!(event = "cancel_transcription_flagged", video_id = %video_id);
    }

    Ok(())
}

/// Clean up old temporary audio files on app startup
pub fn cleanup_temp_directory() {
    let temp_dir = match dirs::home_dir() {
        Some(home) => home.join(".splice").join("temp"),
        None => return,
    };

    if !temp_dir.exists() {
        return;
    }

    tracing::info!(event = "temp_cleanup_started", temp_dir = %temp_dir.display());

    match std::fs::read_dir(&temp_dir) {
        Ok(entries) => {
            let mut cleaned = 0;
            for entry in entries.flatten() {
                if let Ok(ft) = entry.file_type() {
                    if ft.is_file() {
                        if entry.path().extension().map(|e| e == "wav").unwrap_or(false) {
                            if std::fs::remove_file(entry.path()).is_ok() {
                                cleaned += 1;
                            }
                        }
                    }
                }
            }
            tracing::info!(event = "temp_cleanup_completed", cleaned_files = cleaned);
        }
        Err(e) => {
            tracing::error!(event = "temp_cleanup_failed", error = %e);
        }
    }
}
