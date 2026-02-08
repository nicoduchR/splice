import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimelineKeyboardNav } from './use-timeline-keyboard-nav';
import { useTimelineStore } from '../stores/timeline-store';

describe('useTimelineKeyboardNav', () => {
  beforeEach(() => {
    // Reset timeline store state
    useTimelineStore.setState({
      currentTime: 10,
      duration: 100,
      isPlaying: false,
      volume: 0.7,
      isSeeking: false,
      segments: [],
    });
  });

  function createKeyEvent(key: string, options: Partial<React.KeyboardEvent> = {}): React.KeyboardEvent {
    return {
      key,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      shiftKey: false,
      target: document.createElement('div'),
      ...options,
    } as unknown as React.KeyboardEvent;
  }

  it('should seek forward one frame on ArrowRight', () => {
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const event = createKeyEvent('ArrowRight');

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    // 10 + 1/30 ≈ 10.0333
    expect(useTimelineStore.getState().currentTime).toBeCloseTo(10 + 1 / 30, 4);
  });

  it('should seek backward one frame on ArrowLeft', () => {
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const event = createKeyEvent('ArrowLeft');

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(useTimelineStore.getState().currentTime).toBeCloseTo(10 - 1 / 30, 4);
  });

  it('should seek forward 5 seconds on Shift+ArrowRight', () => {
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const event = createKeyEvent('ArrowRight', { shiftKey: true } as Partial<React.KeyboardEvent>);

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(useTimelineStore.getState().currentTime).toBe(15);
  });

  it('should seek backward 5 seconds on Shift+ArrowLeft', () => {
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const event = createKeyEvent('ArrowLeft', { shiftKey: true } as Partial<React.KeyboardEvent>);

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(useTimelineStore.getState().currentTime).toBe(5);
  });

  it('should seek to beginning on Home', () => {
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const event = createKeyEvent('Home');

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(useTimelineStore.getState().currentTime).toBe(0);
  });

  it('should seek to end on End', () => {
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const event = createKeyEvent('End');

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(useTimelineStore.getState().currentTime).toBe(100);
  });

  it('should not go below 0 on ArrowLeft', () => {
    useTimelineStore.setState({ currentTime: 0 });
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const event = createKeyEvent('ArrowLeft');

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(useTimelineStore.getState().currentTime).toBe(0);
  });

  it('should not exceed duration on ArrowRight', () => {
    useTimelineStore.setState({ currentTime: 100, duration: 100 });
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const event = createKeyEvent('ArrowRight');

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(useTimelineStore.getState().currentTime).toBe(100);
  });

  it('should not capture events when input is focused', () => {
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const input = document.createElement('input');
    const event = createKeyEvent('ArrowRight', { target: input } as unknown as Partial<React.KeyboardEvent>);

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(useTimelineStore.getState().currentTime).toBe(10); // unchanged
  });

  it('should not capture events when textarea is focused', () => {
    const { result } = renderHook(() => useTimelineKeyboardNav());
    const textarea = document.createElement('textarea');
    const event = createKeyEvent('ArrowRight', { target: textarea } as unknown as Partial<React.KeyboardEvent>);

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(useTimelineStore.getState().currentTime).toBe(10); // unchanged
  });
});
