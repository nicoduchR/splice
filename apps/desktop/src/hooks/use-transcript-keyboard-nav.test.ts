import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranscriptKeyboardNav } from './use-transcript-keyboard-nav';
import type { TranscriptWord } from '@splice/types';

const mockWords: TranscriptWord[] = Array.from({ length: 10 }, (_, i) => ({
  index: i,
  text: `word${i}`,
  start_time: i * 0.5,
  end_time: (i + 1) * 0.5,
  confidence: 0.95,
}));

describe('useTranscriptKeyboardNav', () => {
  let mockOnSelectionChange: ReturnType<typeof vi.fn>;
  let mockOnClearSelection: ReturnType<typeof vi.fn>;
  let mockScrollToIndex: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSelectionChange = vi.fn();
    mockOnClearSelection = vi.fn();
    mockScrollToIndex = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should navigate to next word on ArrowRight', () => {
    renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [3], // Currently at index 3
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    window.dispatchEvent(event);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(4, 4);
    expect(mockScrollToIndex).toHaveBeenCalledWith(4);
  });

  it('should navigate to previous word on ArrowLeft', () => {
    renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [5], // Currently at index 5
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    window.dispatchEvent(event);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(4, 4);
    expect(mockScrollToIndex).toHaveBeenCalledWith(4);
  });

  it('should not navigate past last word', () => {
    renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [9], // Currently at last index
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    window.dispatchEvent(event);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(9, 9); // Stay at 9
  });

  it('should not navigate before first word', () => {
    renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [0], // Currently at first index
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    window.dispatchEvent(event);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(0, 0); // Stay at 0
  });

  it('should clear selection on Escape', () => {
    renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [3, 4, 5],
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  it('should start from index 0 if no selection', () => {
    renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [], // No selection
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    window.dispatchEvent(event);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(1, 1); // Start from 0, go to 1
  });

  it('should cleanup event listener on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [3],
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
