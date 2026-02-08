import { useCallback, useMemo } from 'react';
import type { TranscriptWord } from '@splice/types';
import { detectParagraphs } from '../utils/transcript-utils';

export function useTranscriptKeyboardNav(
  words: TranscriptWord[] | undefined,
  selectedIndices: number[],
  onSelectionChange: (start: number, end: number) => void,
  onClearSelection?: () => void,
  scrollToIndex?: (index: number) => void,
  onUndo?: () => void,
  onRedo?: () => void,
) {
  // Compute paragraph starts for ArrowUp/ArrowDown navigation
  const paragraphStarts = useMemo(() => detectParagraphs(words), [words]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Guard: skip if input/textarea focused
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    )
      return;

    if (!words || words.length === 0) return;

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

    // ArrowDown: navigate to next paragraph
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Find the next paragraph start after current index
      const nextParagraphStart = paragraphStarts.find((start) => start > currentIndex);
      if (nextParagraphStart !== undefined) {
        onSelectionChange(nextParagraphStart, nextParagraphStart);
        scrollToIndex?.(nextParagraphStart);
      }
      // If no next paragraph, stay at current position
    }

    // ArrowUp: navigate to previous paragraph
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Find the previous paragraph start before current index
      let prevParagraphStart: number | undefined;
      for (let i = paragraphStarts.length - 1; i >= 0; i--) {
        if (paragraphStarts[i] < currentIndex) {
          prevParagraphStart = paragraphStarts[i];
          break;
        }
      }
      if (prevParagraphStart !== undefined) {
        onSelectionChange(prevParagraphStart, prevParagraphStart);
        scrollToIndex?.(prevParagraphStart);
      }
      // If no previous paragraph, stay at current position
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onClearSelection?.();
    }

    // Undo: Cmd+Z (Mac) / Ctrl+Z (Win)
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      onUndo?.();
    }

    // Redo: Cmd+Shift+Z (Mac) / Ctrl+Shift+Z (Win)
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      onRedo?.();
    }
  }, [words, selectedIndices, paragraphStarts, onSelectionChange, onClearSelection, scrollToIndex, onUndo, onRedo]);

  return { handleKeyDown };
}
