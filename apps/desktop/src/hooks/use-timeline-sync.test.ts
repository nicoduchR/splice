import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimelineSync } from './use-timeline-sync';
import { useTranscriptStore } from '../stores/transcript-store';
import { useTimelineStore } from '../stores/timeline-store';
import type { Transcript } from '@splice/types';

// Mock Tauri invoke to prevent errors
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

function makeTranscript(wordCount: number): Transcript {
  return {
    id: 'test-id',
    project_id: 'proj-1',
    full_text: Array.from({ length: wordCount }, (_, i) => `word${i}`).join(' '),
    language: 'fr',
    created_at: 1000,
    words: Array.from({ length: wordCount }, (_, i) => ({
      index: i,
      text: `word${i}`,
      start_time: i * 0.5,
      end_time: (i + 1) * 0.5,
      confidence: 0.95,
    })),
  };
}

describe('useTimelineSync', () => {
  beforeEach(() => {
    // Reset stores
    useTranscriptStore.setState({
      transcript: null,
      selections: [],
      selectedWordIndices: [],
      currentProjectId: null,
    });
    useTimelineStore.setState({
      segments: [],
      duration: 0,
      currentTime: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should set empty segments when selections are empty', () => {
    useTranscriptStore.setState({
      transcript: makeTranscript(10),
      selections: [],
    });

    renderHook(() => useTimelineSync());

    const { segments, duration } = useTimelineStore.getState();
    expect(segments).toEqual([]);
    expect(duration).toBe(5); // 10 words * 0.5s each, last end_time = 5
  });

  it('should create 1 segment from 1 selection', () => {
    useTranscriptStore.setState({
      transcript: makeTranscript(10),
      selections: [
        {
          id: 'sel-1',
          projectId: 'proj-1',
          startWordIndex: 2,
          endWordIndex: 4,
          startTime: 1.0,
          endTime: 2.5,
          createdAt: 1000,
        },
      ],
    });

    renderHook(() => useTimelineSync());

    const { segments } = useTimelineStore.getState();
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({
      id: 'sel-1',
      startTime: 1.0,
      endTime: 2.5,
      selected: true,
    });
  });

  it('should create 3 segments from 3 selections', () => {
    useTranscriptStore.setState({
      transcript: makeTranscript(20),
      selections: [
        { id: 'a', projectId: 'p', startWordIndex: 0, endWordIndex: 2, startTime: 0, endTime: 1.5, createdAt: 1 },
        { id: 'b', projectId: 'p', startWordIndex: 5, endWordIndex: 7, startTime: 2.5, endTime: 4.0, createdAt: 2 },
        { id: 'c', projectId: 'p', startWordIndex: 15, endWordIndex: 18, startTime: 7.5, endTime: 9.5, createdAt: 3 },
      ],
    });

    renderHook(() => useTimelineSync());

    const { segments } = useTimelineStore.getState();
    expect(segments).toHaveLength(3);
    expect(segments[0].id).toBe('a');
    expect(segments[1].id).toBe('b');
    expect(segments[2].id).toBe('c');
    expect(segments[2].startTime).toBe(7.5);
    expect(segments[2].endTime).toBe(9.5);
  });

  it('should update segments immediately when selections change', () => {
    const transcript = makeTranscript(10);
    useTranscriptStore.setState({
      transcript,
      selections: [
        { id: 's1', projectId: 'p', startWordIndex: 0, endWordIndex: 1, startTime: 0, endTime: 1.0, createdAt: 1 },
      ],
    });

    renderHook(() => useTimelineSync());
    expect(useTimelineStore.getState().segments).toHaveLength(1);

    // Simulate selection change
    act(() => {
      useTranscriptStore.setState({
        selections: [
          { id: 's1', projectId: 'p', startWordIndex: 0, endWordIndex: 1, startTime: 0, endTime: 1.0, createdAt: 1 },
          { id: 's2', projectId: 'p', startWordIndex: 5, endWordIndex: 7, startTime: 2.5, endTime: 4.0, createdAt: 2 },
        ],
      });
    });

    expect(useTimelineStore.getState().segments).toHaveLength(2);
  });

  it('should compute duration from last word end_time', () => {
    useTranscriptStore.setState({
      transcript: makeTranscript(20), // last word end_time = 10.0
      selections: [],
    });

    renderHook(() => useTimelineSync());

    expect(useTimelineStore.getState().duration).toBe(10);
  });

  it('should not crash if transcript is null', () => {
    useTranscriptStore.setState({
      transcript: null,
      selections: [],
    });

    renderHook(() => useTimelineSync());

    const { segments, duration } = useTimelineStore.getState();
    expect(segments).toEqual([]);
    expect(duration).toBe(0);
  });
});
