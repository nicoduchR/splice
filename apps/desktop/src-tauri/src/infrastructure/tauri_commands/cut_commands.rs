use tauri::State;
use crate::domain::entities::cut::Cut;
use crate::infrastructure::config::app_state::AppState;
use crate::application::use_cases::generate_cuts::GenerateCutsUseCase;

/// Generate cuts from text selections for a project
#[tauri::command]
pub async fn generate_cuts(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<Vec<Cut>, String> {
    tracing::info!(
        event = "generate_cuts_command",
        project_id = %project_id,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    let use_case = GenerateCutsUseCase::new(
        app_state.selection_repository.clone(),
        app_state.cut_repository.clone(),
    );

    use_case.execute(&project_id).map_err(|e| {
        tracing::error!(event = "generate_cuts_failed", error = %e);
        format!("Erreur lors de la génération des cuts: {}", e)
    })
}

/// Load all cuts for a project
#[tauri::command]
pub async fn get_cuts(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<Vec<Cut>, String> {
    tracing::info!(
        event = "get_cuts_command",
        project_id = %project_id,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    app_state.cut_repository.get_cuts(&project_id).map_err(|e| {
        tracing::error!(event = "get_cuts_failed", error = %e);
        format!("Erreur lors de la récupération des cuts: {}", e)
    })
}

/// Delete all cuts for a project
#[tauri::command]
pub async fn clear_cuts(
    project_id: String,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    tracing::info!(
        event = "clear_cuts_command",
        project_id = %project_id,
    );

    if project_id.trim().is_empty() {
        return Err("L'identifiant du projet ne peut pas être vide".to_string());
    }

    app_state.cut_repository.delete_cuts(&project_id).map_err(|e| {
        tracing::error!(event = "clear_cuts_failed", error = %e);
        format!("Erreur lors de la suppression des cuts: {}", e)
    })
}
