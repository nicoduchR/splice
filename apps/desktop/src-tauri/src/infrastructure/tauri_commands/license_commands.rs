use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, State};
use ts_rs::TS;

use crate::application::use_cases::{
    CheckGracePeriodUseCase, GetLicenseStatusUseCase, GracePeriodStatus, LicenseStatus,
    UpdateLicenseCacheUseCase, VerifyLicenseOnlineUseCase, VerifyLicenseResult,
};
use crate::domain::ports::{LicenseApiClient, SecureCredentialStore};
use crate::domain::value_objects::LicensePlan;
use crate::infrastructure::adapters::{
    HttpLicenseApiClient, SqliteLicenseRepository,
};
use crate::infrastructure::config::app_state::AppState;

#[cfg(target_os = "macos")]
use crate::infrastructure::adapters::MacOSCredentialStore;

#[cfg(target_os = "windows")]
use crate::infrastructure::adapters::WindowsCredentialStore;

const LICENSE_KEY_CREDENTIAL: &str = "license_key";

/// Validate license key format: SPLICE-XXXX-XXXX-XXXX (16 alphanumeric chars after prefix)
fn validate_license_key_format(key: &str) -> Result<(), String> {
    // Expected format: SPLICE-XXXX-XXXX-XXXX where X is alphanumeric
    let parts: Vec<&str> = key.split('-').collect();

    if parts.len() != 4 {
        return Err("Format de clé invalide. Attendu: SPLICE-XXXX-XXXX-XXXX".to_string());
    }

    if parts[0] != "SPLICE" {
        return Err("La clé doit commencer par 'SPLICE-'".to_string());
    }

    for (i, part) in parts[1..].iter().enumerate() {
        if part.len() != 4 {
            return Err(format!("Le segment {} doit contenir 4 caractères", i + 2));
        }
        if !part.chars().all(|c| c.is_ascii_alphanumeric()) {
            return Err(format!("Le segment {} ne doit contenir que des lettres et chiffres", i + 2));
        }
    }

    Ok(())
}

