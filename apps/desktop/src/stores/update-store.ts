import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UnlistenFn } from '@tauri-apps/api/event';
import type {
  UpdateInfo,
  DownloadProgress,
  UpdateStatus,
  BackupInfo,
  RollbackCompletedEvent,
} from '../types/update';
import {
  checkForUpdate as checkForUpdateApi,
  downloadUpdate as downloadUpdateApi,
  cancelUpdateDownload as cancelUpdateDownloadApi,
  getUpdateStatus as getUpdateStatusApi,
  installUpdate as installUpdateApi,
  setInstallOnQuit as setInstallOnQuitApi,
  subscribeToUpdateEvents,
  getBackupInfo as getBackupInfoApi,
  manualRollback as manualRollbackApi,
  sendCrashReport as sendCrashReportApi,
  onRollbackCompleted,
} from '../services/update-service';

interface UpdateStore {
  // State
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  downloadProgress: DownloadProgress | null;
  error: string | null;
  isChecking: boolean;
  isDownloading: boolean;
  installOnQuit: boolean;
  remindLaterUntil: number | null;
  remindLaterVersion: string | null;
  showNotification: boolean;

  // Rollback state (Story 8.3)
  backupInfo: BackupInfo | null;
  rollbackCompleted: RollbackCompletedEvent | null;

  // Actions
  checkForUpdate: () => Promise<void>;
  startDownload: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  installUpdate: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;
  setInstallOnQuit: (value: boolean) => Promise<void>;
  remindLater: () => void;
  shouldShowNotification: (isBusy: boolean) => boolean;

  // Rollback actions (Story 8.3)
  fetchBackupInfo: () => Promise<void>;
  performManualRollback: () => Promise<void>;
  sendCrashReport: (includeLogs: boolean) => Promise<void>;
  clearRollbackNotification: () => void;

  // Event subscription
  initEventListeners: () => Promise<() => void>;
}

const REMIND_LATER_KEY = 'splice_remind_later_until';
const REMIND_LATER_VERSION_KEY = 'splice_remind_later_version';
const REMIND_LATER_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const initialState = {
  status: 'idle' as UpdateStatus,
  updateInfo: null,
  downloadProgress: null,
  error: null,
  isChecking: false,
  isDownloading: false,
  installOnQuit: false,
  remindLaterUntil: null as number | null,
  remindLaterVersion: null as string | null,
  showNotification: false,
  backupInfo: null as BackupInfo | null,
  rollbackCompleted: null as RollbackCompletedEvent | null,
};

