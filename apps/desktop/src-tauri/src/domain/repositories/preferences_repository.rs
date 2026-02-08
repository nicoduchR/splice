use crate::domain::errors::DomainError;

/// PreferencesRepository trait defines the contract for user preferences persistence.
/// Simple key-value store for settings like custom temp directory.
pub trait PreferencesRepository: Send + Sync {
    /// Get a preference value by key. Returns None if not set.
    fn get(&self, key: &str) -> Result<Option<String>, DomainError>;

    /// Set a preference value. Creates or updates the key.
    fn set(&self, key: &str, value: &str) -> Result<(), DomainError>;

    /// Delete a preference by key.
    fn delete(&self, key: &str) -> Result<(), DomainError>;

    /// Get all preferences as key-value pairs.
    fn get_all(&self) -> Result<Vec<(String, String)>, DomainError>;
}
