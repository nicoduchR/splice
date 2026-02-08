import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscriptKeyboardNav } from './use-transcript-keyboard-nav';
import type { TranscriptWord } from '@splice/types';

// Words with paragraph breaks: paragraph 1 = words 0-4, paragraph 2 = words 5-9
// Gap of 2.0s between word 4 and word 5 triggers HARD_PAUSE_THRESHOLD (1.5s)
const mockWords: TranscriptWord[] = Array.from({ length: 10 }, (_, i) => ({
  index: i,
  text: `word${i}`,
  start_time: i < 5 ? i * 0.5 : 4.0 + (i - 4) * 0.5, // 2.0s gap after word 4
  end_time: i < 5 ? (i + 1) * 0.5 - 0.1 : 4.0 + (i - 4) * 0.5 + 0.4,
  confidence: 0.95,
}));

function createKeyEvent(key: string, options: Partial<React.KeyboardEvent> = {}): React.KeyboardEvent {
  return {
    key,
    preventDefault: vi.fn(),
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    target: document.createElement('div'),
    ...options,
  } as unknown as React.KeyboardEvent;
}

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
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [3], // Currently at index 3
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowRight');
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(4, 4);
    expect(mockScrollToIndex).toHaveBeenCalledWith(4);
  });

  it('should navigate to previous word on ArrowLeft', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [5], // Currently at index 5
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowLeft');
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(4, 4);
    expect(mockScrollToIndex).toHaveBeenCalledWith(4);
  });

  it('should not navigate past last word', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [9], // Currently at last index
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowRight');
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(9, 9); // Stay at 9
  });

  it('should not navigate before first word', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [0], // Currently at first index
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowLeft');
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(0, 0); // Stay at 0
  });

  it('should clear selection on Escape', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [3, 4, 5],
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('Escape');
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  it('should start from index 0 if no selection', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [], // No selection
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowRight');
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(1, 1); // Start from 0, go to 1
  });

  it('should call onUndo on Cmd+Z', () => {
    const mockOnUndo = vi.fn();
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [3],
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex,
        mockOnUndo,
      )
    );

    const event = createKeyEvent('z', { metaKey: true } as Partial<React.KeyboardEvent>);
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnUndo).toHaveBeenCalled();
  });

  it('should call onRedo on Cmd+Shift+Z', () => {
    const mockOnRedo = vi.fn();
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [3],
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex,
        undefined,
        mockOnRedo,
      )
    );

    const event = createKeyEvent('z', { metaKey: true, shiftKey: true } as Partial<React.KeyboardEvent>);
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnRedo).toHaveBeenCalled();
  });

  it('should not call onUndo on Cmd+Shift+Z (that is redo)', () => {
    const mockOnUndo = vi.fn();
    const mockOnRedo = vi.fn();
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [3],
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex,
        mockOnUndo,
        mockOnRedo,
      )
    );

    const event = createKeyEvent('z', { metaKey: true, shiftKey: true } as Partial<React.KeyboardEvent>);
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnUndo).not.toHaveBeenCalled();
    expect(mockOnRedo).toHaveBeenCalled();
  });

  it('should not capture events when input is focused', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [3],
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const input = document.createElement('input');
    const event = createKeyEvent('ArrowRight', { target: input } as unknown as Partial<React.KeyboardEvent>);
    act(() => { result.current.handleKeyDown(event); });

    expect(mockOnSelectionChange).not.toHaveBeenCalled();
  });

  // ArrowUp/ArrowDown paragraph navigation tests
  it('should navigate to next paragraph on ArrowDown', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [2], // Currently at word 2 (paragraph 1)
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowDown');
    act(() => { result.current.handleKeyDown(event); });

    // Should jump to paragraph 2 start (word 5)
    expect(mockOnSelectionChange).toHaveBeenCalledWith(5, 5);
    expect(mockScrollToIndex).toHaveBeenCalledWith(5);
  });

  it('should navigate to previous paragraph on ArrowUp', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [7], // Currently at word 7 (paragraph 2)
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowUp');
    act(() => { result.current.handleKeyDown(event); });

    // Should jump to paragraph 2 start (word 5) since it's the last paragraph start before index 7
    expect(mockOnSelectionChange).toHaveBeenCalledWith(5, 5);
    expect(mockScrollToIndex).toHaveBeenCalledWith(5);
  });

  it('should navigate to paragraph 1 start on ArrowUp from paragraph 2 start', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [5], // At start of paragraph 2
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowUp');
    act(() => { result.current.handleKeyDown(event); });

    // Should jump to paragraph 1 start (word 0)
    expect(mockOnSelectionChange).toHaveBeenCalledWith(0, 0);
    expect(mockScrollToIndex).toHaveBeenCalledWith(0);
  });

  it('should not move on ArrowDown when at last paragraph', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [8], // Near end of last paragraph
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowDown');
    act(() => { result.current.handleKeyDown(event); });

    // No next paragraph — should NOT call selection change
    expect(mockOnSelectionChange).not.toHaveBeenCalled();
  });

  it('should not move on ArrowUp when at first paragraph start', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [0], // At start of first paragraph
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowUp');
    act(() => { result.current.handleKeyDown(event); });

    // No previous paragraph — should NOT call selection change
    expect(mockOnSelectionChange).not.toHaveBeenCalled();
  });

  it('should scroll to the word when navigating paragraphs with ArrowDown', () => {
    const { result } = renderHook(() =>
      useTranscriptKeyboardNav(
        mockWords,
        [0],
        mockOnSelectionChange,
        mockOnClearSelection,
        mockScrollToIndex
      )
    );

    const event = createKeyEvent('ArrowDown');
    act(() => { result.current.handleKeyDown(event); });

    expect(mockScrollToIndex).toHaveBeenCalledWith(5);
  });
});
