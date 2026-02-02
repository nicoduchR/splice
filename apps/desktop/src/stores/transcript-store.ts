import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { Transcript, TranscriptWord } from '@splice/types';

interface TranscriptionProgress {
  video_id: string;
  stage: 'extracting' | 'loading' | 'transcribing' | 'completed';
  progress: number; // 0.0 to 1.0
  message: string;
}

interface TranscriptionResult {
  text: string;
  words: TranscriptWord[];
  language: string;
  confidence?: number;
}

/** Selection range persisted to SQLite */
export interface SelectionRange {
  id: string;
  projectId: string;
  startWordIndex: number;
  endWordIndex: number;
  startTime: number;
  endTime: number;
  createdAt: number;
}

interface TranscriptStore {
  // State
  transcript: Transcript | null;
  selectedWordIndices: number[];
  selections: SelectionRange[];
  isTranscribing: boolean;
  isLoading: boolean;
  transcriptionProgress: TranscriptionProgress;
  error: string | null;
  currentVideoId: string | null;
  currentProjectId: string | null;
  _autoSaveIntervalId: ReturnType<typeof setInterval> | null;
  _selectionsDirty: boolean;

  // Actions
  setTranscript: (transcript: Transcript | null) => void;
  toggleWordSelection: (wordIndex: number) => void;
  setSelection: (startIndex: number, endIndex: number) => void;
  clearSelection: () => void;
  setTranscribing: (isTranscribing: boolean, progress?: number) => void;
  startTranscription: (videoId: string, videoPath: string, projectId: string) => Promise<void>;
  updateTranscriptionProgress: (progress: number, stage: string, message: string) => void;
  cancelTranscription: () => Promise<void>;
  completeTranscription: (result: TranscriptionResult, projectId: string) => Promise<void>;
  loadTranscript: (projectId: string) => Promise<void>;
  toggleSelectionRange: (startIndex: number, endIndex: number) => void;
  setSelectionFromIndices: (indices: number[]) => void;
  loadSelections: (projectId: string) => Promise<void>;
  saveSelections: () => Promise<void>;
  startAutoSave: () => void;
  stopAutoSave: () => void;
}

/** Convert sorted word indices to contiguous selection ranges */
function indicesToSelections(
  indices: number[],
  transcript: Transcript | null,
  projectId: string | null,
): SelectionRange[] {
  if (indices.length === 0 || !transcript || !projectId) return [];

  const ranges: SelectionRange[] = [];
  let rangeStart = indices[0];
  let rangeEnd = indices[0];

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] === rangeEnd + 1) {
      rangeEnd = indices[i];
    } else {
      ranges.push(makeSelectionRange(rangeStart, rangeEnd, transcript, projectId));
      rangeStart = indices[i];
      rangeEnd = indices[i];
    }
  }
  ranges.push(makeSelectionRange(rangeStart, rangeEnd, transcript, projectId));

  return ranges;
}

function makeSelectionRange(
  startIdx: number,
  endIdx: number,
  transcript: Transcript,
  projectId: string,
): SelectionRange {
  const startWord = transcript.words[startIdx];
  const endWord = transcript.words[endIdx];
  return {
    id: crypto.randomUUID(),
    projectId,
    startWordIndex: startIdx,
    endWordIndex: endIdx,
    startTime: startWord?.start_time ?? 0,
    endTime: endWord?.end_time ?? 0,
    createdAt: Math.floor(Date.now() / 1000),
  };
}

/** Convert selection ranges back to a sorted array of word indices */
function selectionsToIndices(selections: SelectionRange[]): number[] {
  const indices: number[] = [];
  for (const sel of selections) {
    for (let i = sel.startWordIndex; i <= sel.endWordIndex; i++) {
      indices.push(i);
    }
  }
  return indices.sort((a, b) => a - b);
}

