// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Declare modules
mod domain;
mod application;
mod infrastructure;

use infrastructure::config::{database, app_state::AppState};
use infrastructure::tauri_commands::{video_commands, license_commands, model_commands, transcription_commands, selection_commands, proxy_commands, cut_commands, segmentation_commands, preview_commands, export_commands, update_commands};
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

    // Cleanup old temporary transcription files on startup
    transcription_commands::cleanup_temp_directory();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(app_state)
        .setup(|app| {
            // Spawn background task for startup update check
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // Small delay to let the app initialize
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

                tracing::info!("Performing startup update check...");

                // Check for updates silently on startup
                let use_case = application::use_cases::CheckForUpdateUseCase::new();
                match use_case.execute(&app_handle).await {
                    Ok(result) => {
                        if let Some(ref info) = result.update_info {
                            tracing::info!("Update available on startup: {}", info.version);

                            // Emit event for frontend to show update notification
                            let _ = app_handle.emit(
                                "update:available",
                                update_commands::UpdateAvailableEvent {
                                    version: info.version.clone(),
                                    release_notes: info.release_notes.clone(),
                                    is_mandatory: info.is_mandatory,
                                },
                            );
                        } else {
                            tracing::debug!("No update available on startup");
                        }
                    }
                    Err(e) => {
                        // Silently log errors - don't bother the user on startup
                        tracing::debug!("Startup update check failed (silent): {}", e);
                    }
                }

                // Schedule periodic update checks (every 6 hours)
                let periodic_app_handle = app_handle.clone();
                loop {
                    tokio::time::sleep(tokio::time::Duration::from_secs(6 * 60 * 60)).await;

                    tracing::debug!("Performing periodic update check...");
                    let use_case = application::use_cases::CheckForUpdateUseCase::new();
                    if let Ok(result) = use_case.execute(&periodic_app_handle).await {
                        if let Some(ref info) = result.update_info {
                            tracing::info!("Periodic update check found: {}", info.version);
                            let _ = periodic_app_handle.emit(
                                "update:available",
                                update_commands::UpdateAvailableEvent {
                                    version: info.version.clone(),
                                    release_notes: info.release_notes.clone(),
                                    is_mandatory: info.is_mandatory,
                                },
                            );
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
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::DragDrop(tauri::DragDropEvent::Drop { paths, position: _ }) = event {
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
