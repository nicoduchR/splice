import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTranscriptStore } from './transcript-store';
import type { Transcript } from '@splice/types';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
const mockInvoke = vi.mocked(invoke);

const mockTranscript: Transcript = {
  id: 'transcript-1',
  project_id: 'project-1',
  full_text: 'Hello world this is a test',
  language: 'en',
  created_at: 1706745600,
  words: [
    { index: 0, text: 'Hello', start_time: 0, end_time: 0.5, confidence: 0.9 },
    { index: 1, text: 'world', start_time: 0.5, end_time: 1.0, confidence: 0.9 },
    { index: 2, text: 'this', start_time: 1.0, end_time: 1.3, confidence: 0.9 },
    { index: 3, text: 'is', start_time: 1.3, end_time: 1.5, confidence: 0.9 },
    { index: 4, text: 'a', start_time: 1.5, end_time: 1.6, confidence: 0.9 },
    { index: 5, text: 'test', start_time: 1.6, end_time: 2.0, confidence: 0.9 },
  ],
};

describe('TranscriptStore - Selections', () => {
  beforeEach(() => {
    // Reset store state
    useTranscriptStore.setState({
      transcript: mockTranscript,
      selectedWordIndices: [],
      selections: [],
      currentProjectId: 'project-1',
      correctionState: 'idle',
      pendingCorrection: null,
      activeCorrectionJobId: null,
      correctionError: null,
      hasUserEditedSinceTranscription: false,
      selectionMode: 'keep',
      _selectionsDirty: false,
      _autoSaveIntervalId: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    useTranscriptStore.getState().stopAutoSave();
  });

  it('should convert toggled word indices to selection ranges', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    store.toggleWordSelection(1);
    store.toggleWordSelection(2);

    const state = useTranscriptStore.getState();
    expect(state.selectedWordIndices).toEqual([0, 1, 2]);
    expect(state.selections).toHaveLength(1);
    expect(state.selections[0].startWordIndex).toBe(0);
    expect(state.selections[0].endWordIndex).toBe(2);
    expect(state._selectionsDirty).toBe(true);
  });

  it('should create multiple ranges for non-contiguous selections', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    store.toggleWordSelection(1);
    store.toggleWordSelection(4);
    store.toggleWordSelection(5);

    const state = useTranscriptStore.getState();
    expect(state.selections).toHaveLength(2);
    expect(state.selections[0].startWordIndex).toBe(0);
    expect(state.selections[0].endWordIndex).toBe(1);
    expect(state.selections[1].startWordIndex).toBe(4);
    expect(state.selections[1].endWordIndex).toBe(5);
  });

  it('should set selection range and build selections', () => {
    const store = useTranscriptStore.getState();
    store.setSelection(1, 4);

    const state = useTranscriptStore.getState();
    expect(state.selectedWordIndices).toEqual([1, 2, 3, 4]);
    expect(state.selections).toHaveLength(1);
    expect(state.selections[0].startWordIndex).toBe(1);
    expect(state.selections[0].endWordIndex).toBe(4);
  });

  it('should clear selections', () => {
    const store = useTranscriptStore.getState();
    store.setSelection(0, 3);
    store.clearSelection();

    const state = useTranscriptStore.getState();
    expect(state.selectedWordIndices).toEqual([]);
    expect(state.selections).toEqual([]);
    expect(state._selectionsDirty).toBe(true);
  });

  it('should load selections from backend', async () => {
    mockInvoke.mockResolvedValueOnce([
      {
        id: 'sel-1',
        project_id: 'project-1',
        start_word_index: 0,
        end_word_index: 2,
        start_time: 0,
        end_time: 1.3,
        created_at: 1706745600,
      },
      {
        id: 'sel-2',
        project_id: 'project-1',
        start_word_index: 4,
        end_word_index: 5,
        start_time: 1.5,
        end_time: 2.0,
        created_at: 1706745600,
      },
    ]);

    await useTranscriptStore.getState().loadSelections('project-1');

    const state = useTranscriptStore.getState();
    expect(mockInvoke).toHaveBeenCalledWith('get_selections', { projectId: 'project-1' });
    expect(state.selections).toHaveLength(2);
    expect(state.selectedWordIndices).toEqual([0, 1, 2, 4, 5]);
    expect(state._selectionsDirty).toBe(false);
  });

  it('should save selections to backend', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    const store = useTranscriptStore.getState();
    store.setSelection(0, 2);

    await useTranscriptStore.getState().saveSelections();

    expect(mockInvoke).toHaveBeenCalledWith('save_selections', {
      projectId: 'project-1',
      selections: expect.arrayContaining([
        expect.objectContaining({
          start_word_index: 0,
          end_word_index: 2,
        }),
      ]),
    });

    expect(useTranscriptStore.getState()._selectionsDirty).toBe(false);
  });

  it('should not save when not dirty', async () => {
    useTranscriptStore.setState({ _selectionsDirty: false });

    await useTranscriptStore.getState().saveSelections();

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('should start and stop auto-save', () => {
    vi.useFakeTimers();

    const store = useTranscriptStore.getState();
    store.startAutoSave();

    expect(useTranscriptStore.getState()._autoSaveIntervalId).not.toBeNull();

    store.stopAutoSave();

    expect(useTranscriptStore.getState()._autoSaveIntervalId).toBeNull();

    vi.useRealTimers();
  });

  it('should auto-save every 30 seconds when dirty', async () => {
    vi.useFakeTimers();
    mockInvoke.mockResolvedValue(undefined);

    const store = useTranscriptStore.getState();
    store.setSelection(0, 2); // makes dirty
    store.startAutoSave();

    // Advance 30 seconds
    await vi.advanceTimersByTimeAsync(30_000);

    expect(mockInvoke).toHaveBeenCalledWith('save_selections', expect.any(Object));

    store.stopAutoSave();
    vi.useRealTimers();
  });

  it('should handle selection toggle performance (<100ms)', () => {
    const store = useTranscriptStore.getState();
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      store.toggleWordSelection(i % 6);
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should apply correction and refresh transcript', async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'save_transcript') {
        return {
          id: 'transcript-1',
          project_id: 'project-1',
          full_text: 'Bonjour tout le monde',
          language: 'fr',
          created_at: 1706745601,
        };
      }
      if (cmd === 'clear_selections') {
        return undefined;
      }
      if (cmd === 'get_transcript') {
        return {
          transcript: {
            id: 'transcript-1',
            project_id: 'project-1',
            full_text: 'Bonjour tout le monde',
            language: 'fr',
            created_at: 1706745601,
          },
          words: [
            {
              id: 'w1',
              transcript_id: 'transcript-1',
              word: 'Bonjour',
              start_time: 0,
              end_time: 0.4,
              confidence: 0.9,
              word_index: 0,
            },
            {
              id: 'w2',
              transcript_id: 'transcript-1',
              word: 'tout',
              start_time: 0.4,
              end_time: 0.7,
              confidence: 0.9,
              word_index: 1,
            },
          ],
        };
      }
      return undefined;
    });

    const store = useTranscriptStore.getState();
    store.setCorrectionRunning('job-1', 'project-1');
    store.setCorrectionCandidate({
      projectId: 'project-1',
      jobId: 'job-1',
      detectedLanguage: 'fr',
      forcedLanguage: 'fr',
      profile: 'fast',
      result: {
        text: 'Bonjour tout le monde',
        words: [
          { text: 'Bonjour', start: 0, end: 0.4, confidence: 0.9 },
          { text: 'tout', start: 0.4, end: 0.7, confidence: 0.9 },
        ],
        language: 'fr',
      },
    });

    const applied = await useTranscriptStore.getState().applyCorrection('project-1', true);

    expect(applied).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('save_transcript', expect.any(Object));
    expect(mockInvoke).toHaveBeenCalledWith('clear_selections', { projectId: 'project-1' });
    expect(useTranscriptStore.getState().correctionState).toBe('idle');
    expect(useTranscriptStore.getState().pendingCorrection).toBeNull();
  });
});
