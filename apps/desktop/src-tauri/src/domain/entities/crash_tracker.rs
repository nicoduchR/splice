use serde::{Deserialize, Serialize};

/// CrashTracker entity - tracks consecutive crashes for rollback detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrashTracker {
    pub consecutive_crashes: u32,
    pub needs_rollback: bool,
    pub previous_version: Option<String>,
    pub last_updated_version: Option<String>,
    /// Set after a rollback completes; consumed on next startup to show notification
    #[serde(default)]
    pub rollback_just_completed: bool,
    #[serde(default)]
    pub rollback_from_version: Option<String>,
    #[serde(default)]
    pub rollback_to_version: Option<String>,
}

impl Default for CrashTracker {
    fn default() -> Self {
        Self {
            consecutive_crashes: 0,
            needs_rollback: false,
            previous_version: None,
            last_updated_version: None,
            rollback_just_completed: false,
            rollback_from_version: None,
            rollback_to_version: None,
        }
    }
}

/// Threshold of consecutive crashes before triggering rollback
const CRASH_THRESHOLD: u32 = 3;

impl CrashTracker {
    /// Record a crash (increment counter) and check if rollback is needed.
    /// Returns true if the crash threshold has been reached.
    pub fn record_crash(&mut self) -> bool {
        self.consecutive_crashes += 1;
        if self.consecutive_crashes >= CRASH_THRESHOLD {
            self.needs_rollback = true;
        }
        self.needs_rollback
    }

    /// Reset the crash counter after a successful startup (healthy app).
    pub fn mark_healthy(&mut self) {
        self.consecutive_crashes = 0;
        self.needs_rollback = false;
    }

    /// Set the previous version before an update is applied.
    /// `current_version` is the version being upgraded FROM (rollback target).
    pub fn set_previous_version(&mut self, current_version: String) {
        self.previous_version = Some(current_version);
    }

    /// Clear rollback state after a successful rollback.
    pub fn clear_rollback(&mut self) {
        self.needs_rollback = false;
        self.consecutive_crashes = 0;
    }

    /// Check if a backup is available for rollback.
    pub fn has_previous_version(&self) -> bool {
        self.previous_version.is_some()
    }

    /// Record that a rollback just completed, to emit notification on next startup.
    pub fn set_rollback_completed(&mut self, from_version: String, to_version: String) {
        self.rollback_just_completed = true;
        self.rollback_from_version = Some(from_version);
        self.rollback_to_version = Some(to_version);
    }

    /// Consume rollback completion info (returns Some on first call after rollback).
    pub fn take_rollback_completed(&mut self) -> Option<(String, String)> {
        if self.rollback_just_completed {
            self.rollback_just_completed = false;
            let from = self.rollback_from_version.take();
            let to = self.rollback_to_version.take();
            if let (Some(from), Some(to)) = (from, to) {
                return Some((from, to));
            }
        }
        None
    }

