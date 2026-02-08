use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::fmt;

/// AppVersion value object - represents a semantic version
///
/// Handles version comparison following SemVer rules:
/// - MAJOR.MINOR.PATCH[-PRERELEASE]
/// - Example: 1.0.0, 1.2.3-beta.1
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AppVersion {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub prerelease: Option<String>,
}

impl AppVersion {
    /// Parse a version string into an AppVersion
    ///
    /// # Arguments
    /// * `version` - Version string like "1.0.0" or "1.2.3-beta.1"
    ///
    /// # Returns
    /// * `Ok(AppVersion)` if parsing succeeds
    /// * `Err(String)` with error message if parsing fails
    pub fn parse(version: &str) -> Result<Self, String> {
        let trimmed = version.trim();

        // Split prerelease part if present
        let (version_part, prerelease) = if let Some(idx) = trimmed.find('-') {
            let (v, p) = trimmed.split_at(idx);
            (v, Some(p[1..].to_string())) // Skip the '-'
        } else {
            (trimmed, None)
        };

        // Remove build metadata if present (+something)
        let version_part = version_part.split('+').next().unwrap_or(version_part);

        let parts: Vec<&str> = version_part.split('.').collect();
        if parts.len() != 3 {
            return Err(format!(
                "Invalid version format: '{}'. Expected MAJOR.MINOR.PATCH",
                version
            ));
        }

        let major = parts[0]
            .parse::<u32>()
            .map_err(|_| format!("Invalid major version: '{}'", parts[0]))?;
        let minor = parts[1]
            .parse::<u32>()
            .map_err(|_| format!("Invalid minor version: '{}'", parts[1]))?;
        let patch = parts[2]
            .parse::<u32>()
            .map_err(|_| format!("Invalid patch version: '{}'", parts[2]))?;

        Ok(Self {
            major,
            minor,
            patch,
            prerelease,
        })
    }

    /// Check if this version is greater than another
    pub fn is_greater_than(&self, other: &Self) -> bool {
        self.cmp(other) == Ordering::Greater
    }

    /// Check if this version is less than another
    pub fn is_less_than(&self, other: &Self) -> bool {
        self.cmp(other) == Ordering::Less
    }

    /// Check if this version is a prerelease
    pub fn is_prerelease(&self) -> bool {
        self.prerelease.is_some()
    }

    /// Compare prerelease identifiers per SemVer spec (§11).
    /// Numeric identifiers are compared as integers; alphanumeric as strings.
    /// Numeric identifiers always have lower precedence than alphanumeric.
    fn compare_prerelease(a: &str, b: &str) -> Ordering {
        let a_parts: Vec<&str> = a.split('.').collect();
        let b_parts: Vec<&str> = b.split('.').collect();
        let min_len = a_parts.len().min(b_parts.len());

        for i in 0..min_len {
            let a_part = a_parts[i];
            let b_part = b_parts[i];

            let a_numeric = a_part.parse::<u64>().ok();
            let b_numeric = b_part.parse::<u64>().ok();

            match (a_numeric, b_numeric) {
                (Some(a_num), Some(b_num)) => {
                    match a_num.cmp(&b_num) {
                        Ordering::Equal => continue,
                        ord => return ord,
                    }
                }
                (Some(_), None) => return Ordering::Less,
                (None, Some(_)) => return Ordering::Greater,
                (None, None) => {
                    match a_part.cmp(b_part) {
                        Ordering::Equal => continue,
                        ord => return ord,
                    }
                }
            }
        }

        a_parts.len().cmp(&b_parts.len())
    }
}

