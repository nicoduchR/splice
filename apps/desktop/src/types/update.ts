/**
 * Update-related TypeScript types
 *
 * These types mirror the Rust types in src-tauri/src/domain/entities/update_info.rs
 * The Rust types are auto-exported via ts-rs, but we define frontend-specific
 * extensions and convenience types here.
 */

/**
 * UpdateInfo - Information about an available update
 */
export interface UpdateInfo {
  version: string;
  release_date: string;
  release_notes: string;
  download_url: string;
  is_mandatory: boolean;
}

/**
 * DownloadProgress - Progress of an update download
 */
export interface DownloadProgress {
  percent: number;
  downloaded_bytes: number;
  total_bytes: number;
}

/**
 * UpdateStatus - Current state of the update process
 */
export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'up_to_date'
  | 'error';

/**
 * UpdateStatusResponse - Response from get_update_status command
 */
export interface UpdateStatusResponse {
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  downloadProgress: DownloadProgress | null;
  error: string | null;
}

/**
 * UpdateAvailableEvent - Tauri event payload for update:available
 */
export interface UpdateAvailableEvent {
  version: string;
  releaseNotes: string;
  isMandatory: boolean;
}

/**
 * UpdateDownloadProgressEvent - Tauri event payload for update:download-progress
 */
export interface UpdateDownloadProgressEvent {
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
}

/**
 * UpdateDownloadCompleteEvent - Tauri event payload for update:download-complete
 */
export interface UpdateDownloadCompleteEvent {
  version: string;
}

/**
 * UpdateErrorEvent - Tauri event payload for update:error
 */
export interface UpdateErrorEvent {
  message: string;
}

/**
 * BackupInfo - Information about a previous version backup
 */
export interface BackupInfo {
  version: string;
  backupDate: string;
  sizeMb: number;
}

/**
 * RollbackCompletedEvent - Tauri event payload for rollback:completed
 */
export interface RollbackCompletedEvent {
  previousVersion: string;
  restoredVersion: string;
}
