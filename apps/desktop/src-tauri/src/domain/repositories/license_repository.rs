use async_trait::async_trait;
use crate::domain::entities::LicenseCache;
use crate::domain::errors::DomainError;

/// Repository port for license cache persistence
#[async_trait]
pub trait LicenseRepository: Send + Sync {
    /// Get the current license cache (always returns Some, uses default if not set)
    async fn get_cache(&self) -> Result<LicenseCache, DomainError>;

    /// Update the license cache
    async fn update_cache(&self, cache: &LicenseCache) -> Result<(), DomainError>;
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::domain::value_objects::LicensePlan;
    use std::sync::Mutex;

    /// Mock implementation for testing
    pub struct MockLicenseRepository {
        cache: Mutex<LicenseCache>,
    }

    impl MockLicenseRepository {
        pub fn new() -> Self {
            Self {
                cache: Mutex::new(LicenseCache::new_free()),
            }
        }

        pub fn with_cache(cache: LicenseCache) -> Self {
            Self {
                cache: Mutex::new(cache),
            }
        }
    }

    impl Default for MockLicenseRepository {
        fn default() -> Self {
            Self::new()
        }
    }

    #[async_trait]
    impl LicenseRepository for MockLicenseRepository {
        async fn get_cache(&self) -> Result<LicenseCache, DomainError> {
            Ok(self.cache.lock().unwrap().clone())
        }

        async fn update_cache(&self, cache: &LicenseCache) -> Result<(), DomainError> {
            *self.cache.lock().unwrap() = cache.clone();
            Ok(())
        }
    }

    #[tokio::test]
    async fn test_mock_repository_get_default() {
        let repo = MockLicenseRepository::new();
        let cache = repo.get_cache().await.unwrap();
        assert_eq!(cache.plan, LicensePlan::Free);
    }

    #[tokio::test]
    async fn test_mock_repository_update() {
        let repo = MockLicenseRepository::new();

        let new_cache = LicenseCache::from_verification(
            LicensePlan::Pro,
            None,
            1706961600,
        );

        repo.update_cache(&new_cache).await.unwrap();

        let cache = repo.get_cache().await.unwrap();
        assert_eq!(cache.plan, LicensePlan::Pro);
    }
}
