import { useEffect } from 'react';
import type { TranscriptWord } from '@splice/types';

export function useTranscriptKeyboardNav(
  words: TranscriptWord[],
  selectedIndices: number[],
  onSelectionChange: (start: number, end: number) => void,
  onClearSelection?: () => void,
  scrollToIndex?: (index: number) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get current selected index
      const currentIndex =
        selectedIndices.length > 0
          ? selectedIndices[selectedIndices.length - 1]
          : 0;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, words.length - 1);
        onSelectionChange(nextIndex, nextIndex);
        scrollToIndex?.(nextIndex);
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        onSelectionChange(prevIndex, prevIndex);
        scrollToIndex?.(prevIndex);
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClearSelection?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndices, words.length, onSelectionChange, onClearSelection, scrollToIndex]);
}
