use serde::{Deserialize, Serialize};
use ts_rs::TS;
use std::fmt;

/// License plan types
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum LicensePlan {
    #[default]
    Free,
    Pro,
}

impl LicensePlan {
    /// Parse from string (case-insensitive)
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "free" => Some(Self::Free),
            "pro" => Some(Self::Pro),
            _ => None,
        }
    }

    /// Check if plan allows premium features
    pub fn is_premium(&self) -> bool {
        matches!(self, Self::Pro)
    }
}

impl fmt::Display for LicensePlan {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Free => write!(f, "free"),
            Self::Pro => write!(f, "pro"),
        }
    }
}

impl From<&str> for LicensePlan {
    fn from(s: &str) -> Self {
        Self::parse(s).unwrap_or_default()
    }
}

impl From<String> for LicensePlan {
    fn from(s: String) -> Self {
        Self::from(s.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_str() {
        assert_eq!(LicensePlan::parse("free"), Some(LicensePlan::Free));
        assert_eq!(LicensePlan::parse("pro"), Some(LicensePlan::Pro));
        assert_eq!(LicensePlan::parse("FREE"), Some(LicensePlan::Free));
        assert_eq!(LicensePlan::parse("PRO"), Some(LicensePlan::Pro));
        assert_eq!(LicensePlan::parse("invalid"), None);
    }

    #[test]
    fn test_is_premium() {
        assert!(!LicensePlan::Free.is_premium());
        assert!(LicensePlan::Pro.is_premium());
    }

    #[test]
    fn test_default() {
        assert_eq!(LicensePlan::default(), LicensePlan::Free);
    }

    #[test]
    fn test_display() {
        assert_eq!(format!("{}", LicensePlan::Free), "free");
        assert_eq!(format!("{}", LicensePlan::Pro), "pro");
    }

    #[test]
    fn test_from_string() {
        let plan: LicensePlan = "pro".into();
        assert_eq!(plan, LicensePlan::Pro);

        let plan: LicensePlan = String::from("free").into();
        assert_eq!(plan, LicensePlan::Free);

        let plan: LicensePlan = "invalid".into();
        assert_eq!(plan, LicensePlan::Free); // Default for invalid
    }
}
