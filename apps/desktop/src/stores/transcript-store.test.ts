import { describe, it, expect, beforeEach } from 'vitest';
import { useTranscriptStore } from './transcript-store';
import type { Transcript } from '@splice/types';

const mockTranscript: Transcript = {
  id: 'test-transcript',
  project_id: 'test-project',
  full_text: 'Hello world foo bar baz',
  language: 'en',
  created_at: 1000,
  words: [
    { index: 0, text: 'Hello', start_time: 0, end_time: 0.5, confidence: 1 },
    { index: 1, text: 'world', start_time: 0.5, end_time: 1, confidence: 1 },
    { index: 2, text: 'foo', start_time: 1, end_time: 1.5, confidence: 1 },
    { index: 3, text: 'bar', start_time: 1.5, end_time: 2, confidence: 1 },
    { index: 4, text: 'baz', start_time: 2, end_time: 2.5, confidence: 1 },
  ],
};

function setupStore() {
  const store = useTranscriptStore.getState();
  // Reset store state
  useTranscriptStore.setState({
    transcript: mockTranscript,
    currentProjectId: 'test-project',
    selectedWordIndices: [],
    selections: [],
    _undoStack: [],
    _redoStack: [],
    canUndo: false,
    canRedo: false,
    _selectionsDirty: false,
  });
  return useTranscriptStore;
}

describe('transcript-store undo/redo', () => {
  beforeEach(() => {
    setupStore();
  });

  it('should have empty undo/redo stacks initially', () => {
    const state = useTranscriptStore.getState();
    expect(state._undoStack).toEqual([]);
    expect(state._redoStack).toEqual([]);
  });

  it('should push undo state when toggling word selection', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    const state = useTranscriptStore.getState();
    expect(state._undoStack.length).toBe(1);
    expect(state._undoStack[0].selectedWordIndices).toEqual([]);
    expect(state.selectedWordIndices).toEqual([0]);
  });

  it('should undo toggleWordSelection', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    store.toggleWordSelection(1);
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([0, 1]);

    store.undo();
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([0]);

    store.undo();
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([]);
  });

  it('should redo after undo', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    store.undo();
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([]);

    store.redo();
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([0]);
  });

  it('should clear redo stack on new action', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    store.undo();
    expect(useTranscriptStore.getState()._redoStack.length).toBe(1);

    store.toggleWordSelection(2);
    expect(useTranscriptStore.getState()._redoStack).toEqual([]);
  });

  it('should push undo state when using setSelection', () => {
    const store = useTranscriptStore.getState();
    store.setSelection(0, 2);
    expect(useTranscriptStore.getState()._undoStack.length).toBe(1);
    expect(useTranscriptStore.getState()._undoStack[0].selectedWordIndices).toEqual([]);
  });

  it('should undo setSelection', () => {
    const store = useTranscriptStore.getState();
    store.setSelection(0, 2);
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([0, 1, 2]);

    store.undo();
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([]);
  });

  it('should push undo state when using clearSelection', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    store.clearSelection();
    expect(useTranscriptStore.getState()._undoStack.length).toBe(2);
  });

  it('should undo clearSelection', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    store.clearSelection();
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([]);

    store.undo();
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([0]);
  });

  it('should push undo state when using toggleSelectionRange', () => {
    const store = useTranscriptStore.getState();
    store.toggleSelectionRange(0, 2);
    expect(useTranscriptStore.getState()._undoStack.length).toBe(1);
  });

  it('should push undo state when using setSelectionFromIndices', () => {
    const store = useTranscriptStore.getState();
    store.setSelectionFromIndices([0, 1, 2]);
    expect(useTranscriptStore.getState()._undoStack.length).toBe(1);
  });

  it('should limit undo stack to 50 entries', () => {
    const store = useTranscriptStore.getState();
    for (let i = 0; i < 60; i++) {
      store.toggleWordSelection(i % 5);
    }
    expect(useTranscriptStore.getState()._undoStack.length).toBe(50);
  });

  it('should not undo when stack is empty', () => {
    const store = useTranscriptStore.getState();
    store.undo(); // should not throw
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([]);
  });

  it('should not redo when stack is empty', () => {
    const store = useTranscriptStore.getState();
    store.redo(); // should not throw
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([]);
  });

  it('should have canUndo and canRedo getters', () => {
    const store = useTranscriptStore.getState();
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(false);

    store.toggleWordSelection(0);
    expect(useTranscriptStore.getState().canUndo).toBe(true);
    expect(useTranscriptStore.getState().canRedo).toBe(false);

    useTranscriptStore.getState().undo();
    expect(useTranscriptStore.getState().canUndo).toBe(false);
    expect(useTranscriptStore.getState().canRedo).toBe(true);
  });

  it('should mark _selectionsDirty true after undo', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    useTranscriptStore.setState({ _selectionsDirty: false });
    store.undo();
    expect(useTranscriptStore.getState()._selectionsDirty).toBe(true);
  });

  it('should mark _selectionsDirty true after redo', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    store.undo();
    useTranscriptStore.setState({ _selectionsDirty: false });
    useTranscriptStore.getState().redo();
    expect(useTranscriptStore.getState()._selectionsDirty).toBe(true);
  });

  it('should split range into two when deselecting middle word', () => {
    const store = useTranscriptStore.getState();
    // Select range 0-4
    store.setSelection(0, 4);
    expect(useTranscriptStore.getState().selectedWordIndices).toEqual([0, 1, 2, 3, 4]);

    // Deselect word 2 (middle)
    store.toggleWordSelection(2);
    const state = useTranscriptStore.getState();
    expect(state.selectedWordIndices).toEqual([0, 1, 3, 4]);
    // Should produce 2 distinct ranges
    expect(state.selections.length).toBe(2);
    expect(state.selections[0].startWordIndex).toBe(0);
    expect(state.selections[0].endWordIndex).toBe(1);
    expect(state.selections[1].startWordIndex).toBe(3);
    expect(state.selections[1].endWordIndex).toBe(4);
  });

  it('should mark _selectionsDirty after deselection', () => {
    const store = useTranscriptStore.getState();
    store.toggleWordSelection(0);
    useTranscriptStore.setState({ _selectionsDirty: false });
    store.toggleWordSelection(0); // deselect
    expect(useTranscriptStore.getState()._selectionsDirty).toBe(true);
  });

  it('should clear undo/redo stacks when state is reset (simulating loadSelections)', () => {
    const store = useTranscriptStore.getState();
    // Build up some undo history
    store.toggleWordSelection(0);
    store.toggleWordSelection(1);
    expect(useTranscriptStore.getState()._undoStack.length).toBe(2);

    // Simulate what loadSelections does internally (sets stacks to [])
    useTranscriptStore.setState({
      selectedWordIndices: [2, 3],
      selections: [],
      _undoStack: [],
      _redoStack: [],
      canUndo: false,
      canRedo: false,
      _selectionsDirty: false,
    });

    const state = useTranscriptStore.getState();
    expect(state._undoStack).toEqual([]);
    expect(state._redoStack).toEqual([]);
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
  });
});
