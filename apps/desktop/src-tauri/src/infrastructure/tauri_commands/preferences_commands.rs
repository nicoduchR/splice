use serde::{Deserialize, Serialize};
use tauri::State;
use ts_rs::TS;
use crate::infrastructure::config::app_state::AppState;

/// A single preference entry for frontend consumption
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub struct PreferenceEntry {
    pub key: String,
    pub value: String,
}

/// Get a single preference by key. Returns null if not set.
#[tauri::command]
pub fn get_preference(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    state
        .preferences_repository
        .get(&key)
        .map_err(|e| e.to_string())
}

/// Set a preference value (creates or updates).
#[tauri::command]
pub fn set_preference(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    state
        .preferences_repository
        .set(&key, &value)
        .map_err(|e| e.to_string())
}

/// Get all preferences as a list of key-value entries.
#[tauri::command]
pub fn get_all_preferences(
    state: State<'_, AppState>,
) -> Result<Vec<PreferenceEntry>, String> {
    let pairs = state
        .preferences_repository
        .get_all()
        .map_err(|e| e.to_string())?;

    Ok(pairs
        .into_iter()
        .map(|(key, value)| PreferenceEntry { key, value })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_preference_entry_ts_binding() {
        let entry = PreferenceEntry {
            key: "temp_directory".to_string(),
            value: "/custom/path".to_string(),
        };
        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("temp_directory"));
        assert!(json.contains("/custom/path"));
    }
}
