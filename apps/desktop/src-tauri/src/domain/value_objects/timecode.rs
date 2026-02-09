use serde::{Deserialize, Serialize};
use ts_rs::TS;
use std::fmt;

/// Timecode value object for video timestamps
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct Timecode {
    pub seconds: f64,
}

impl Timecode {
    pub fn from_seconds(seconds: f64) -> Self {
        Self { seconds }
    }

    pub fn to_seconds(self) -> f64 {
        self.seconds
    }

    pub fn add_margin(&self, margin_seconds: f64) -> Self {
        Self {
            seconds: self.seconds + margin_seconds,
        }
    }
}

impl fmt::Display for Timecode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let total_seconds = self.seconds as i64;
        let hours = total_seconds / 3600;
        let minutes = (total_seconds % 3600) / 60;
        let seconds = total_seconds % 60;
        let milliseconds = ((self.seconds - total_seconds as f64) * 1000.0) as i64;
        write!(f, "{:02}:{:02}:{:02}.{:03}", hours, minutes, seconds, milliseconds)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_seconds() {
        let tc = Timecode::from_seconds(125.5);
        assert_eq!(format!("{}", tc), "00:02:05.500");
    }

    #[test]
    fn test_add_margin() {
        let tc = Timecode::from_seconds(10.0);
        let with_margin = tc.add_margin(0.1);
        assert_eq!(with_margin.to_seconds(), 10.1);
    }

    #[test]
    fn test_zero_seconds() {
        let tc = Timecode::from_seconds(0.0);
        assert_eq!(format!("{}", tc), "00:00:00.000");
    }

    #[test]
    fn test_large_duration() {
        // 24 hours = 86400 seconds
        let tc = Timecode::from_seconds(86400.0);
        assert_eq!(format!("{}", tc), "24:00:00.000");
    }

    #[test]
    fn test_fractional_seconds() {
        let tc = Timecode::from_seconds(1.123);
        assert_eq!(format!("{}", tc), "00:00:01.123");
    }

    #[test]
    fn test_negative_seconds() {
        // Negative timecodes can occur during calculations
        let tc = Timecode::from_seconds(-10.5);
        // Note: Current implementation casts to i64, may produce unexpected results
        // This test documents current behavior
        let formatted = format!("{}", tc);
        assert!(formatted.contains("-")); // Should handle negatives gracefully
    }
}
