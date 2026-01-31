// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Declare modules
mod domain;
mod application;
mod infrastructure;

use infrastructure::config::{database, app_state::AppState};
use infrastructure::tauri_commands::{video_commands, license_commands};

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

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            video_commands::get_video_info,
            video_commands::save_video_project,
            video_commands::load_all_projects,
            video_commands::import_video,
            license_commands::verify_license,
            license_commands::check_grace_period,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
