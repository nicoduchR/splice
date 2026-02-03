#[cfg(target_os = "windows")]
use keyring::Entry;

use crate::domain::ports::{CredentialError, SecureCredentialStore};

const SERVICE_NAME: &str = "splice";

/// Windows Credential Manager implementation of SecureCredentialStore
pub struct WindowsCredentialStore;

impl WindowsCredentialStore {
    pub fn new() -> Self {
        Self
    }
}

impl Default for WindowsCredentialStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(target_os = "windows")]
impl SecureCredentialStore for WindowsCredentialStore {
    fn store(&self, key: &str, value: &str) -> Result<(), CredentialError> {
        let entry = Entry::new(SERVICE_NAME, key)
            .map_err(|e| CredentialError::PlatformError(e.to_string()))?;

        entry.set_password(value)
            .map_err(|e| CredentialError::StoreFailed(e.to_string()))
    }

    fn retrieve(&self, key: &str) -> Result<Option<String>, CredentialError> {
        let entry = Entry::new(SERVICE_NAME, key)
            .map_err(|e| CredentialError::PlatformError(e.to_string()))?;

        match entry.get_password() {
            Ok(password) => Ok(Some(password)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(CredentialError::PlatformError(e.to_string())),
        }
    }

    fn delete(&self, key: &str) -> Result<(), CredentialError> {
        let entry = Entry::new(SERVICE_NAME, key)
            .map_err(|e| CredentialError::PlatformError(e.to_string()))?;

        match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()), // Idempotent delete
            Err(e) => Err(CredentialError::DeleteFailed(e.to_string())),
        }
    }
}

// Stub implementation for non-Windows platforms (for compilation)
#[cfg(not(target_os = "windows"))]
impl SecureCredentialStore for WindowsCredentialStore {
    fn store(&self, _key: &str, _value: &str) -> Result<(), CredentialError> {
        Err(CredentialError::PlatformError("Windows Credential Manager not available on this platform".to_string()))
    }

    fn retrieve(&self, _key: &str) -> Result<Option<String>, CredentialError> {
        Err(CredentialError::PlatformError("Windows Credential Manager not available on this platform".to_string()))
    }

    fn delete(&self, _key: &str) -> Result<(), CredentialError> {
        Err(CredentialError::PlatformError("Windows Credential Manager not available on this platform".to_string()))
    }
}

#[cfg(all(test, target_os = "windows"))]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_windows_credential_store_and_retrieve() {
        let store = WindowsCredentialStore::new();
        let test_key = format!("test_key_{}", Uuid::new_v4());
        let test_value = "SPLICE-TEST-LICENSE-KEY";

        // Store
        store.store(&test_key, test_value).expect("Failed to store");

        // Retrieve
        let result = store.retrieve(&test_key).expect("Failed to retrieve");
        assert_eq!(result, Some(test_value.to_string()));

        // Cleanup
        store.delete(&test_key).expect("Failed to delete");
    }

    #[test]
    fn test_windows_credential_retrieve_not_found() {
        let store = WindowsCredentialStore::new();
        let nonexistent_key = format!("nonexistent_{}", Uuid::new_v4());

        let result = store.retrieve(&nonexistent_key).expect("Failed to retrieve");
        assert_eq!(result, None);
    }

    #[test]
    fn test_windows_credential_delete_idempotent() {
        let store = WindowsCredentialStore::new();
        let test_key = format!("test_key_{}", Uuid::new_v4());

        // Delete nonexistent key should not error
        store.delete(&test_key).expect("Delete should be idempotent");
    }

    #[test]
    fn test_windows_credential_update() {
        let store = WindowsCredentialStore::new();
        let test_key = format!("test_key_{}", Uuid::new_v4());

        // Store initial value
        store.store(&test_key, "value1").expect("Failed to store");

        // Update with new value
        store.store(&test_key, "value2").expect("Failed to update");

        // Retrieve should return updated value
        let result = store.retrieve(&test_key).expect("Failed to retrieve");
        assert_eq!(result, Some("value2".to_string()));

        // Cleanup
        store.delete(&test_key).expect("Failed to delete");
    }
}
