// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Declare modules
mod domain;
mod application;
mod infrastructure;

use infrastructure::config::{database, app_state::AppState};
use infrastructure::tauri_commands::{video_commands, license_commands, model_commands, transcription_commands, selection_commands, proxy_commands, cut_commands, segmentation_commands, preview_commands, export_commands, update_commands, rollback_commands, project_state_commands, logging_commands, disk_commands, preferences_commands};
use domain::entities::CrashTracker;
use application::use_cases::{BackupCurrentVersionUseCase, RestoreBackupUseCase};
use tauri::Emitter;
use tauri::Manager;

#[tokio::main]
async fn main() {
    // Initialize logging (from Story 1.2)
    tracing_subscriber::fmt::init();

    tracing::info!("Starting Splice application");

    // Initialize database with migrations
    let db_pool = database::init_database()
        .await
        .expect("Failed to initialize database");

    // Create application state
    let app_state = AppState::new(db_pool);

    // Cleanup old temporary transcription files on startup (uses configured temp dir)
    let temp_dir = app_state.resolve_temp_dir();
    transcription_commands::cleanup_temp_directory(&temp_dir);

    // Story 9.4: Cleanup orphaned temp files from previous crashed sessions
    {
        let cleanup_use_case = application::use_cases::CleanupTempFilesUseCase::new();
        match cleanup_use_case.execute(&temp_dir) {
            Ok(bytes_freed) => {
                if bytes_freed > 0 {
                    tracing::info!(
                        event = "startup_temp_cleanup",
                        bytes_freed = bytes_freed,
                        "Cleaned up orphaned temp files at startup"
                    );
                }
            }
            Err(e) => {
                tracing::warn!("Failed to cleanup temp files at startup: {}", e);
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(app_state)
        .setup(|app| {
            // --- Crash detection and rollback logic (Story 8.3, Task 4) ---
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data dir");
            let tracker_path = app_data_dir.join("crash-tracker.json");

            // 4.1: Load crash-tracker.json
            let mut tracker = CrashTracker::load_from_file(&tracker_path);
            tracing::info!("Crash tracker loaded: {} consecutive crashes, needs_rollback={}", tracker.consecutive_crashes, tracker.needs_rollback);

            // H5 fix: Check if a rollback was just completed (from a previous restart).
            // Emit the notification event now that the frontend is loading.
            if let Some((from_version, to_version)) = tracker.take_rollback_completed() {
                tracing::info!("Previous rollback detected: v{} → v{}, emitting notification", from_version, to_version);
                if let Err(e) = tracker.save_to_file(&tracker_path) {
                    tracing::warn!("Failed to save crash tracker after consuming rollback info: {}", e);
                }
                let app_handle_for_event = app.handle().clone();
                let event = rollback_commands::RollbackCompletedEvent {
                    previous_version: from_version,
                    restored_version: to_version,
                };
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                    let _ = app_handle_for_event.emit("rollback:completed", event);
                });
            }

            // 4.3: If needs_rollback, restore backup automatically
            if tracker.needs_rollback {
                tracing::warn!("Rollback needed — attempting to restore previous version");
                let restore_use_case = RestoreBackupUseCase::new();
                match restore_use_case.execute(&app_data_dir) {
                    Ok(restored_version) => {
                        let previous_version = tracker.previous_version.clone().unwrap_or_default();
                        tracing::info!("Rollback successful: restored v{}", restored_version);
                        tracker.clear_rollback();
                        // H5 fix: Save rollback completion info and restart to run the restored binary.
                        tracker.set_rollback_completed(previous_version, restored_version);
                        if let Err(e) = tracker.save_to_file(&tracker_path) {
                            tracing::warn!("Failed to save crash tracker after rollback: {}", e);
                        }
                        // Restart so the restored (old) binary is loaded from disk.
                        // The rollback notification will be emitted on next startup
                        // when take_rollback_completed() returns the saved info.
                        app.handle().restart();
                    }
                    Err(e) => {
                        tracing::error!("Rollback failed: {}. Clearing rollback flag to avoid infinite loop.", e);
                        tracker.clear_rollback();
                        if let Err(e) = tracker.save_to_file(&tracker_path) {
                            tracing::warn!("Failed to save crash tracker after failed rollback: {}", e);
                        }
                    }
                }
            } else {
                // 4.2: Increment crash counter at startup
                let needs_rollback = tracker.record_crash();
                if let Err(e) = tracker.save_to_file(&tracker_path) {
                    tracing::warn!("Failed to save crash tracker: {}", e);
                }

                if needs_rollback {
                    tracing::warn!("Crash threshold reached ({} crashes) — rollback will trigger on next startup", tracker.consecutive_crashes);
                }
            }

            // Update AppState with loaded crash tracker
            {
                let state = app.state::<AppState>();
                let mut state_tracker = state.crash_tracker.lock().unwrap();
                *state_tracker = tracker;
            }

            // 4.5: After 30 seconds, reset crash counter (healthy startup)
            let app_handle_healthy = app.handle().clone();
            let tracker_path_healthy = tracker_path.clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
                if let Some(state) = app_handle_healthy.try_state::<AppState>() {
                    let mut tracker = state.crash_tracker.lock().unwrap();
                    tracker.mark_healthy();
                    if let Err(e) = tracker.save_to_file(&tracker_path_healthy) {
                        tracing::warn!("Failed to save crash tracker after healthy mark: {}", e);
                    }
                    tracing::info!("App running > 30s — crash counter reset (healthy)");
                }
            });

            // Story 9.2: Check for dirty shutdown and emit recovery event
            {
                let state = app.state::<AppState>();
                let check_use_case = application::use_cases::CheckDirtyShutdownUseCase::new(
                    state.project_state_repository.clone(),
                );
                match check_use_case.execute() {
                    Ok(is_dirty) => {
                        if is_dirty {
                            tracing::info!("Dirty shutdown detected — frontend will show recovery dialog");
                            // The frontend will call check_dirty_shutdown on startup
                            // and show the CrashRecoveryDialog if needed
                        } else {
                            tracing::debug!("Clean shutdown confirmed (or no previous project state)");
                        }
                    }
                    Err(e) => {
                        tracing::warn!("Failed to check dirty shutdown: {}", e);
                    }
                }

                // Reset was_clean_shutdown = 0 for the current session
                // This ensures that if we crash during this session, we detect it on next startup
                let reset_use_case = application::use_cases::ResetCleanShutdownUseCase::new(
                    state.project_state_repository.clone(),
                );
                let _ = reset_use_case.execute();
            }

            // Clone Arc-wrapped cancel flags for idle detection in periodic checks
            let transcription_flags = app.state::<AppState>().transcription_cancel_flags.clone();
            let export_flags = app.state::<AppState>().export_cancel_flags.clone();
            let segmentation_flags = app.state::<AppState>().segmentation_cancel_flags.clone();

            // Spawn background task for startup update check
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // Small delay to let the app initialize
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

                tracing::info!("Performing startup update check...");

                // Helper to emit update available event
                let emit_update = |handle: &tauri::AppHandle, info: &crate::domain::entities::UpdateInfo| {
                    let _ = handle.emit(
                        "update:available",
                        update_commands::UpdateAvailableEvent {
                            version: info.version.clone(),
                            release_notes: info.release_notes.clone(),
                            is_mandatory: info.is_mandatory,
                        },
                    );
                };

                // Check for updates silently on startup
                let use_case = application::use_cases::CheckForUpdateUseCase::new();
                let mut startup_succeeded = false;
                match use_case.execute(&app_handle).await {
                    Ok(result) => {
                        startup_succeeded = true;
                        if let Some(ref info) = result.update_info {
                            tracing::info!("Update available on startup: {}", info.version);
                            emit_update(&app_handle, info);
                        } else {
                            tracing::debug!("No update available on startup");
                        }
                    }
                    Err(e) => {
                        tracing::debug!("Startup update check failed (silent): {}", e);
                    }
                }

                // Retry with exponential backoff if startup check failed (AC6)
                if !startup_succeeded {
                    let backoff_delays = [5u64, 15, 45, 120];
                    for delay in &backoff_delays {
                        tokio::time::sleep(tokio::time::Duration::from_secs(*delay)).await;
                        tracing::debug!("Retrying update check (backoff: {}s)...", delay);
                        let use_case = application::use_cases::CheckForUpdateUseCase::new();
                        match use_case.execute(&app_handle).await {
                            Ok(result) => {
                                if let Some(ref info) = result.update_info {
                                    tracing::info!("Update found on retry: {}", info.version);
                                    emit_update(&app_handle, info);
                                }
                                break; // Success, stop retrying
                            }
                            Err(e) => {
                                tracing::debug!("Update retry failed ({}s backoff): {}", delay, e);
                            }
                        }
                    }
                }

                // Schedule periodic update checks (every 6 hours)
                let periodic_app_handle = app_handle.clone();
                loop {
                    tokio::time::sleep(tokio::time::Duration::from_secs(6 * 60 * 60)).await;

                    // Skip if app is busy: active transcription, export, or segmentation (AC7)
                    {
                        let is_transcribing = !transcription_flags.lock().unwrap().is_empty();
                        let is_exporting = !export_flags.lock().unwrap().is_empty();
                        let is_segmenting = !segmentation_flags.lock().unwrap().is_empty();
                        if is_transcribing || is_exporting || is_segmenting {
                            tracing::debug!("Skipping periodic update check: app is busy");
                            continue;
                        }
                    }

                    tracing::debug!("Performing periodic update check...");
                    let use_case = application::use_cases::CheckForUpdateUseCase::new();
                    if let Ok(result) = use_case.execute(&periodic_app_handle).await {
                        if let Some(ref info) = result.update_info {
                            tracing::info!("Periodic update check found: {}", info.version);
                            emit_update(&periodic_app_handle, info);
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            video_commands::get_video_info,
            video_commands::save_video_project,
            video_commands::load_all_projects,
            video_commands::import_video,
            license_commands::verify_license,
            license_commands::check_grace_period,
            license_commands::store_license_key,
            license_commands::get_license_key,
            license_commands::delete_license_key,
            license_commands::get_license_status,
            license_commands::update_license_cache,
            license_commands::clear_license,
            license_commands::redeem_early_adopter_code,
            model_commands::check_model_status,
            model_commands::download_parakeet_model,
            model_commands::cancel_model_download,
            transcription_commands::transcribe_video,
            transcription_commands::cancel_transcription,
            transcription_commands::save_transcript,
            transcription_commands::get_transcript,
            selection_commands::save_selections,
            selection_commands::get_selections,
            selection_commands::clear_selections,
            proxy_commands::generate_proxy,
            cut_commands::generate_cuts,
            cut_commands::get_cuts,
            cut_commands::clear_cuts,
            segmentation_commands::segment_video,
            segmentation_commands::cancel_segmentation,
            segmentation_commands::cleanup_segments,
            preview_commands::prepare_preview,
            preview_commands::invalidate_preview_cache,
            preview_commands::get_segment_boundaries,
            export_commands::estimate_export,
            export_commands::export_video,
            export_commands::cancel_export,
            export_commands::open_file,
            export_commands::show_in_folder,
            update_commands::check_for_update,
            update_commands::download_update,
            update_commands::cancel_update_download,
            update_commands::get_update_status,
            update_commands::install_update,
            update_commands::set_install_on_quit,
            update_commands::get_install_on_quit,
            rollback_commands::get_backup_info,
            rollback_commands::manual_rollback,
            rollback_commands::get_crash_count,
            rollback_commands::send_crash_report,
            project_state_commands::save_project_state,
            project_state_commands::load_project_state,
            project_state_commands::mark_clean_shutdown,
            project_state_commands::check_dirty_shutdown,
            logging_commands::log_frontend_error,
            disk_commands::check_disk_space,
            disk_commands::check_disk_space_for_import,
            disk_commands::get_cache_size,
            disk_commands::clear_cache,
            preferences_commands::get_preference,
            preferences_commands::set_preference,
            preferences_commands::get_all_preferences,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let app_handle = window.app_handle();
                if let Some(state) = app_handle.try_state::<AppState>() {
                    // Story 9.2: Mark clean shutdown BEFORE install_on_quit check
                    let mark_use_case = application::use_cases::MarkCleanShutdownUseCase::new(
                        state.project_state_repository.clone(),
                    );
                    if let Err(e) = mark_use_case.execute() {
                        tracing::warn!("Failed to mark clean shutdown: {}", e);
                    } else {
                        tracing::info!("Clean shutdown marked in project_state");
                    }

                    if state.get_install_on_quit() {
                        tracing::info!("Install on quit enabled — backing up before update");

                        // 4.6: Backup current version before install-on-quit
                        if let Ok(app_data_dir) = app_handle.path().app_data_dir() {
                            let current_version = app_handle.package_info().version.to_string();
                            let backup_use_case = BackupCurrentVersionUseCase::new();
                            match backup_use_case.execute(&app_data_dir, &current_version) {
                                Ok(_) => {
                                    tracing::info!("Backup created before install-on-quit");
                                    // Update crash tracker with previous version
                                    let mut tracker = state.crash_tracker.lock().unwrap();
                                    tracker.set_previous_version(current_version);
                                    let tracker_path = app_data_dir.join("crash-tracker.json");
                                    if let Err(e) = tracker.save_to_file(&tracker_path) {
                                        tracing::warn!("Failed to save crash tracker: {}", e);
                                    }
                                }
                                Err(e) => {
                                    tracing::warn!("Backup failed before install-on-quit (continuing anyway): {}", e);
                                }
                            }
                        }

                        tracing::info!("Restarting to apply update");
                        app_handle.restart();
                    }
                }
            } else if let tauri::WindowEvent::DragDrop(tauri::DragDropEvent::Drop { paths, position: _ }) = event {
                tracing::info!("Files dropped: {:?}", paths);
                if !paths.is_empty() {
                    let path = paths[0].to_string_lossy().to_string();
                    let _ = window.emit("tauri://file-drop", vec![path]);
                }
            } else if let tauri::WindowEvent::DragDrop(tauri::DragDropEvent::Over { position: _ }) = event {
                tracing::info!("Files hovering");
                let _ = window.emit("tauri://file-drop-hover", ());
            } else if let tauri::WindowEvent::DragDrop(tauri::DragDropEvent::Leave) = event {
                tracing::info!("File drop cancelled");
                let _ = window.emit("tauri://file-drop-cancelled", ());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
