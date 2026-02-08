use tauri::State;
use crate::domain::entities::project_state::ProjectState;
use crate::infrastructure::config::app_state::AppState;
use crate::application::use_cases::project_state_use_cases::{
    SaveProjectStateUseCase, LoadProjectStateUseCase, MarkCleanShutdownUseCase, CheckDirtyShutdownUseCase,
};

/// Save or update the project state (auto-save)
#[tauri::command]
pub async fn save_project_state(
    state: ProjectState,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(
        event = "save_project_state_command",
        project_id = ?state.project_id,
    );

    let use_case = SaveProjectStateUseCase::new(app_state.project_state_repository.clone());

    use_case.execute(&state).map_err(|e| {
        tracing::error!(event = "save_project_state_failed", error = %e);
        format!("Erreur lors de la sauvegarde de l'état du projet: {}", e)
    })
}

/// Load the current project state
#[tauri::command]
pub async fn load_project_state(
    app_state: State<'_, AppState>,
) -> Result<Option<ProjectState>, String> {
    tracing::info!(event = "load_project_state_command");

    let use_case = LoadProjectStateUseCase::new(app_state.project_state_repository.clone());

    use_case.execute().map_err(|e| {
        tracing::error!(event = "load_project_state_failed", error = %e);
        format!("Erreur lors du chargement de l'état du projet: {}", e)
    })
}

/// Mark the current shutdown as clean
#[tauri::command]
pub async fn mark_clean_shutdown(
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(event = "mark_clean_shutdown_command");

    let use_case = MarkCleanShutdownUseCase::new(app_state.project_state_repository.clone());

    use_case.execute().map_err(|e| {
        tracing::error!(event = "mark_clean_shutdown_failed", error = %e);
        format!("Erreur lors du marquage de la fermeture propre: {}", e)
    })
}

/// Check if the last shutdown was dirty (crash detected)
#[tauri::command]
pub async fn check_dirty_shutdown(
    app_state: State<'_, AppState>,
) -> Result<bool, String> {
    tracing::info!(event = "check_dirty_shutdown_command");

    let use_case = CheckDirtyShutdownUseCase::new(app_state.project_state_repository.clone());

    use_case.execute().map_err(|e| {
        tracing::error!(event = "check_dirty_shutdown_failed", error = %e);
        format!("Erreur lors de la vérification du shutdown: {}", e)
    })
}