export const useUpdateStore = create<UpdateStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Check for available updates
       *
       * Sets status to 'checking' while in progress, then updates
       * to 'available' or 'up_to_date' based on result.
       */
      checkForUpdate: async () => {
        set({ isChecking: true, error: null, status: 'checking' });

        try {
          const response = await checkForUpdateApi();

          if (response.error) {
            set({
              status: 'error',
              error: response.error,
              isChecking: false,
            });
            return;
          }

          if (response.updateInfo) {
            set({
              status: 'available',
              updateInfo: response.updateInfo,
              isChecking: false,
            });
          } else {
            set({
              status: 'up_to_date',
              updateInfo: null,
              isChecking: false,
            });
          }
        } catch (e) {
          console.debug('Update check failed:', e);
          set({
            status: 'error',
            error: String(e),
            isChecking: false,
          });
        }
      },

      /**
       * Start downloading an available update
       *
       * Download progress is reported via Tauri events and handled
       * by the event listeners initialized with initEventListeners().
       */
      startDownload: async () => {
        const { status, updateInfo } = get();

        if (status !== 'available' || !updateInfo) {
          console.debug('Cannot start download: no update available');
          return;
        }

        set({
          isDownloading: true,
          status: 'downloading',
          downloadProgress: { percent: 0, downloaded_bytes: 0, total_bytes: 0 },
          error: null,
        });

        try {
          const response = await downloadUpdateApi();

          if (response.error) {
            set({
              status: 'error',
              error: response.error,
              isDownloading: false,
            });
          }
          // Success is handled by event listeners (update:download-complete)
        } catch (e) {
          console.error('Download failed:', e);
          set({
            status: 'error',
            error: String(e),
            isDownloading: false,
          });
        }
      },

      /**
       * Cancel an ongoing download
       */
      cancelDownload: async () => {
        try {
          await cancelUpdateDownloadApi();
          set({
            status: 'available', // Keep update available for retry
            isDownloading: false,
            downloadProgress: null,
          });
        } catch (e) {
          console.error('Failed to cancel download:', e);
        }
      },

      /**
       * Install the downloaded update and restart
       *
       * Warning: This will close the app.
       */
      installUpdate: async () => {
        const { status } = get();

        if (status !== 'ready') {
          console.debug('Cannot install: update not ready');
          return;
        }

        try {
          await installUpdateApi();
          // App will restart, no state update needed
        } catch (e) {
          console.error('Install failed:', e);
          set({
            status: 'error',
            error: String(e),
          });
        }
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset to initial state
       */
      resetState: () => {
        set(initialState);
      },

      /**
       * Set install on quit flag — persists to Rust backend
       */
      setInstallOnQuit: async (value: boolean) => {
        try {
          await setInstallOnQuitApi(value);
          set({ installOnQuit: value });
        } catch (e) {
          console.error('Failed to set install on quit:', e);
        }
      },

      /**
       * Remind later — hide notification for 24 hours
       */
      remindLater: () => {
        const until = Date.now() + REMIND_LATER_DURATION;
        const version = get().updateInfo?.version || null;
        localStorage.setItem(REMIND_LATER_KEY, String(until));
        if (version) {
          localStorage.setItem(REMIND_LATER_VERSION_KEY, version);
        }
        set({ remindLaterUntil: until, remindLaterVersion: version, showNotification: false });
      },

      /**
       * Check whether the notification badge should be shown
       */
      shouldShowNotification: (isBusy: boolean): boolean => {
        const { status, installOnQuit, remindLaterUntil } = get();
        if (status !== 'ready') return false;
        if (installOnQuit) return false;
        if (isBusy) return false;
        if (remindLaterUntil && Date.now() < remindLaterUntil) return false;
        return true;
      },

      /**
       * Fetch backup info for rollback UI
       */
      fetchBackupInfo: async () => {
        try {
          const info = await getBackupInfoApi();
          set({ backupInfo: info });
        } catch (e) {
          console.debug('Failed to fetch backup info:', e);
          set({ backupInfo: null });
        }
      },

      /**
       * Perform manual rollback to previous version
       *
       * Warning: This will restart the app.
       */
      performManualRollback: async () => {
        try {
          await manualRollbackApi();
          // App will restart, no state update needed
        } catch (e) {
          console.error('Manual rollback failed:', e);
          set({ error: String(e) });
        }
      },

      /**
       * Send crash report to backend
       */
      sendCrashReport: async (includeLogs: boolean) => {
        try {
          await sendCrashReportApi(includeLogs);
        } catch (e) {
          console.error('Failed to send crash report:', e);
        }
      },

      /**
       * Clear the rollback notification
       */
      clearRollbackNotification: () => {
        set({ rollbackCompleted: null });
      },

      /**
       * Initialize Tauri event listeners for update events
       *
       * Should be called once on app mount. Returns an unlisten function
       * that should be called on unmount.
       */
      initEventListeners: async () => {
        // Load remindLater state from localStorage
        const storedRemindUntil = localStorage.getItem(REMIND_LATER_KEY);
        const storedRemindVersion = localStorage.getItem(REMIND_LATER_VERSION_KEY);
        if (storedRemindUntil) {
          const until = Number(storedRemindUntil);
          set({
            remindLaterUntil: until,
            remindLaterVersion: storedRemindVersion,
          });
        }

        // Listen for rollback:completed event (Story 8.3)
        const unlistenRollback = await onRollbackCompleted((event) => {
          set({ rollbackCompleted: event });
        });

        const unsubscribe = await subscribeToUpdateEvents({
          onAvailable: (event) => {
            // Reset remindLater if a NEW version is detected
            const { remindLaterVersion } = get();
            const isNewVersion = remindLaterVersion && remindLaterVersion !== event.version;
            if (isNewVersion) {
              localStorage.removeItem(REMIND_LATER_KEY);
              localStorage.removeItem(REMIND_LATER_VERSION_KEY);
            }

            set({
              status: 'available',
              updateInfo: {
                version: event.version,
                release_date: '',
                release_notes: event.releaseNotes,
                download_url: '',
                is_mandatory: event.isMandatory,
              },
              ...(isNewVersion ? { remindLaterUntil: null, remindLaterVersion: null } : {}),
            });
          },

          onProgress: (event) => {
            set({
              downloadProgress: {
                percent: event.percent,
                downloaded_bytes: event.downloadedBytes,
                total_bytes: event.totalBytes,
              },
            });
          },

          onComplete: (_event) => {
            const { updateInfo } = get();
            set({
              status: 'ready',
              isDownloading: false,
              downloadProgress: {
                percent: 100,
                downloaded_bytes: get().downloadProgress?.total_bytes || 0,
                total_bytes: get().downloadProgress?.total_bytes || 0,
              },
            });
            console.info('Update ready to install:', updateInfo?.version);
          },

          onError: (event) => {
            set({
              status: 'error',
              error: event.message,
              isDownloading: false,
            });
          },
        });

        return () => {
          unsubscribe();
          unlistenRollback();
        };
      },
    }),
    { name: 'UpdateStore' }
  )
);
