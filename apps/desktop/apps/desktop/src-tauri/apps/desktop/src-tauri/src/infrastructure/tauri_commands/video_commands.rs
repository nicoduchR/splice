use crate::application::use_cases::ImportVideoUseCase;
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

#[tauri::command]
pub async fn import_video(
    file_path: String,
    state: State<'_, AppState>
) -> Result<VideoProject, String> {
    let use_case = ImportVideoUseCase::new(state.video_repository.clone());
    use_case.execute(&file_path)
        .await
        .map_err(|e| e.to_string())
}