export const useTranscriptStore = create<TranscriptStore>()(
  devtools(
    (set, get) => ({
      transcript: null,
      selectedWordIndices: [],
      selections: [],
      isTranscribing: false,
      isLoading: false,
      _autoSaveIntervalId: null,
      _selectionsDirty: false,
      transcriptionProgress: {
        video_id: '',
        stage: 'extracting',
        progress: 0,
        message: '',
      },
      error: null,
      currentVideoId: null,
      currentProjectId: null,

      setTranscript: (transcript) => {
        set({ transcript, error: null });
      },

      // Action spécifique avec logique métier
      toggleWordSelection: (wordIndex) => {
        const { selectedWordIndices } = get();
        const isSelected = selectedWordIndices.includes(wordIndex);

        const newIndices = isSelected
          ? selectedWordIndices.filter(i => i !== wordIndex)
          : [...selectedWordIndices, wordIndex].sort((a, b) => a - b);

        set({
          selectedWordIndices: newIndices,
          selections: indicesToSelections(newIndices, get().transcript, get().currentProjectId),
          _selectionsDirty: true,
        });
      },

      // Bulk update avec validation
      setSelection: (startIndex, endIndex) => {
        if (startIndex > endIndex) {
          throw new Error('Invalid selection range');
        }

        const indices = Array.from(
          { length: endIndex - startIndex + 1 },
          (_, i) => startIndex + i
        );

        set({
          selectedWordIndices: indices,
          selections: indicesToSelections(indices, get().transcript, get().currentProjectId),
          _selectionsDirty: true,
        });
      },

      clearSelection: () => {
        set({ selectedWordIndices: [], selections: [], _selectionsDirty: true });
      },

      // Toggle a range: add if not fully selected, remove if fully selected
      toggleSelectionRange: (startIndex, endIndex) => {
        const { selectedWordIndices, transcript, currentProjectId } = get();
        const selectedSet = new Set(selectedWordIndices);

        // Check if the entire range is already selected
        let allSelected = true;
        for (let i = startIndex; i <= endIndex; i++) {
          if (!selectedSet.has(i)) {
            allSelected = false;
            break;
          }
        }

        let newIndices: number[];
        if (allSelected) {
          // Remove the range
          newIndices = selectedWordIndices.filter(i => i < startIndex || i > endIndex);
        } else {
          // Add the range
          for (let i = startIndex; i <= endIndex; i++) {
            selectedSet.add(i);
          }
          newIndices = Array.from(selectedSet).sort((a, b) => a - b);
        }

        set({
          selectedWordIndices: newIndices,
          selections: indicesToSelections(newIndices, transcript, currentProjectId),
          _selectionsDirty: true,
        });
      },

      setTranscribing: (isTranscribing, progress = 0) => {
        set({
          isTranscribing,
          transcriptionProgress: {
            video_id: get().currentVideoId || '',
            stage: 'transcribing',
            progress: progress,
            message: 'Transcription en cours...',
          }
        });
      },

      // Démarrer la transcription
      startTranscription: async (videoId: string, videoPath: string, projectId: string) => {
        set({
          isTranscribing: true,
          currentVideoId: videoId,
          currentProjectId: projectId, // Capture project ID to prevent race condition
          transcriptionProgress: {
            video_id: videoId,
            stage: 'extracting',
            progress: 0,
            message: 'Démarrage de la transcription...',
          },
          error: null,
        });

        try {
          // La commande Tauri va émettre des événements de progression
          // Les erreurs seront gérées via l'événement 'transcription:error'
          await invoke('transcribe_video', {
            videoId,
            videoPath,
          });
        } catch (error) {
          // Erreur d'invocation (pas d'erreur de transcription)
          // Les erreurs de transcription sont gérées via événement
          console.error('Failed to invoke transcribe_video:', error);
          set({
            error: error as string,
            isTranscribing: false,
          });
        }
      },

      // Mettre à jour la progression
      updateTranscriptionProgress: (progress: number, stage: string, message: string) => {
        set({
          transcriptionProgress: {
            video_id: get().currentVideoId || '',
            stage: stage as TranscriptionProgress['stage'],
            progress,
            message,
          },
        });
      },

      // Annuler la transcription
      cancelTranscription: async () => {
        const { currentVideoId } = get();
        if (!currentVideoId) return;

        try {
          await invoke('cancel_transcription', {
            videoId: currentVideoId,
          });

          set({
            isTranscribing: false,
            currentVideoId: null,
            transcriptionProgress: {
              video_id: '',
              stage: 'extracting',
              progress: 0,
              message: '',
            },
          });
        } catch (error) {
          console.error('Failed to cancel transcription:', error);
        }
      },

      // Compléter la transcription
      completeTranscription: async (result: TranscriptionResult, projectId: string) => {

        try {
          // Sauvegarder le transcript dans la base de données
          const savedTranscript = await invoke<{
            id: string;
            project_id: string;
            full_text: string;
            language: string;
            created_at: number;
          }>('save_transcript', {
            transcriptResult: result,
            projectId,
          });


          // Construct full Transcript with words from the original result
          // Note: event payload words are Rust Word structs with {text, start, end, confidence}
          const transcript: Transcript = {
            id: savedTranscript.id,
            project_id: savedTranscript.project_id,
            full_text: savedTranscript.full_text,
            language: savedTranscript.language,
            created_at: savedTranscript.created_at,
            words: result.words.map((w: any, i: number) => ({
              index: i,
              text: w.text,
              start_time: w.start ?? w.start_time ?? 0,
              end_time: w.end ?? w.end_time ?? 0,
              confidence: w.confidence ?? 1.0,
            })),
          };



          set({
            transcript,
            isTranscribing: false,
            currentVideoId: null,
            transcriptionProgress: {
              video_id: '',
              stage: 'completed',
              progress: 1.0,
              message: 'Transcription terminée!',
            },
            error: null,
          });
        } catch (error) {

          set({
            error: error as string,
            isTranscribing: false,
          });
          throw error;
        }
      },

      // Charger un transcript depuis la base de données
      loadTranscript: async (projectId: string) => {

        set({ isLoading: true, error: null });

        try {
          const result = await invoke<{
            transcript: {
              id: string;
              project_id: string;
              full_text: string;
              language: string;
              created_at: number;
            };
            words: Array<{
              id: string;
              transcript_id: string;
              word: string;
              start_time: number;
              end_time: number;
              confidence: number;
              word_index: number;
            }>;
          }>('get_transcript', { projectId });


          if (!result) {

            set({ transcript: null, isLoading: false, error: null });
            return;
          }



          // Convertir en format frontend
          const transcript: Transcript = {
            id: result.transcript.id,
            project_id: result.transcript.project_id,
            full_text: result.transcript.full_text,
            language: result.transcript.language,
            created_at: result.transcript.created_at,
            words: result.words.map((w) => ({
              index: w.word_index,
              text: w.word,
              start_time: w.start_time,
              end_time: w.end_time,
              confidence: w.confidence,
            })),
          };


          set({ transcript, isLoading: false, error: null });
        } catch (error) {

          set({ error: error.toString(), isLoading: false, transcript: null });
        }
      },

      // Set selection from an arbitrary array of indices (for drag merge)
      setSelectionFromIndices: (indices) => {
        const { transcript, currentProjectId } = get();
        set({
          selectedWordIndices: indices,
          selections: indicesToSelections(indices, transcript, currentProjectId),
          _selectionsDirty: true,
        });
      },

      // Charger les sélections depuis la base de données
      loadSelections: async (projectId: string) => {
        try {
          const result = await invoke<Array<{
            id: string;
            project_id: string;
            start_word_index: number;
            end_word_index: number;
            start_time: number;
            end_time: number;
            created_at: number;
          }>>('get_selections', { projectId });

          const selections: SelectionRange[] = (result || []).map(s => ({
            id: s.id,
            projectId: s.project_id,
            startWordIndex: s.start_word_index,
            endWordIndex: s.end_word_index,
            startTime: s.start_time,
            endTime: s.end_time,
            createdAt: s.created_at,
          }));

          const indices = selectionsToIndices(selections);

          set({
            selections,
            selectedWordIndices: indices,
            _selectionsDirty: false,
          });
        } catch (error) {
          console.error('Failed to load selections:', error);
        }
      },

      // Sauvegarder les sélections vers la base de données
      saveSelections: async () => {
        const { selections, currentProjectId, _selectionsDirty } = get();
        if (!currentProjectId || !_selectionsDirty) return;

        try {
          await invoke('save_selections', {
            projectId: currentProjectId,
            selections: selections.map(s => ({
              id: s.id,
              project_id: s.projectId,
              start_word_index: s.startWordIndex,
              end_word_index: s.endWordIndex,
              start_time: s.startTime,
              end_time: s.endTime,
              created_at: s.createdAt,
            })),
          });
          set({ _selectionsDirty: false });
        } catch (error) {
          console.error('Failed to save selections:', error);
        }
      },

      // Démarrer l'auto-save toutes les 30 secondes
      startAutoSave: () => {
        const { _autoSaveIntervalId } = get();
        if (_autoSaveIntervalId) return; // déjà actif

        const intervalId = setInterval(() => {
          get().saveSelections();
        }, 30_000);

        set({ _autoSaveIntervalId: intervalId });
      },

      // Arrêter l'auto-save
      stopAutoSave: () => {
        const { _autoSaveIntervalId } = get();
        if (_autoSaveIntervalId) {
          clearInterval(_autoSaveIntervalId);
          set({ _autoSaveIntervalId: null });
        }
      },
    }),
    { name: 'TranscriptStore' }
  )
);
