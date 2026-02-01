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

interface TranscriptStore {
  // State
  transcript: Transcript | null;
  selectedWordIndices: number[];
  isTranscribing: boolean;
  isLoading: boolean;
  transcriptionProgress: TranscriptionProgress;
  error: string | null;
  currentVideoId: string | null;
  currentProjectId: string | null; // Track project ID to prevent race condition

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
}

export const useTranscriptStore = create<TranscriptStore>()(
  devtools(
    (set, get) => ({
      transcript: null,
      selectedWordIndices: [],
      isTranscribing: false,
      isLoading: false,
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

        set({
          selectedWordIndices: isSelected
            ? selectedWordIndices.filter(i => i !== wordIndex)
            : [...selectedWordIndices, wordIndex].sort((a, b) => a - b)
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

        set({ selectedWordIndices: indices });
      },

      clearSelection: () => {
        set({ selectedWordIndices: [] });
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
          const savedTranscript = await invoke('save_transcript', {
            transcriptResult: result,
            projectId,
          });

          set({
            transcript: savedTranscript as Transcript,
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
    }),
    { name: 'TranscriptStore' }
  )
);
