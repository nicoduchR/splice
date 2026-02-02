import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTranscriptSearch } from './use-transcript-search';
import type { TranscriptWord } from '@splice/types';

const mockWords: TranscriptWord[] = [
  { index: 0, text: 'Hello', start_time: 0, end_time: 0.5, confidence: 0.9 },
  { index: 1, text: 'world', start_time: 0.5, end_time: 1.0, confidence: 0.95 },
  { index: 2, text: 'this', start_time: 1.0, end_time: 1.5, confidence: 0.92 },
  { index: 3, text: 'is', start_time: 1.5, end_time: 2.0, confidence: 0.88 },
  { index: 4, text: 'hello', start_time: 2.0, end_time: 2.5, confidence: 0.93 },
  { index: 5, text: 'again', start_time: 2.5, end_time: 3.0, confidence: 0.91 },
];

describe('useTranscriptSearch', () => {
  it('should find case-insensitive matches', async () => {
    const { result } = renderHook(() => useTranscriptSearch(mockWords));

    act(() => {
      result.current.setSearchQuery('hello');
    });

    await waitFor(() => {
      expect(result.current.matches).toEqual([0, 4]); // "Hello" et "hello"
    });
  });

  it('should debounce search by 300ms', async () => {
    const { result } = renderHook(() => useTranscriptSearch(mockWords));

    act(() => {
      result.current.setSearchQuery('h');
    });

    // Immédiatement, pas de résultats (debounce en cours)
    expect(result.current.matches).toEqual([]);

    // Après 300ms, résultats apparaissent
    await waitFor(
      () => {
        expect(result.current.matches.length).toBeGreaterThan(0);
      },
      { timeout: 500 }
    );
  });

  it('should clear matches when search query is empty', async () => {
    const { result } = renderHook(() => useTranscriptSearch(mockWords));

    act(() => {
      result.current.setSearchQuery('hello');
    });

    await waitFor(() => {
      expect(result.current.matches.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setSearchQuery('');
    });

    await waitFor(() => {
      expect(result.current.matches).toEqual([]);
    });
  });

  it('should navigate between matches', async () => {
    const { result } = renderHook(() => useTranscriptSearch(mockWords));

    act(() => {
      result.current.setSearchQuery('hello');
    });

    await waitFor(() => {
      expect(result.current.matches).toEqual([0, 4]);
    });

    act(() => {
      result.current.nextMatch();
    });

    expect(result.current.currentMatchIndex).toBe(1);

    act(() => {
      result.current.prevMatch();
    });

    expect(result.current.currentMatchIndex).toBe(0);
  });

  it('should wrap around when navigating past last match', async () => {
    const { result } = renderHook(() => useTranscriptSearch(mockWords));

    act(() => {
      result.current.setSearchQuery('hello');
    });

    await waitFor(() => {
      expect(result.current.matches).toEqual([0, 4]);
    });

    // Go to last match
    act(() => {
      result.current.nextMatch();
    });

    // Wrap around to first
    act(() => {
      result.current.nextMatch();
    });

    expect(result.current.currentMatchIndex).toBe(0);
  });

  it('should wrap around when navigating before first match', async () => {
    const { result } = renderHook(() => useTranscriptSearch(mockWords));

    act(() => {
      result.current.setSearchQuery('hello');
    });

    await waitFor(() => {
      expect(result.current.matches).toEqual([0, 4]);
    });

    // At first match (0), go to previous
    act(() => {
      result.current.prevMatch();
    });

    // Should wrap to last match
    expect(result.current.currentMatchIndex).toBe(1);
  });
});
