import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { toast } from 'sonner';

export type ExportQuality = 'preserve' | 'high' | 'medium' | 'low';

export interface ExportSettings {
  quality: ExportQuality;
  outputPath: string;
  fileName: string;
}

export interface ExportEstimate {
  estimated_size_bytes: number;
  estimated_duration_seconds: number;
}

export interface ExportProgressInfo {
  percent: number;
  currentFrame?: number;
  totalFrames?: number;
  speed?: number;
  fps?: number;
  elapsedSecs?: number;
  eta?: number;
  fileSizeBytes?: number;
  estimatedTotalBytes?: number;
}

export interface ExportResult {
  outputPath: string;
  fileSizeBytes: number;
  durationSeconds: number;
}

interface ExportState {
  // Dialog state
  isExportDialogOpen: boolean;
  // Settings
  exportSettings: ExportSettings;
  // Estimates
  estimatedFileSize: number | null;
  estimatedDuration: number | null;
  isEstimating: boolean;
  // Export state (for story 6.2+)
  isExporting: boolean;
  exportProgress: ExportProgressInfo | null;
  exportError: string | null;
  exportResult: ExportResult | null;
  _exportingProjectId: string | null;
  _unlisteners: UnlistenFn[];
}

interface ExportActions {
  openExportDialog: () => void;
  closeExportDialog: () => void;
  updateSettings: (partial: Partial<ExportSettings>) => void;
  estimateExportSize: (projectId: string, quality: ExportQuality) => Promise<void>;
  startExport: (projectId: string) => Promise<void>;
  cancelExport: () => void;
  resetExport: () => void;
  closeExportResult: () => void;
}

type ExportStore = ExportState & ExportActions;

// Persisted defaults (quality + last output dir)
interface PersistedExportDefaults {
  quality: ExportQuality;
  lastOutputDir: string;
}

