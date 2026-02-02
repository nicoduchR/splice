use tauri::{AppHandle, Emitter, State};
use serde::Serialize;
use crate::infrastructure::adapters::proxy_generator::ProxyGenerator;
use crate::infrastructure::config::app_state::AppState;

/// Proxy progress event payload
#[derive(Clone, Serialize)]
pub struct ProxyProgress {
    pub project_id: String,
    pub progress: f64,
    pub message: String,
}

/// Proxy completed event payload
#[derive(Clone, Serialize)]
pub struct ProxyCompleted {
    pub project_id: String,
    pub proxy_path: String,
}

/// Proxy failed event payload
#[derive(Clone, Serialize)]
pub struct ProxyFailed {
    pub project_id: String,
    pub message: String,
}

/// Generate a 720p proxy video for smooth playback (standalone command)
#[tauri::command]
pub async fn generate_proxy<R: tauri::Runtime>(
    video_id: String,
    video_path: String,
    width: u32,
    height: u32,
    app_handle: AppHandle<R>,
    app_state: State<'_, AppState>,
) -> Result<Option<String>, String> {
    tracing::info!(
        event = "generate_proxy_command",
        video_id = %video_id,
        video_path = %video_path,
        width = width,
        height = height,
    );

    if video_id.trim().is_empty() {
        return Err("L'identifiant vidéo ne peut pas être vide".to_string());
    }

    let video_path_buf = std::path::PathBuf::from(&video_path);
    if !video_path_buf.exists() {
        return Err(format!("Le fichier vidéo n'existe pas: {}", video_path));
    }

    // Emit initial progress
    let _ = app_handle.emit("proxy:progress", ProxyProgress {
        project_id: video_id.clone(),
        progress: 0.0,
        message: "Démarrage de la génération du proxy...".to_string(),
    });

    let app_data_dir = dirs::home_dir()
        .ok_or("Impossible de trouver le répertoire home")?
        .join(".splice");

    let result = ProxyGenerator::generate_proxy(
        &video_path_buf,
        &video_id,
        Some(width),
        Some(height),
        &app_data_dir,
    )
    .await?;

    match &result {
        Some(proxy_path) => {
            let proxy_path_str = proxy_path.to_string_lossy().to_string();

            // Save proxy_path to database
            if let Ok(Some(mut project)) = app_state.video_repository.find_by_id(&video_id) {
                project.proxy_path = Some(proxy_path_str.clone());
                let _ = app_state.video_repository.save(project);
            }

            let _ = app_handle.emit("proxy:progress", ProxyProgress {
                project_id: video_id.clone(),
                progress: 1.0,
                message: "Proxy vidéo prêt".to_string(),
            });

            let _ = app_handle.emit("proxy:completed", ProxyCompleted {
                project_id: video_id.clone(),
                proxy_path: proxy_path_str.clone(),
            });

            Ok(Some(proxy_path_str))
        }
        None => {
            let _ = app_handle.emit("proxy:progress", ProxyProgress {
                project_id: video_id.clone(),
                progress: 1.0,
                message: "Proxy non nécessaire ou échoué".to_string(),
            });

            Ok(None)
        }
    }
}
