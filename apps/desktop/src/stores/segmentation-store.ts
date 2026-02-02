import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import type { SegmentationProgress } from '@splice/types/generated';

export interface ValidationProgress {
  project_id: string;
  current_segment: number;
  total_segments: number;
}

export interface SegmentationStats {
  segment_count: number;
  final_duration_secs: number;
  original_duration_secs: number;
  reduction_percent: number;
}

interface SegmentationStore {
  // State
  isSegmenting: boolean;
  segmentationProgress: SegmentationProgress | null;
  isValidating: boolean;
  validationProgress: ValidationProgress | null;
  isConcatenating: boolean;
  stats: SegmentationStats | null;
  error: string | null;
  finalVideoPath: string | null;

  // Actions
  startSegmentation: (projectId: string) => Promise<void>;
  cancelSegmentation: (projectId: string) => Promise<void>;
  updateProgress: (progress: SegmentationProgress) => void;
  updateValidationProgress: (progress: ValidationProgress) => void;
  setConcatenating: (value: boolean) => void;
  setStats: (stats: SegmentationStats) => void;
  setFinalVideoPath: (path: string) => void;
  resetSegmentation: () => void;
}

export const useSegmentationStore = create<SegmentationStore>()(
  devtools(
    (set) => ({
      // Initial state
      isSegmenting: false,
      segmentationProgress: null,
      isValidating: false,
      validationProgress: null,
      isConcatenating: false,
      stats: null,
      error: null,
      finalVideoPath: null,

      startSegmentation: async (projectId) => {
        set({ isSegmenting: true, segmentationProgress: null, error: null });
        try {
          // Step 1: Generate cuts from text selections
          await invoke('generate_cuts', { projectId });
          // Step 2: Segment video using the generated cuts
          await invoke('segment_video', { projectId });
        } catch (e) {
          const errorMsg = String(e);
          set({ error: errorMsg, isSegmenting: false });
          toast.error('Erreur lors de la génération des cuts', {
            description: errorMsg,
          });
        }
      },

      cancelSegmentation: async (projectId) => {
        try {
          await invoke('cancel_segmentation', { projectId });
          set({ isSegmenting: false, segmentationProgress: null, error: null });
        } catch (e) {
          console.error('Failed to cancel segmentation:', e);
          set({ error: String(e), isSegmenting: false, segmentationProgress: null });
        }
      },

      updateProgress: (progress) => {
        set({ segmentationProgress: progress });
      },

      updateValidationProgress: (progress) => {
        set({ isValidating: true, validationProgress: progress });
      },

      setConcatenating: (value) => {
        set({ isConcatenating: value });
      },

      setStats: (stats) => {
        set({ stats });
      },

      setFinalVideoPath: (path) => {
        set({ finalVideoPath: path });
      },

      resetSegmentation: () => {
        set({ isSegmenting: false, segmentationProgress: null, isValidating: false, validationProgress: null, isConcatenating: false, stats: null, error: null });
        // Note: finalVideoPath is intentionally NOT reset — it persists for preview
      },
    }),
    { name: 'SegmentationStore' }
  )
);
