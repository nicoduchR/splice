import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Transcript, TranscriptWord } from '@splice/types/generated';

interface TranscriptStore {
  // State
  transcript: Transcript | null;
  selectedWordIndices: number[];
  isTranscribing: boolean;
  transcriptionProgress: number;
  error: string | null;

  // Actions
  setTranscript: (transcript: Transcript | null) => void;
  toggleWordSelection: (wordIndex: number) => void;
  setSelection: (startIndex: number, endIndex: number) => void;
  clearSelection: () => void;
  setTranscribing: (isTranscribing: boolean, progress?: number) => void;
}

export const useTranscriptStore = create<TranscriptStore>()(
  devtools(
    (set, get) => ({
      transcript: null,
      selectedWordIndices: [],
      isTranscribing: false,
      transcriptionProgress: 0,
      error: null,

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
        set({ isTranscribing, transcriptionProgress: progress });
      },
    }),
    { name: 'TranscriptStore' }
  )
);
