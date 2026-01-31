use crate::domain::entities::VideoProject;
use crate::infrastructure::config::app_state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_video_info(
    project_id: String,
    state: State<AppState>
) -> Result<VideoProject, String> {
    state.video_repository
        .find_by_id(&project_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Project not found: {}", project_id))
}

#[tauri::command]
pub fn save_video_project(
    project: VideoProject,
    state: State<AppState>
) -> Result<VideoProject, String> {
    state.video_repository
        .save(project)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_all_projects(
    state: State<AppState>
) -> Result<Vec<VideoProject>, String> {
    state.video_repository
        .find_all()
        .map_err(|e| e.to_string())
}

/// Import video command - placeholder for Story 1.4 implementation
/// Story 1.3 only sets up state management, actual video import is Story 1.4
#[tauri::command]
pub fn import_video(
    file_path: String,
    _state: State<AppState>
) -> Result<VideoProject, String> {
    // TODO: Story 1.4 - Implement actual video import with FFmpeg
    // For now, return error indicating feature not yet implemented
    Err(format!(
        "Video import not yet implemented. Story 1.4 will add FFmpeg integration. File: {}",
        file_path
    ))
}
