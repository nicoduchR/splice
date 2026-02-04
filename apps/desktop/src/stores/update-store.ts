import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UnlistenFn } from '@tauri-apps/api/event';
import type {
  UpdateInfo,
  DownloadProgress,
  UpdateStatus,
} from '../types/update';
import {
  checkForUpdate as checkForUpdateApi,
  downloadUpdate as downloadUpdateApi,
  cancelUpdateDownload as cancelUpdateDownloadApi,
  getUpdateStatus as getUpdateStatusApi,
  installUpdate as installUpdateApi,
  subscribeToUpdateEvents,
} from '../services/update-service';

interface UpdateStore {
  // State
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  downloadProgress: DownloadProgress | null;
  error: string | null;
  isChecking: boolean;
  isDownloading: boolean;

  // Actions
  checkForUpdate: () => Promise<void>;
  startDownload: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  installUpdate: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;

  // Event subscription
  initEventListeners: () => Promise<() => void>;
}

const initialState = {
  status: 'idle' as UpdateStatus,
  updateInfo: null,
  downloadProgress: null,
  error: null,
  isChecking: false,
  isDownloading: false,
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
       * Initialize Tauri event listeners for update events
       *
       * Should be called once on app mount. Returns an unlisten function
       * that should be called on unmount.
       */
      initEventListeners: async () => {
        const unsubscribe = await subscribeToUpdateEvents({
          onAvailable: (event) => {
            set({
              status: 'available',
              updateInfo: {
                version: event.version,
                release_date: '',
                release_notes: event.releaseNotes,
                download_url: '',
                is_mandatory: event.isMandatory,
              },
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

        return unsubscribe;
      },
    }),
    { name: 'UpdateStore' }
  )
);
