import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { sanitizeErrorForUser, getErrorWithGuidance } from '../lib/error-messages';
import { logError } from '../lib/logger';
import type { SegmentationProgress } from '@splice/types/generated';
import { useTranscriptStore, type SelectionRange } from './transcript-store';

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

interface PersistedSelectionPayload {
  id: string;
  project_id: string;
  start_word_index: number;
  end_word_index: number;
  start_time: number;
  end_time: number;
  created_at: number;
}

function makeSelectionId(index: number): string {
  const cryptoObj = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `selection-${Date.now()}-${index}`;
}

function toPersistedSelections(
  selections: SelectionRange[],
  projectId: string,
): PersistedSelectionPayload[] {
  return selections.map((selection) => ({
    id: selection.id,
    project_id: projectId,
    start_word_index: selection.startWordIndex,
    end_word_index: selection.endWordIndex,
    start_time: selection.startTime,
    end_time: selection.endTime,
    created_at: selection.createdAt,
  }));
}

function buildKeepSelectionsFromRemovedWords(
  words: Array<{ index: number; start_time: number; end_time: number }>,
  removedWordIndices: number[],
  projectId: string,
): PersistedSelectionPayload[] {
  if (!words.length) return [];

  const orderedWords = [...words].sort((a, b) => a.index - b.index);
  const indexToWord = new Map(orderedWords.map((word) => [word.index, word]));
  const removedSet = new Set(removedWordIndices);
  const keepIndices = orderedWords
    .filter((word) => !removedSet.has(word.index))
    .map((word) => word.index);

  if (!keepIndices.length) return [];

  const now = Math.floor(Date.now() / 1000);
  const result: PersistedSelectionPayload[] = [];
  let rangeStart = keepIndices[0];
  let rangeEnd = keepIndices[0];

  for (let i = 1; i < keepIndices.length; i++) {
    if (keepIndices[i] === rangeEnd + 1) {
      rangeEnd = keepIndices[i];
      continue;
    }

    const startWord = indexToWord.get(rangeStart);
    const endWord = indexToWord.get(rangeEnd);
    if (startWord && endWord) {
      result.push({
        id: makeSelectionId(result.length),
        project_id: projectId,
        start_word_index: rangeStart,
        end_word_index: rangeEnd,
        start_time: startWord.start_time,
        end_time: endWord.end_time,
        created_at: now,
      });
    }

    rangeStart = keepIndices[i];
    rangeEnd = keepIndices[i];
  }

  const lastStartWord = indexToWord.get(rangeStart);
  const lastEndWord = indexToWord.get(rangeEnd);
  if (lastStartWord && lastEndWord) {
    result.push({
      id: makeSelectionId(result.length),
      project_id: projectId,
      start_word_index: rangeStart,
      end_word_index: rangeEnd,
      start_time: lastStartWord.start_time,
      end_time: lastEndWord.end_time,
      created_at: now,
    });
  }

  return result;
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
          const transcriptState = useTranscriptStore.getState();
          const currentTranscript = transcriptState.transcript;
          const isRemoveMode = transcriptState.selectionMode === 'remove';

          if (
            isRemoveMode
            && (
              !currentTranscript
              || currentTranscript.project_id !== projectId
              || !currentTranscript.words.length
            )
          ) {
            throw new Error(
              'Transcript introuvable pour générer les cuts en mode suppression.'
            );
          }

          if (isRemoveMode && currentTranscript) {
            const originalSelections = toPersistedSelections(
              transcriptState.selections,
              projectId
            );
            const keepSelections = buildKeepSelectionsFromRemovedWords(
              currentTranscript.words,
              transcriptState.selectedWordIndices,
              projectId
            );

            await invoke('save_selections', { projectId, selections: keepSelections });
            try {
              await invoke('generate_cuts', { projectId });
            } finally {
              try {
                await invoke('save_selections', {
                  projectId,
                  selections: originalSelections,
                });
              } catch (restoreError) {
                logError('SegmentationStore.restoreSelectionsAfterGenerateCuts', restoreError);
              }
            }
          } else {
            await invoke('generate_cuts', { projectId });
          }

          // Step 2: Segment video using the generated cuts
          await invoke('segment_video', { projectId });
        } catch (e) {
          const errorMsg = sanitizeErrorForUser(String(e));
          const guidance = getErrorWithGuidance(String(e));
          set({ error: errorMsg, isSegmenting: false });
          toast.error(guidance.title, {
            description: guidance.description,
          });
        }
      },

      cancelSegmentation: async (projectId) => {
        try {
          await invoke('cancel_segmentation', { projectId });
          set({ isSegmenting: false, segmentationProgress: null, error: null });
        } catch (e) {
          logError('SegmentationStore.cancelSegmentation', e);
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
          const errorMsg = sanitizeErrorForUser(String(e));
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