export const useExportStore = create<ExportStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isExportDialogOpen: false,
        exportSettings: {
          quality: 'preserve' as ExportQuality,
          outputPath: '',
          fileName: '',
        },
        estimatedFileSize: null,
        estimatedDuration: null,
        isEstimating: false,
        isExporting: false,
        exportProgress: null,
        exportError: null,
        exportResult: null,
        _exportingProjectId: null,
        _unlisteners: [],

        openExportDialog: () => {
          set({ isExportDialogOpen: true, exportError: null });
        },

        closeExportDialog: () => {
          set({ isExportDialogOpen: false });
        },

        updateSettings: (partial) => {
          const current = get().exportSettings;
          set({ exportSettings: { ...current, ...partial } });
        },

        estimateExportSize: async (projectId, quality) => {
          set({ isEstimating: true });
          try {
            const estimate = await invoke<ExportEstimate>('estimate_export', {
              projectId,
              quality,
            });
            set({
              estimatedFileSize: estimate.estimated_size_bytes,
              estimatedDuration: estimate.estimated_duration_seconds,
              isEstimating: false,
            });
          } catch (e) {
            console.error('Failed to estimate export size:', e);
            set({ isEstimating: false, estimatedFileSize: null, estimatedDuration: null });
          }
        },

        startExport: async (projectId) => {
          const { exportSettings } = get();
          set({ isExporting: true, exportProgress: { percent: 0 }, exportError: null, _exportingProjectId: projectId });

          // Set up event listeners
          const unlisteners: UnlistenFn[] = [];

          try {
            const unlistenProgress = await listen<{
              project_id: string;
              progress: number;
              current_time: number;
              total_duration: number;
              encoding_speed: number;
              current_frame: number | null;
              total_frames: number | null;
              fps: number | null;
              elapsed_secs: number;
              eta_secs: number | null;
              file_size_bytes: number | null;
              estimated_total_bytes: number | null;
            }>('export:progress', (event) => {
              const p = event.payload;
              set({
                exportProgress: {
                  percent: p.progress,
                  currentFrame: p.current_frame ?? undefined,
                  totalFrames: p.total_frames ?? undefined,
                  speed: p.encoding_speed,
                  fps: p.fps ?? undefined,
                  elapsedSecs: p.elapsed_secs,
                  eta: p.eta_secs ?? undefined,
                  fileSizeBytes: p.file_size_bytes ?? undefined,
                  estimatedTotalBytes: p.estimated_total_bytes ?? undefined,
                },
              });
            });
            unlisteners.push(unlistenProgress);

            const unlistenCompleted = await listen<{
              project_id: string;
              output_path: string;
              file_size: number;
              duration_seconds: number;
            }>('export:completed', async (event) => {
              // Extract filename from path for cleaner toast
              const fileName = event.payload.output_path.split('/').pop() || event.payload.output_path;
              set({
                isExporting: false,
                exportProgress: { percent: 100 },
                exportResult: {
                  outputPath: event.payload.output_path,
                  fileSizeBytes: event.payload.file_size,
                  durationSeconds: event.payload.duration_seconds,
                },
              });
              toast.success(`Vidéo exportée: ${fileName}`);

              // Send system notification if app is not in foreground
              if (document.hidden) {
                try {
                  const { isPermissionGranted, requestPermission, sendNotification } = await import('@tauri-apps/plugin-notification');
                  let granted = await isPermissionGranted();
                  if (!granted) {
                    const permission = await requestPermission();
                    granted = permission === 'granted';
                  }
                  if (granted) {
                    const fileName = event.payload.output_path.split('/').pop() || 'video';
                    sendNotification({
                      title: 'Export terminé',
                      body: `${fileName} exporté avec succès`,
                    });
                  }
                } catch (e) {
                  console.warn('Notification not available:', e);
                }
              }
            });
            unlisteners.push(unlistenCompleted);

            const unlistenError = await listen<{
              project_id: string;
              error: string;
            }>('export:error', (event) => {
              set({ isExporting: false, exportError: event.payload.error });
              toast.error(`Erreur d'export : ${event.payload.error}`);
            });
            unlisteners.push(unlistenError);

            // Store unlisteners in state for cancelExport/resetExport access
            set({ _unlisteners: unlisteners });

            await invoke('export_video', {
              projectId,
              quality: exportSettings.quality,
              outputPath: exportSettings.outputPath,
              fileName: exportSettings.fileName,
            });
          } catch (e) {
            // Only handle if not already handled by export:error event
            if (get().isExporting) {
              const errorMsg = typeof e === 'string' ? e : String(e);
              set({ isExporting: false, exportError: errorMsg });
              toast.error(`Erreur d'export : ${errorMsg}`);
            }
          } finally {
            // Clean up listeners
            for (const unlisten of unlisteners) {
              unlisten();
            }
            set({ _unlisteners: [] });
          }
        },

        cancelExport: () => {
          // Clean up listeners
          for (const unlisten of get()._unlisteners) {
            unlisten();
          }
          // Best-effort cancel on backend
          const pid = get()._exportingProjectId;
          if (pid) {
            invoke('cancel_export', { projectId: pid }).catch(() => {});
          }
          set({ isExporting: false, exportProgress: null, _unlisteners: [] });
        },

        resetExport: () => {
          for (const unlisten of get()._unlisteners) {
            unlisten();
          }
          set({
            isExporting: false,
            exportProgress: null,
            exportError: null,
            exportResult: null,
            _unlisteners: [],
          });
        },

        closeExportResult: () => {
          set({ exportResult: null });
        },
      }),
      {
        name: 'splice-export-settings',
        partialize: (state) => ({
          quality: state.exportSettings.quality,
          lastOutputDir: state.exportSettings.outputPath,
        } as PersistedExportDefaults),
        merge: (persisted, currentState) => {
          const defaults = persisted as PersistedExportDefaults | undefined;
          if (!defaults) return currentState;
          return {
            ...currentState,
            exportSettings: {
              ...currentState.exportSettings,
              quality: defaults.quality || 'preserve',
              outputPath: defaults.lastOutputDir || '',
            },
          };
        },
      }
    ),
    { name: 'ExportStore' }
  )
);
