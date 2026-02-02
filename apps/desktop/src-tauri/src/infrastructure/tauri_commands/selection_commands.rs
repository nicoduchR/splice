use tauri::State;
use crate::domain::entities::selection::Selection;
use crate::infrastructure::config::app_state::AppState;
use crate::application::use_cases::selection_use_cases::{
    SaveSelectionsUseCase, GetSelectionsUseCase, ClearSelectionsUseCase,
};

/// Save (replace) all selections for a project
#[tauri::command]
pub async fn save_selections(
    project_id: String,
    selections: Vec<Selection>,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(
        event = "save_selections_command",
        project_id = %project_id,
        count = selections.len(),
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    let use_case = SaveSelectionsUseCase::new(app_state.selection_repository.clone());

    use_case.execute(&project_id, selections).map_err(|e| {
        tracing::error!(event = "save_selections_failed", error = %e);
        format!("Erreur lors de la sauvegarde des sélections: {}", e)
    })
}

/// Load all selections for a project
#[tauri::command]
pub async fn get_selections(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<Vec<Selection>, String> {
    tracing::info!(
        event = "get_selections_command",
        project_id = %project_id,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    let use_case = GetSelectionsUseCase::new(app_state.selection_repository.clone());

    use_case.execute(&project_id).map_err(|e| {
        tracing::error!(event = "get_selections_failed", error = %e);
        format!("Erreur lors de la récupération des sélections: {}", e)
    })
}

/// Delete all selections for a project
#[tauri::command]
pub async fn clear_selections(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(
        event = "clear_selections_command",
        project_id = %project_id,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    let use_case = ClearSelectionsUseCase::new(app_state.selection_repository.clone());

    use_case.execute(&project_id).map_err(|e| {
        tracing::error!(event = "clear_selections_failed", error = %e);
        format!("Erreur lors de la suppression des sélections: {}", e)
    })
}