/// Tauri event payloads
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct LicenseVerifiedEvent {
    pub plan: String,
    pub expires_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct LicenseExpiredEvent {
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct LicenseGraceWarningEvent {
    pub days_remaining: i64,
    pub message: String,
}

/// Get the platform-specific credential store
#[cfg(target_os = "macos")]
fn get_credential_store() -> impl SecureCredentialStore {
    MacOSCredentialStore::new()
}

#[cfg(target_os = "windows")]
fn get_credential_store() -> impl SecureCredentialStore {
    WindowsCredentialStore::new()
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn get_credential_store() -> impl SecureCredentialStore {
    // Fallback for other platforms (returns error on all operations)
    MacOSCredentialStore::new()
}

/// Store license key in secure credential storage (Keychain/Credential Manager)
/// Validates the key format before storing.
#[tauri::command]
pub fn store_license_key(license_key: String) -> Result<(), String> {
    // Validate format before storing
    validate_license_key_format(&license_key)?;

    let store = get_credential_store();
    store
        .store(LICENSE_KEY_CREDENTIAL, &license_key)
        .map_err(|e| e.to_string())
}

/// Get license key from secure credential storage
#[tauri::command]
pub fn get_license_key() -> Result<Option<String>, String> {
    let store = get_credential_store();
    store
        .retrieve(LICENSE_KEY_CREDENTIAL)
        .map_err(|e| e.to_string())
}

/// Delete license key from secure credential storage
#[tauri::command]
pub fn delete_license_key() -> Result<(), String> {
    let store = get_credential_store();
    store
        .delete(LICENSE_KEY_CREDENTIAL)
        .map_err(|e| e.to_string())
}

/// Verify license online with backend API
#[tauri::command]
pub async fn verify_license(
    license_key: String,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<VerifyLicenseResult, String> {
    let pool = state.db_pool.clone();
    let repo = Arc::new(SqliteLicenseRepository::new(pool));
    let api_client = Arc::new(HttpLicenseApiClient::new());
    let use_case = VerifyLicenseOnlineUseCase::new(repo, api_client);

    let result = use_case
        .execute(&license_key)
        .await
        .map_err(|e| e.to_string())?;

    // Emit events based on result
    if result.is_valid {
        let _ = app.emit(
            "license:verified",
            LicenseVerifiedEvent {
                plan: result.plan.to_string(),
                expires_at: result.expires_at,
            },
        );
    }

    Ok(result)
}

/// Check grace period validity
#[tauri::command]
pub async fn check_grace_period(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<GracePeriodStatus, String> {
    let pool = state.db_pool.clone();
    let repo = Arc::new(SqliteLicenseRepository::new(pool));
    let use_case = CheckGracePeriodUseCase::new(repo);

    let status = use_case.execute().await.map_err(|e| e.to_string())?;

    // Emit warning if grace period is about to expire (3 days or less)
    if status.is_valid && status.days_remaining <= 3 && status.days_remaining > 0 {
        let _ = app.emit(
            "license:grace_warning",
            LicenseGraceWarningEvent {
                days_remaining: status.days_remaining,
                message: format!(
                    "Connexion requise dans {} jours pour vérifier la licence",
                    status.days_remaining
                ),
            },
        );
    }

    // Emit expired event if grace period is no longer valid
    if !status.is_valid && status.has_been_verified {
        let _ = app.emit(
            "license:expired",
            LicenseExpiredEvent {
                message: "Grace period expired, verification required".to_string(),
            },
        );
    }

    Ok(status)
}

/// Get complete license status
#[tauri::command]
pub async fn get_license_status(state: State<'_, AppState>) -> Result<LicenseStatus, String> {
    let pool = state.db_pool.clone();
    let repo = Arc::new(SqliteLicenseRepository::new(pool));
    let use_case = GetLicenseStatusUseCase::new(repo);

    use_case.execute().await.map_err(|e| e.to_string())
}

/// Update license cache (for manual cache updates)
#[tauri::command]
pub async fn update_license_cache(
    plan: String,
    expires_at: Option<i64>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pool = state.db_pool.clone();
    let repo = Arc::new(SqliteLicenseRepository::new(pool));
    let use_case = UpdateLicenseCacheUseCase::new(repo);

    let plan = LicensePlan::from(plan.as_str());
    use_case
        .execute(plan, expires_at)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Clear license (reset to free plan and delete stored key)
#[tauri::command]
pub async fn clear_license(state: State<'_, AppState>) -> Result<(), String> {
    // Delete from secure storage
    let store = get_credential_store();
    let _ = store.delete(LICENSE_KEY_CREDENTIAL); // Ignore errors

    // Reset cache to free plan
    let pool = state.db_pool.clone();
    let repo = Arc::new(SqliteLicenseRepository::new(pool));
    let use_case = UpdateLicenseCacheUseCase::new(repo);
    use_case.reset().await.map_err(|e| e.to_string())?;

    tracing::info!("License cleared successfully");
    Ok(())
}

/// Result type for redeem early adopter code command
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct RedeemEarlyAdopterResult {
    pub success: bool,
    #[serde(default)]
    pub data: Option<RedeemEarlyAdopterDataResult>,
    #[serde(default)]
    pub error: Option<RedeemEarlyAdopterError>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct RedeemEarlyAdopterDataResult {
    pub license_key: String,
    pub plan: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct RedeemEarlyAdopterError {
    pub code: String,
    pub message: String,
}

/// Redeem an early adopter code for lifetime Pro access
#[tauri::command]
pub async fn redeem_early_adopter_code(
    code: String,
    email: String,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<RedeemEarlyAdopterResult, String> {
    // Validate code format
    validate_license_key_format(&code)?;

    let api_client = HttpLicenseApiClient::new();

    match api_client.redeem_early_adopter_code(&code, &email).await {
        Ok(data) => {
            // Store the license key in secure storage
            let store = get_credential_store();
            if let Err(e) = store.store(LICENSE_KEY_CREDENTIAL, &data.license_key) {
                tracing::warn!("Failed to store license key in credential store: {}", e);
            }

            // Update local license cache
            let pool = state.db_pool.clone();
            let repo = Arc::new(SqliteLicenseRepository::new(pool));
            let use_case = UpdateLicenseCacheUseCase::new(repo);

            if let Err(e) = use_case.execute(LicensePlan::Pro, None).await {
                tracing::warn!("Failed to update license cache: {}", e);
            }

            // Emit license verified event
            let _ = app.emit(
                "license:verified",
                LicenseVerifiedEvent {
                    plan: "pro".to_string(),
                    expires_at: None, // Lifetime
                },
            );

            tracing::info!("Early adopter code redeemed successfully for {}", email);

            Ok(RedeemEarlyAdopterResult {
                success: true,
                data: Some(RedeemEarlyAdopterDataResult {
                    license_key: data.license_key,
                    plan: data.plan,
                    expires_at: data.expires_at,
                }),
                error: None,
            })
        }
        Err(e) => {
            let (code_str, message) = match e {
                crate::domain::ports::LicenseApiError::EarlyAdopterCodeInvalid => {
                    ("EARLY_ADOPTER_CODE_INVALID", "Le code early adopter n'existe pas")
                }
                crate::domain::ports::LicenseApiError::EarlyAdopterCodeAlreadyUsed => {
                    ("EARLY_ADOPTER_CODE_ALREADY_USED", "Ce code a déjà été utilisé")
                }
                crate::domain::ports::LicenseApiError::EarlyAdopterCodeExpired => {
                    ("EARLY_ADOPTER_CODE_EXPIRED", "Ce code n'est plus valide")
                }
                crate::domain::ports::LicenseApiError::NetworkError(ref msg) => {
                    tracing::error!("Network error during code redemption: {}", msg);
                    ("NETWORK_ERROR", "Erreur de connexion. Vérifiez votre connexion internet.")
                }
                crate::domain::ports::LicenseApiError::Timeout => {
                    ("TIMEOUT", "Le serveur ne répond pas. Réessayez plus tard.")
                }
                _ => {
                    tracing::error!("Unexpected error during code redemption: {:?}", e);
                    ("INTERNAL_ERROR", "Une erreur inattendue s'est produite")
                }
            };

            Ok(RedeemEarlyAdopterResult {
                success: false,
                data: None,
                error: Some(RedeemEarlyAdopterError {
                    code: code_str.to_string(),
                    message: message.to_string(),
                }),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_license_key_credential_constant() {
        assert_eq!(LICENSE_KEY_CREDENTIAL, "license_key");
    }

    #[test]
    fn test_validate_license_key_format_valid() {
        assert!(validate_license_key_format("SPLICE-ABCD-1234-EFGH").is_ok());
        assert!(validate_license_key_format("SPLICE-0000-0000-0000").is_ok());
        assert!(validate_license_key_format("SPLICE-abcd-1234-efgh").is_ok());
    }

    #[test]
    fn test_validate_license_key_format_invalid_prefix() {
        let result = validate_license_key_format("WRONG-ABCD-1234-EFGH");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("SPLICE-"));
    }

    #[test]
    fn test_validate_license_key_format_wrong_segment_count() {
        assert!(validate_license_key_format("SPLICE-ABCD-1234").is_err());
        assert!(validate_license_key_format("SPLICE-ABCD-1234-EFGH-IJKL").is_err());
        assert!(validate_license_key_format("SPLICE").is_err());
    }

    #[test]
    fn test_validate_license_key_format_wrong_segment_length() {
        assert!(validate_license_key_format("SPLICE-ABC-1234-EFGH").is_err());
        assert!(validate_license_key_format("SPLICE-ABCDE-1234-EFGH").is_err());
    }

    #[test]
    fn test_validate_license_key_format_invalid_chars() {
        assert!(validate_license_key_format("SPLICE-AB!D-1234-EFGH").is_err());
        assert!(validate_license_key_format("SPLICE-AB D-1234-EFGH").is_err());
    }
}
