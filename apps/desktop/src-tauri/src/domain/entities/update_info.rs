use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// UpdateInfo entity - represents available update information
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct UpdateInfo {
    pub version: String,
    pub release_date: String,
    pub release_notes: String,
    /// Download URL for the update binary.
    /// Note: When using tauri-plugin-updater, the plugin manages downloads
    /// internally and does not expose the URL. This field will be empty
    /// in that context but is populated by the backend API response.
    pub download_url: String,
    pub is_mandatory: bool,
}

impl UpdateInfo {
    pub fn new(
        version: String,
        release_date: String,
        release_notes: String,
        download_url: String,
        is_mandatory: bool,
    ) -> Self {
        Self {
            version,
            release_date,
            release_notes,
            download_url,
            is_mandatory,
        }
    }
}

/// DownloadProgress entity - represents the progress of an update download
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
pub struct DownloadProgress {
    /// Download percentage (0-100)
    pub percent: f64,
    /// Bytes downloaded so far
    #[ts(type = "number")]
    pub downloaded_bytes: u64,
    /// Total bytes to download
    #[ts(type = "number")]
    pub total_bytes: u64,
}

impl DownloadProgress {
    pub fn new(downloaded_bytes: u64, total_bytes: u64) -> Self {
        let percent = if total_bytes > 0 {
            (downloaded_bytes as f64 / total_bytes as f64) * 100.0
        } else {
            0.0
        };
        Self {
            percent,
            downloaded_bytes,
            total_bytes,
        }
    }

    pub fn zero() -> Self {
        Self {
            percent: 0.0,
            downloaded_bytes: 0,
            total_bytes: 0,
        }
    }

    pub fn complete(total_bytes: u64) -> Self {
        Self {
            percent: 100.0,
            downloaded_bytes: total_bytes,
            total_bytes,
        }
    }
}

/// UpdateStatus enum - represents the current state of the update process
#[derive(Debug, Clone, Default, Serialize, Deserialize, TS, PartialEq)]
#[ts(export, export_to = "../../../../../packages/types/src/generated/")]
#[serde(rename_all = "snake_case")]
pub enum UpdateStatus {
    /// No update check has been performed
    #[default]
    Idle,
    /// Currently checking for updates
    Checking,
    /// An update is available but not yet downloading
    Available,
    /// Update is being downloaded
    Downloading,
    /// Download complete, ready to install
    Ready,
    /// No update available (already on latest version)
    UpToDate,
    /// An error occurred during update check or download
    Error,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_update_info_new() {
        let info = UpdateInfo::new(
            "1.2.0".to_string(),
            "2024-01-15T10:00:00Z".to_string(),
            "Bug fixes and improvements".to_string(),
            "https://example.com/update.tar.gz".to_string(),
            false,
        );

        assert_eq!(info.version, "1.2.0");
        assert_eq!(info.release_date, "2024-01-15T10:00:00Z");
        assert!(!info.is_mandatory);
    }

    #[test]
    fn test_download_progress_new() {
        let progress = DownloadProgress::new(50_000_000, 100_000_000);

        assert_eq!(progress.percent, 50.0);
        assert_eq!(progress.downloaded_bytes, 50_000_000);
        assert_eq!(progress.total_bytes, 100_000_000);
    }

    #[test]
    fn test_download_progress_zero() {
        let progress = DownloadProgress::zero();

        assert_eq!(progress.percent, 0.0);
        assert_eq!(progress.downloaded_bytes, 0);
        assert_eq!(progress.total_bytes, 0);
    }

    #[test]
    fn test_download_progress_complete() {
        let progress = DownloadProgress::complete(100_000_000);

        assert_eq!(progress.percent, 100.0);
        assert_eq!(progress.downloaded_bytes, 100_000_000);
        assert_eq!(progress.total_bytes, 100_000_000);
    }

    #[test]
    fn test_download_progress_handles_zero_total() {
        let progress = DownloadProgress::new(0, 0);

        assert_eq!(progress.percent, 0.0);
    }

    #[test]
    fn test_update_status_default() {
        let status: UpdateStatus = Default::default();
        assert_eq!(status, UpdateStatus::Idle);
    }
}