impl Ord for AppVersion {
    fn cmp(&self, other: &Self) -> Ordering {
        // Compare major
        match self.major.cmp(&other.major) {
            Ordering::Equal => {}
            ord => return ord,
        }

        // Compare minor
        match self.minor.cmp(&other.minor) {
            Ordering::Equal => {}
            ord => return ord,
        }

        // Compare patch
        match self.patch.cmp(&other.patch) {
            Ordering::Equal => {}
            ord => return ord,
        }

        // Compare prerelease
        // A version without prerelease has higher precedence
        match (&self.prerelease, &other.prerelease) {
            (None, None) => Ordering::Equal,
            (None, Some(_)) => Ordering::Greater, // 1.0.0 > 1.0.0-beta
            (Some(_), None) => Ordering::Less,    // 1.0.0-beta < 1.0.0
            (Some(a), Some(b)) => Self::compare_prerelease(a, b),
        }
    }
}

impl PartialOrd for AppVersion {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl fmt::Display for AppVersion {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self.prerelease {
            Some(pre) => write!(f, "{}.{}.{}-{}", self.major, self.minor, self.patch, pre),
            None => write!(f, "{}.{}.{}", self.major, self.minor, self.patch),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_version() {
        let version = AppVersion::parse("1.2.3").unwrap();
        assert_eq!(version.major, 1);
        assert_eq!(version.minor, 2);
        assert_eq!(version.patch, 3);
        assert!(version.prerelease.is_none());
    }

    #[test]
    fn test_parse_version_with_prerelease() {
        let version = AppVersion::parse("1.2.3-beta.1").unwrap();
        assert_eq!(version.major, 1);
        assert_eq!(version.minor, 2);
        assert_eq!(version.patch, 3);
        assert_eq!(version.prerelease, Some("beta.1".to_string()));
    }

    #[test]
    fn test_parse_version_with_build_metadata() {
        let version = AppVersion::parse("1.2.3+build.123").unwrap();
        assert_eq!(version.major, 1);
        assert_eq!(version.minor, 2);
        assert_eq!(version.patch, 3);
        assert!(version.prerelease.is_none());
    }

    #[test]
    fn test_parse_invalid_version() {
        assert!(AppVersion::parse("1.2").is_err());
        assert!(AppVersion::parse("1.2.3.4").is_err());
        assert!(AppVersion::parse("invalid").is_err());
        assert!(AppVersion::parse("").is_err());
    }

    #[test]
    fn test_version_comparison() {
        let v1_0_0 = AppVersion::parse("1.0.0").unwrap();
        let v1_0_1 = AppVersion::parse("1.0.1").unwrap();
        let v1_1_0 = AppVersion::parse("1.1.0").unwrap();
        let v2_0_0 = AppVersion::parse("2.0.0").unwrap();

        assert!(v1_0_0 < v1_0_1);
        assert!(v1_0_1 < v1_1_0);
        assert!(v1_1_0 < v2_0_0);
        assert!(v2_0_0 > v1_0_0);
    }

    #[test]
    fn test_prerelease_comparison() {
        let stable = AppVersion::parse("1.0.0").unwrap();
        let beta = AppVersion::parse("1.0.0-beta.1").unwrap();
        let alpha = AppVersion::parse("1.0.0-alpha.1").unwrap();

        // Stable > prerelease
        assert!(stable > beta);
        assert!(stable > alpha);

        // Lexical comparison for prereleases
        assert!(beta > alpha); // 'b' > 'a'
    }

    #[test]
    fn test_is_greater_than() {
        let v1 = AppVersion::parse("1.0.0").unwrap();
        let v2 = AppVersion::parse("2.0.0").unwrap();

        assert!(v2.is_greater_than(&v1));
        assert!(!v1.is_greater_than(&v2));
    }

    #[test]
    fn test_display() {
        let version = AppVersion::parse("1.2.3").unwrap();
        assert_eq!(version.to_string(), "1.2.3");

        let version_pre = AppVersion::parse("1.2.3-beta.1").unwrap();
        assert_eq!(version_pre.to_string(), "1.2.3-beta.1");
    }

    #[test]
    fn test_is_prerelease() {
        let stable = AppVersion::parse("1.0.0").unwrap();
        let beta = AppVersion::parse("1.0.0-beta").unwrap();

        assert!(!stable.is_prerelease());
        assert!(beta.is_prerelease());
    }
}
