import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectStateAutosave } from './use-project-state-autosave';
import { useTimelineStore } from '../stores/timeline-store';

const mockSaveProjectState = vi.fn().mockResolvedValue(undefined);

vi.mock('../services/project-state-service', () => ({
  saveProjectState: (...args: unknown[]) => mockSaveProjectState(...args),
}));

describe('useProjectStateAutosave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useTimelineStore.setState({
      currentTime: 42.5,
      volume: 0.8,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when projectId is null', () => {
    renderHook(() => useProjectStateAutosave(null));
    expect(mockSaveProjectState).not.toHaveBeenCalled();
  });

  it('saves immediately on mount when projectId is provided', () => {
    renderHook(() => useProjectStateAutosave('project-1'));

    expect(mockSaveProjectState).toHaveBeenCalledWith({
      projectId: 'project-1',
      timelinePosition: 42.5,
      volume: 0.8,
    });
  });

  it('saves every 30 seconds', () => {
    renderHook(() => useProjectStateAutosave('project-1'));

    // Initial save
    expect(mockSaveProjectState).toHaveBeenCalledTimes(1);

    // Advance 30 seconds
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(mockSaveProjectState).toHaveBeenCalledTimes(2);

    // Advance another 30 seconds
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(mockSaveProjectState).toHaveBeenCalledTimes(3);
  });

  it('saves with updated timeline values', () => {
    renderHook(() => useProjectStateAutosave('project-1'));

    // Update timeline state
    useTimelineStore.setState({ currentTime: 100.0, volume: 0.5 });

    act(() => { vi.advanceTimersByTime(30_000); });

    expect(mockSaveProjectState).toHaveBeenLastCalledWith({
      projectId: 'project-1',
      timelinePosition: 100.0,
      volume: 0.5,
    });
  });

  it('does final save on cleanup', () => {
    const { unmount } = renderHook(() => useProjectStateAutosave('project-1'));

    // Initial save
    expect(mockSaveProjectState).toHaveBeenCalledTimes(1);

    // Unmount triggers final save
    unmount();
    expect(mockSaveProjectState).toHaveBeenCalledTimes(2);
  });

  it('stops interval on cleanup', () => {
    const { unmount } = renderHook(() => useProjectStateAutosave('project-1'));

    unmount();

    // Advancing time should not trigger additional saves
    mockSaveProjectState.mockClear();
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(mockSaveProjectState).not.toHaveBeenCalled();
  });
});
