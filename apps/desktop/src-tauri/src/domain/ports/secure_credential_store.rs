use thiserror::Error;

#[derive(Error, Debug)]
pub enum CredentialError {
    #[error("Credential not found: {0}")]
    NotFound(String),

    #[error("Failed to store credential: {0}")]
    StoreFailed(String),

    #[error("Failed to delete credential: {0}")]
    DeleteFailed(String),

    #[error("Platform-specific error: {0}")]
    PlatformError(String),
}

/// Cross-platform trait for secure credential storage
/// - macOS: Uses Keychain via security-framework
/// - Windows: Uses Credential Manager via keyring
pub trait SecureCredentialStore: Send + Sync {
    /// Store a credential securely
    fn store(&self, key: &str, value: &str) -> Result<(), CredentialError>;

    /// Retrieve a credential (returns None if not found)
    fn retrieve(&self, key: &str) -> Result<Option<String>, CredentialError>;

    /// Delete a credential
    fn delete(&self, key: &str) -> Result<(), CredentialError>;
}

#[cfg(test)]
mod tests {
    use super::*;

    struct MockCredentialStore {
        store: std::sync::Mutex<std::collections::HashMap<String, String>>,
    }

    impl MockCredentialStore {
        fn new() -> Self {
            Self {
                store: std::sync::Mutex::new(std::collections::HashMap::new()),
            }
        }
    }

    impl SecureCredentialStore for MockCredentialStore {
        fn store(&self, key: &str, value: &str) -> Result<(), CredentialError> {
            self.store.lock().unwrap().insert(key.to_string(), value.to_string());
            Ok(())
        }

        fn retrieve(&self, key: &str) -> Result<Option<String>, CredentialError> {
            Ok(self.store.lock().unwrap().get(key).cloned())
        }

        fn delete(&self, key: &str) -> Result<(), CredentialError> {
            self.store.lock().unwrap().remove(key);
            Ok(())
        }
    }

    #[test]
    fn test_mock_store_and_retrieve() {
        let store = MockCredentialStore::new();

        store.store("test_key", "test_value").unwrap();

        let result = store.retrieve("test_key").unwrap();
        assert_eq!(result, Some("test_value".to_string()));
    }

    #[test]
    fn test_mock_retrieve_not_found() {
        let store = MockCredentialStore::new();

        let result = store.retrieve("nonexistent").unwrap();
        assert_eq!(result, None);
    }

    #[test]
    fn test_mock_delete() {
        let store = MockCredentialStore::new();

        store.store("test_key", "test_value").unwrap();
        store.delete("test_key").unwrap();

        let result = store.retrieve("test_key").unwrap();
        assert_eq!(result, None);
    }
}
