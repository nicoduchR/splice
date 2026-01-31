use tauri::{AppHandle, Emitter};
use serde::Serialize;
use std::path::PathBuf;
use crate::domain::entities::transcription::TranscriptionResult;
use crate::infrastructure::adapters::{AudioExtractor, ParakeetTranscriptionService};
use crate::application::ports::transcription_service::TranscriptionService;

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
) -> Result<TranscriptionResult, String> {
    tracing::info!(
        event = "transcribe_video_command",
        video_id = %video_id,
        video_path = %video_path,
    );

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

    AudioExtractor::extract_audio(&PathBuf::from(&video_path), &audio_path)
        .await
        .map_err(|e| format!("Erreur d'extraction audio: {}", e))?;

    // Stage 2: Load audio (40%)
    emit_progress(
        &app_handle,
        &video_id,
        "loading",
        PROGRESS_LOADING,
        "Chargement de l'audio en mémoire...",
    )
    .map_err(|e| format!("Erreur d'émission d'événement: {}", e))?;

    let (audio_samples, sample_rate, channels) =
        AudioExtractor::load_wav_as_f32(&audio_path)
            .map_err(|e| format!("Erreur de lecture du fichier WAV: {}", e))?;

    tracing::info!(
        event = "audio_loaded",
        sample_count = audio_samples.len(),
        sample_rate = sample_rate,
        channels = channels,
    );

    // Stage 3: Transcription (60%)
    emit_progress(
        &app_handle,
        &video_id,
        "transcribing",
        PROGRESS_TRANSCRIBING,
        "Transcription en cours (CPU)...",
    )
    .map_err(|e| format!("Erreur d'émission d'événement: {}", e))?;

    let service = ParakeetTranscriptionService;
    let result = service
        .transcribe_audio(audio_samples, sample_rate, channels, video_id.clone())
        .await
        .map_err(|e| format!("Erreur de transcription: {}", e))?;

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
