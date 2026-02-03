#[cfg(target_os = "macos")]
use security_framework::passwords::{delete_generic_password, get_generic_password, set_generic_password};

use crate::domain::ports::{CredentialError, SecureCredentialStore};

const SERVICE_NAME: &str = "com.splice.license";

/// macOS Keychain implementation of SecureCredentialStore
pub struct MacOSCredentialStore;

impl MacOSCredentialStore {
    pub fn new() -> Self {
        Self
    }
}

impl Default for MacOSCredentialStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(target_os = "macos")]
impl SecureCredentialStore for MacOSCredentialStore {
    fn store(&self, key: &str, value: &str) -> Result<(), CredentialError> {
        // Delete existing entry first (Keychain requires this for updates)
        let _ = delete_generic_password(SERVICE_NAME, key);

        set_generic_password(SERVICE_NAME, key, value.as_bytes())
            .map_err(|e| CredentialError::StoreFailed(e.to_string()))
    }

    fn retrieve(&self, key: &str) -> Result<Option<String>, CredentialError> {
        match get_generic_password(SERVICE_NAME, key) {
            Ok(bytes) => {
                let value = String::from_utf8(bytes)
                    .map_err(|e| CredentialError::PlatformError(format!("Invalid UTF-8: {}", e)))?;
                Ok(Some(value))
            }
            Err(e) => {
                // errSecItemNotFound = -25300
                if e.code() == -25300 {
                    Ok(None)
                } else {
                    Err(CredentialError::PlatformError(e.to_string()))
                }
            }
        }
    }

    fn delete(&self, key: &str) -> Result<(), CredentialError> {
        match delete_generic_password(SERVICE_NAME, key) {
            Ok(()) => Ok(()),
            Err(e) => {
                // errSecItemNotFound = -25300 - Not an error when deleting
                if e.code() == -25300 {
                    Ok(())
                } else {
                    Err(CredentialError::DeleteFailed(e.to_string()))
                }
            }
        }
    }
}

// Stub implementation for non-macOS platforms (for compilation)
#[cfg(not(target_os = "macos"))]
impl SecureCredentialStore for MacOSCredentialStore {
    fn store(&self, _key: &str, _value: &str) -> Result<(), CredentialError> {
        Err(CredentialError::PlatformError("macOS Keychain not available on this platform".to_string()))
    }

    fn retrieve(&self, _key: &str) -> Result<Option<String>, CredentialError> {
        Err(CredentialError::PlatformError("macOS Keychain not available on this platform".to_string()))
    }

    fn delete(&self, _key: &str) -> Result<(), CredentialError> {
        Err(CredentialError::PlatformError("macOS Keychain not available on this platform".to_string()))
    }
}

#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_macos_keychain_store_and_retrieve() {
        let store = MacOSCredentialStore::new();
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
    fn test_macos_keychain_retrieve_not_found() {
        let store = MacOSCredentialStore::new();
        let nonexistent_key = format!("nonexistent_{}", Uuid::new_v4());

        let result = store.retrieve(&nonexistent_key).expect("Failed to retrieve");
        assert_eq!(result, None);
    }

    #[test]
    fn test_macos_keychain_delete_idempotent() {
        let store = MacOSCredentialStore::new();
        let test_key = format!("test_key_{}", Uuid::new_v4());

        // Delete nonexistent key should not error
        store.delete(&test_key).expect("Delete should be idempotent");
    }

    #[test]
    fn test_macos_keychain_update() {
        let store = MacOSCredentialStore::new();
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
