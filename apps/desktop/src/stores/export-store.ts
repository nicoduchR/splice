import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
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
  exportProgress: number | null;
  exportError: string | null;
}

interface ExportActions {
  openExportDialog: () => void;
  closeExportDialog: () => void;
  updateSettings: (partial: Partial<ExportSettings>) => void;
  estimateExportSize: (projectId: string, quality: ExportQuality) => Promise<void>;
  startExport: (projectId: string) => Promise<void>;
  cancelExport: () => void;
  resetExport: () => void;
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

        startExport: async (_projectId) => {
          // Placeholder for Story 6.2
          set({ isExporting: true, exportProgress: 0, exportError: null });
          toast.info('Export bientôt disponible');
        },

        cancelExport: () => {
          set({ isExporting: false, exportProgress: null });
        },

        resetExport: () => {
          set({
            isExporting: false,
            exportProgress: null,
            exportError: null,
          });
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
