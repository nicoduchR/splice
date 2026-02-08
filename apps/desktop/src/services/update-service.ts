/**
 * Update Service
 *
 * Handles communication with Tauri backend for app update operations.
 * Provides methods for checking, downloading, and installing updates.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
  UpdateStatusResponse,
  UpdateAvailableEvent,
  UpdateDownloadProgressEvent,
  UpdateDownloadCompleteEvent,
  UpdateErrorEvent,
  BackupInfo,
  RollbackCompletedEvent,
} from '../types/update';

/**
 * Check for available updates
 *
 * @returns UpdateStatusResponse with current status and update info if available
 */
export async function checkForUpdate(): Promise<UpdateStatusResponse> {
  return invoke<UpdateStatusResponse>('check_for_update');
}

/**
 * Start downloading an available update
 *
 * Progress and completion are reported via Tauri events:
 * - update:download-progress
 * - update:download-complete
 * - update:error
 *
 * @returns UpdateStatusResponse with download status
 */
export async function downloadUpdate(): Promise<UpdateStatusResponse> {
  return invoke<UpdateStatusResponse>('download_update');
}

/**
 * Cancel an ongoing update download
 */
export async function cancelUpdateDownload(): Promise<void> {
  return invoke<void>('cancel_update_download');
}

/**
 * Get current update status without triggering a check
 *
 * @returns UpdateStatusResponse with current state
 */
export async function getUpdateStatus(): Promise<UpdateStatusResponse> {
  return invoke<UpdateStatusResponse>('get_update_status');
}

/**
 * Install a downloaded update and restart the app
 *
 * Warning: This will close the app and apply the update.
 */
export async function installUpdate(): Promise<void> {
  return invoke<void>('install_update');
}

/**
 * Set the install_on_quit flag
 *
 * When true, the update will be applied when the app closes.
 */
export async function setInstallOnQuit(value: boolean): Promise<void> {
  return invoke<void>('set_install_on_quit', { value });
}

/**
 * Get the install_on_quit flag
 */
export async function getInstallOnQuit(): Promise<boolean> {
  return invoke<boolean>('get_install_on_quit');
}

/**
 * Get backup information for the previous version
 */
export async function getBackupInfo(): Promise<BackupInfo | null> {
  return invoke<BackupInfo | null>('get_backup_info');
}

/**
 * Perform a manual rollback to the previous version
 *
 * Warning: This will restart the app.
 */
export async function manualRollback(): Promise<void> {
  return invoke<void>('manual_rollback');
}

/**
 * Get the current consecutive crash count
 */
export async function getCrashCount(): Promise<number> {
  return invoke<number>('get_crash_count');
}

/**
 * Send a crash report to the backend
 */
export async function sendCrashReport(includeLogs: boolean): Promise<void> {
  return invoke<void>('send_crash_report', { includeLogs });
}

/**
 * Listen for rollback completed events
 */
export async function onRollbackCompleted(
  callback: (event: RollbackCompletedEvent) => void
): Promise<UnlistenFn> {
  return listen<RollbackCompletedEvent>('rollback:completed', (event) => {
    callback(event.payload);
  });
}

/**
 * Event listener types
 */
export type UpdateAvailableCallback = (event: UpdateAvailableEvent) => void;
export type UpdateProgressCallback = (event: UpdateDownloadProgressEvent) => void;
export type UpdateCompleteCallback = (event: UpdateDownloadCompleteEvent) => void;
export type UpdateErrorCallback = (event: UpdateErrorEvent) => void;

/**
 * Listen for update available events
 *
 * @param callback - Function to call when an update is available
 * @returns Unlisten function to remove the listener
 */
export async function onUpdateAvailable(
  callback: UpdateAvailableCallback
): Promise<UnlistenFn> {
  return listen<UpdateAvailableEvent>('update:available', (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for download progress events
 *
 * @param callback - Function to call with progress updates
 * @returns Unlisten function to remove the listener
 */
export async function onUpdateDownloadProgress(
  callback: UpdateProgressCallback
): Promise<UnlistenFn> {
  return listen<UpdateDownloadProgressEvent>('update:download-progress', (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for download complete events
 *
 * @param callback - Function to call when download completes
 * @returns Unlisten function to remove the listener
 */
export async function onUpdateDownloadComplete(
  callback: UpdateCompleteCallback
): Promise<UnlistenFn> {
  return listen<UpdateDownloadCompleteEvent>('update:download-complete', (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for update error events
 *
 * @param callback - Function to call on error
 * @returns Unlisten function to remove the listener
 */
export async function onUpdateError(
  callback: UpdateErrorCallback
): Promise<UnlistenFn> {
  return listen<UpdateErrorEvent>('update:error', (event) => {
    callback(event.payload);
  });
}

/**
 * Subscribe to all update events at once
 *
 * @param handlers - Object with optional handlers for each event type
 * @returns Function to unsubscribe from all events
 */
export async function subscribeToUpdateEvents(handlers: {
  onAvailable?: UpdateAvailableCallback;
  onProgress?: UpdateProgressCallback;
  onComplete?: UpdateCompleteCallback;
  onError?: UpdateErrorCallback;
}): Promise<() => void> {
  const unlisteners: UnlistenFn[] = [];

  if (handlers.onAvailable) {
    unlisteners.push(await onUpdateAvailable(handlers.onAvailable));
  }
  if (handlers.onProgress) {
    unlisteners.push(await onUpdateDownloadProgress(handlers.onProgress));
  }
  if (handlers.onComplete) {
    unlisteners.push(await onUpdateDownloadComplete(handlers.onComplete));
  }
  if (handlers.onError) {
    unlisteners.push(await onUpdateError(handlers.onError));
  }

  return () => {
    unlisteners.forEach((unlisten) => unlisten());
  };
}