    /// Load crash tracker from a JSON file path. Returns default if file doesn't exist.
    pub fn load_from_file(path: &std::path::Path) -> Self {
        match std::fs::read_to_string(path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    /// Save crash tracker to a JSON file path.
    pub fn save_to_file(&self, path: &std::path::Path) -> Result<(), String> {
        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize crash tracker: {}", e))?;

        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        std::fs::write(path, content)
            .map_err(|e| format!("Failed to write crash tracker: {}", e))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_default_crash_tracker() {
        let tracker = CrashTracker::default();
        assert_eq!(tracker.consecutive_crashes, 0);
        assert!(!tracker.needs_rollback);
        assert!(tracker.previous_version.is_none());
        assert!(tracker.last_updated_version.is_none());
    }

    #[test]
    fn test_record_crash_increments_counter() {
        let mut tracker = CrashTracker::default();
        tracker.record_crash();
        assert_eq!(tracker.consecutive_crashes, 1);
        assert!(!tracker.needs_rollback);

        tracker.record_crash();
        assert_eq!(tracker.consecutive_crashes, 2);
        assert!(!tracker.needs_rollback);
    }

    #[test]
    fn test_record_crash_triggers_rollback_at_threshold() {
        let mut tracker = CrashTracker::default();
        tracker.set_previous_version("1.0.0".to_string());

        assert!(!tracker.record_crash()); // 1
        assert!(!tracker.record_crash()); // 2
        assert!(tracker.record_crash());  // 3 — triggers rollback

        assert!(tracker.needs_rollback);
        assert_eq!(tracker.consecutive_crashes, 3);
    }

    #[test]
    fn test_mark_healthy_resets_counter() {
        let mut tracker = CrashTracker::default();
        tracker.record_crash();
        tracker.record_crash();
        assert_eq!(tracker.consecutive_crashes, 2);

        tracker.mark_healthy();
        assert_eq!(tracker.consecutive_crashes, 0);
        assert!(!tracker.needs_rollback);
    }

    #[test]
    fn test_set_previous_version() {
        let mut tracker = CrashTracker::default();
        tracker.set_previous_version("1.2.0".to_string());

        assert_eq!(tracker.previous_version, Some("1.2.0".to_string()));
        // last_updated_version is NOT set by set_previous_version (M3 fix)
        assert!(tracker.last_updated_version.is_none());
        assert!(tracker.has_previous_version());
    }

    #[test]
    fn test_clear_rollback() {
        let mut tracker = CrashTracker::default();
        tracker.consecutive_crashes = 5;
        tracker.needs_rollback = true;

        tracker.clear_rollback();

        assert_eq!(tracker.consecutive_crashes, 0);
        assert!(!tracker.needs_rollback);
    }

    #[test]
    fn test_persistence_save_and_load() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("crash-tracker.json");

        let mut tracker = CrashTracker::default();
        tracker.consecutive_crashes = 2;
        tracker.previous_version = Some("1.0.0".to_string());
        tracker.save_to_file(&path).unwrap();

        let loaded = CrashTracker::load_from_file(&path);
        assert_eq!(loaded.consecutive_crashes, 2);
        assert_eq!(loaded.previous_version, Some("1.0.0".to_string()));
    }

    #[test]
    fn test_load_from_nonexistent_file_returns_default() {
        let path = std::path::Path::new("/tmp/nonexistent_crash_tracker_test_12345.json");
        let tracker = CrashTracker::load_from_file(path);
        assert_eq!(tracker.consecutive_crashes, 0);
        assert!(!tracker.needs_rollback);
    }

    #[test]
    fn test_load_from_invalid_json_returns_default() {
        let mut file = NamedTempFile::new().unwrap();
        write!(file, "not valid json").unwrap();

        let tracker = CrashTracker::load_from_file(file.path());
        assert_eq!(tracker.consecutive_crashes, 0);
    }

    #[test]
    fn test_has_previous_version_false_by_default() {
        let tracker = CrashTracker::default();
        assert!(!tracker.has_previous_version());
    }

    #[test]
    fn test_set_rollback_completed() {
        let mut tracker = CrashTracker::default();
        tracker.set_rollback_completed("1.1.0".to_string(), "1.0.0".to_string());

        assert!(tracker.rollback_just_completed);
        assert_eq!(tracker.rollback_from_version, Some("1.1.0".to_string()));
        assert_eq!(tracker.rollback_to_version, Some("1.0.0".to_string()));
    }

    #[test]
    fn test_take_rollback_completed_consumes() {
        let mut tracker = CrashTracker::default();
        tracker.set_rollback_completed("1.1.0".to_string(), "1.0.0".to_string());

        let result = tracker.take_rollback_completed();
        assert_eq!(result, Some(("1.1.0".to_string(), "1.0.0".to_string())));
        assert!(!tracker.rollback_just_completed);
        assert!(tracker.rollback_from_version.is_none());

        // Second call returns None
        let result2 = tracker.take_rollback_completed();
        assert!(result2.is_none());
    }

    #[test]
    fn test_take_rollback_completed_none_by_default() {
        let mut tracker = CrashTracker::default();
        assert!(tracker.take_rollback_completed().is_none());
    }
}
