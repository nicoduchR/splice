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

export interface SegmentBoundary {
  index: number;
  start_time: number;
  end_time: number;
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
  isPreparingPreview: boolean;
  previewPath: string | null;
  previewError: string | null;
  segmentBoundaries: SegmentBoundary[];

  // Actions
  startSegmentation: (projectId: string) => Promise<void>;
  cancelSegmentation: (projectId: string) => Promise<void>;
  updateProgress: (progress: SegmentationProgress) => void;
  updateValidationProgress: (progress: ValidationProgress) => void;
  setConcatenating: (value: boolean) => void;
  setStats: (stats: SegmentationStats) => void;
  setFinalVideoPath: (path: string) => void;
  resetSegmentation: () => void;
  preparePreview: (projectId: string) => Promise<void>;
  setPreviewReady: (path: string) => void;
  setPreviewError: (error: string) => void;
  setSegmentBoundaries: (boundaries: SegmentBoundary[]) => void;
  resetPreview: () => void;
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
      isPreparingPreview: false,
      previewPath: null,
      previewError: null,
      segmentBoundaries: [],

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
        // Also reset preview state since segments may have changed
        set({ previewPath: null, previewError: null, segmentBoundaries: [] });
      },

      preparePreview: async (projectId) => {
        set({ isPreparingPreview: true, previewError: null });
        try {
          const previewPath = await invoke<string>('prepare_preview', { projectId });
          // Fetch segment boundaries for timeline markers
          try {
            const boundaries = await invoke<SegmentBoundary[]>('get_segment_boundaries', { projectId });
            set({ previewPath, isPreparingPreview: false, segmentBoundaries: boundaries });
          } catch {
            // Boundaries fetch failed — still show preview without markers
            set({ previewPath, isPreparingPreview: false });
          }
        } catch (e) {
          const errorMsg = String(e);
          set({ previewError: errorMsg, isPreparingPreview: false });
          toast.error('Erreur lors de la préparation du preview', {
            description: errorMsg,
          });
        }
      },

      setPreviewReady: (path) => {
        set({ previewPath: path, isPreparingPreview: false, previewError: null });
      },

      setPreviewError: (error) => {
        set({ previewError: error, isPreparingPreview: false });
      },

      setSegmentBoundaries: (boundaries) => {
        set({ segmentBoundaries: boundaries });
      },

      resetPreview: () => {
        set({ isPreparingPreview: false, previewPath: null, previewError: null, segmentBoundaries: [] });
      },
    }),
    { name: 'SegmentationStore' }
  )
);
