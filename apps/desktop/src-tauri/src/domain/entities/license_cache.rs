use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::domain::value_objects::LicensePlan;

/// License cache entity for offline grace period support
/// Stored in SQLite as a single-row table (id = 1)
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct LicenseCache {
    /// Plan type: free or pro
    pub plan: LicensePlan,

    /// Unix timestamp of last successful verification
    pub last_verified_at: i64,

    /// Unix timestamp when license expires (None for lifetime)
    pub expires_at: Option<i64>,

    /// Unix timestamp when grace period ends (last_verified_at + 7 days)
    pub grace_period_ends_at: i64,
}

impl LicenseCache {
    pub const GRACE_PERIOD_DAYS: i64 = 7;
    pub const GRACE_PERIOD_SECONDS: i64 = Self::GRACE_PERIOD_DAYS * 24 * 60 * 60;

    /// Create a new license cache with default free plan
    pub fn new_free() -> Self {
        Self {
            plan: LicensePlan::Free,
            last_verified_at: 0,
            expires_at: None,
            grace_period_ends_at: 0,
        }
    }

    /// Create a license cache from API verification response
    pub fn from_verification(
        plan: LicensePlan,
        expires_at: Option<i64>,
        verified_at: i64,
    ) -> Self {
        Self {
            plan,
            last_verified_at: verified_at,
            expires_at,
            grace_period_ends_at: verified_at + Self::GRACE_PERIOD_SECONDS,
        }
    }

    /// Check if the grace period is still valid
    pub fn is_grace_period_valid(&self, current_time: i64) -> bool {
        // Never verified = no grace period
        if self.last_verified_at == 0 {
            return false;
        }
        current_time < self.grace_period_ends_at
    }

    /// Get days remaining in grace period (0 if expired)
    pub fn days_until_grace_expires(&self, current_time: i64) -> i64 {
        if current_time >= self.grace_period_ends_at {
            return 0;
        }
        let remaining_seconds = self.grace_period_ends_at - current_time;
        remaining_seconds / (24 * 60 * 60)
    }

    /// Check if license has been verified at least once
    pub fn has_been_verified(&self) -> bool {
        self.last_verified_at > 0
    }

    /// Check if the license subscription is expired
    pub fn is_license_expired(&self, current_time: i64) -> bool {
        match self.expires_at {
            Some(expires) => current_time >= expires,
            None => false, // Lifetime license never expires
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_free_license() {
        let cache = LicenseCache::new_free();
        assert_eq!(cache.plan, LicensePlan::Free);
        assert_eq!(cache.last_verified_at, 0);
        assert_eq!(cache.expires_at, None);
        assert_eq!(cache.grace_period_ends_at, 0);
    }

    #[test]
    fn test_from_verification() {
        let verified_at = 1706961600; // Some Unix timestamp
        let expires_at = Some(1738497600); // One year later

        let cache = LicenseCache::from_verification(
            LicensePlan::Pro,
            expires_at,
            verified_at,
        );

        assert_eq!(cache.plan, LicensePlan::Pro);
        assert_eq!(cache.last_verified_at, verified_at);
        assert_eq!(cache.expires_at, expires_at);
        assert_eq!(cache.grace_period_ends_at, verified_at + LicenseCache::GRACE_PERIOD_SECONDS);
    }

    #[test]
    fn test_grace_period_valid() {
        let verified_at = 1706961600;
        let cache = LicenseCache::from_verification(LicensePlan::Pro, None, verified_at);

        // 3 days after verification - should be valid
        let three_days_later = verified_at + (3 * 24 * 60 * 60);
        assert!(cache.is_grace_period_valid(three_days_later));

        // 8 days after verification - should be expired
        let eight_days_later = verified_at + (8 * 24 * 60 * 60);
        assert!(!cache.is_grace_period_valid(eight_days_later));
    }

    #[test]
    fn test_grace_period_never_verified() {
        let cache = LicenseCache::new_free();
        let current_time = 1706961600;
        assert!(!cache.is_grace_period_valid(current_time));
    }

    #[test]
    fn test_days_until_grace_expires() {
        let verified_at = 1706961600;
        let cache = LicenseCache::from_verification(LicensePlan::Pro, None, verified_at);

        // Immediately after verification = 7 days
        assert_eq!(cache.days_until_grace_expires(verified_at), 7);

        // 3 days later = 4 days remaining
        let three_days_later = verified_at + (3 * 24 * 60 * 60);
        assert_eq!(cache.days_until_grace_expires(three_days_later), 4);

        // After grace period = 0 days
        let after_grace = verified_at + (8 * 24 * 60 * 60);
        assert_eq!(cache.days_until_grace_expires(after_grace), 0);
    }

    #[test]
    fn test_has_been_verified() {
        let unverified = LicenseCache::new_free();
        assert!(!unverified.has_been_verified());

        let verified = LicenseCache::from_verification(LicensePlan::Pro, None, 1706961600);
        assert!(verified.has_been_verified());
    }

    #[test]
    fn test_license_expired() {
        let expires_at = 1706961600;
        let cache = LicenseCache::from_verification(LicensePlan::Pro, Some(expires_at), expires_at - 100);

        // Before expiration
        assert!(!cache.is_license_expired(expires_at - 1));

        // After expiration
        assert!(cache.is_license_expired(expires_at + 1));

        // Lifetime license never expires
        let lifetime = LicenseCache::from_verification(LicensePlan::Pro, None, 1706961600);
        assert!(!lifetime.is_license_expired(9999999999));
    }
}
