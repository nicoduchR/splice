import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSegmentationStore } from './segmentation-store';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
const mockInvoke = vi.mocked(invoke);

describe('useSegmentationStore', () => {
  beforeEach(() => {
    useSegmentationStore.getState().resetSegmentation();
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const state = useSegmentationStore.getState();
    expect(state.isSegmenting).toBe(false);
    expect(state.segmentationProgress).toBeNull();
    expect(state.isConcatenating).toBe(false);
    expect(state.error).toBeNull();
  });

  it('startSegmentation sets isSegmenting to true and resets error/progress', async () => {
    // Set some prior state
    useSegmentationStore.setState({ error: 'old error', segmentationProgress: { project_id: 'p', current_segment: 1, total_segments: 2, progress: 0.5 } });

    // generate_cuts resolves immediately, segment_video hangs
    let resolveInvoke: (v: unknown) => void;
    mockInvoke
      .mockResolvedValueOnce([]) // generate_cuts
      .mockImplementationOnce(() => new Promise(r => { resolveInvoke = r; })); // segment_video

    const promise = useSegmentationStore.getState().startSegmentation('project-1');

    // Wait for generate_cuts to resolve so segment_video is called
    await new Promise(r => setTimeout(r, 0));

    // State should be set immediately before invoke resolves
    expect(useSegmentationStore.getState().isSegmenting).toBe(true);
    expect(useSegmentationStore.getState().error).toBeNull();
    expect(useSegmentationStore.getState().segmentationProgress).toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith('generate_cuts', { projectId: 'project-1' });
    expect(mockInvoke).toHaveBeenCalledWith('segment_video', { projectId: 'project-1' });

    // Resolve and wait
    resolveInvoke!(['/path/seg1.mp4']);
    await promise;

    // isSegmenting stays true (completed event resets it, not invoke resolution)
    expect(useSegmentationStore.getState().isSegmenting).toBe(true);
  });

  it('startSegmentation sets error on failure', async () => {
    mockInvoke
      .mockResolvedValueOnce([]) // generate_cuts succeeds
      .mockRejectedValueOnce('FFmpeg error'); // segment_video fails

    await useSegmentationStore.getState().startSegmentation('project-1');

    const state = useSegmentationStore.getState();
    expect(state.isSegmenting).toBe(false);
    expect(state.error).toBe('FFmpeg error');
  });

  it('cancelSegmentation resets state on success', async () => {
    mockInvoke.mockResolvedValue(undefined);

    useSegmentationStore.setState({ isSegmenting: true });

    await useSegmentationStore.getState().cancelSegmentation('project-1');

    const state = useSegmentationStore.getState();
    expect(state.isSegmenting).toBe(false);
    expect(state.segmentationProgress).toBeNull();
    expect(state.error).toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith('cancel_segmentation', { projectId: 'project-1' });
  });

  it('cancelSegmentation stores error when invoke fails', async () => {
    mockInvoke.mockRejectedValueOnce('Cancel failed');

    useSegmentationStore.setState({ isSegmenting: true });

    await useSegmentationStore.getState().cancelSegmentation('project-1');

    const state = useSegmentationStore.getState();
    expect(state.isSegmenting).toBe(false);
    expect(state.error).toBe('Cancel failed');
  });

  it('updateProgress updates segmentationProgress', () => {
    const progress = {
      project_id: 'project-1',
      current_segment: 3,
      total_segments: 10,
      progress: 0.3,
    };

    useSegmentationStore.getState().updateProgress(progress);

    expect(useSegmentationStore.getState().segmentationProgress).toEqual(progress);
  });

  it('resetSegmentation clears all state', () => {
    useSegmentationStore.setState({
      isSegmenting: true,
      segmentationProgress: { project_id: 'p1', current_segment: 1, total_segments: 5, progress: 0.2 },
      isValidating: true,
      validationProgress: { project_id: 'p1', current_segment: 2, total_segments: 5 },
      isConcatenating: true,
      stats: { segment_count: 5, final_duration_secs: 120, original_duration_secs: 600, reduction_percent: 80 },
      error: 'some error',
    });

    useSegmentationStore.getState().resetSegmentation();

    const state = useSegmentationStore.getState();
    expect(state.isSegmenting).toBe(false);
    expect(state.segmentationProgress).toBeNull();
    expect(state.isValidating).toBe(false);
    expect(state.validationProgress).toBeNull();
    expect(state.isConcatenating).toBe(false);
    expect(state.stats).toBeNull();
    expect(state.error).toBeNull();
  });

  it('isValidating is set to true during validation', () => {
    const progress = {
      project_id: 'project-1',
      current_segment: 1,
      total_segments: 5,
    };

    useSegmentationStore.getState().updateValidationProgress(progress);

    const state = useSegmentationStore.getState();
    expect(state.isValidating).toBe(true);
    expect(state.validationProgress).toEqual(progress);
  });

  it('validationProgress updates correctly', () => {
    useSegmentationStore.getState().updateValidationProgress({
      project_id: 'project-1',
      current_segment: 0,
      total_segments: 3,
    });

    expect(useSegmentationStore.getState().validationProgress?.current_segment).toBe(0);

    useSegmentationStore.getState().updateValidationProgress({
      project_id: 'project-1',
      current_segment: 2,
      total_segments: 3,
    });

    expect(useSegmentationStore.getState().validationProgress?.current_segment).toBe(2);
  });

  it('initial state includes validation fields', () => {
    useSegmentationStore.getState().resetSegmentation();
    const state = useSegmentationStore.getState();
    expect(state.isValidating).toBe(false);
    expect(state.validationProgress).toBeNull();
  });

  it('setConcatenating updates isConcatenating', () => {
    useSegmentationStore.getState().setConcatenating(true);
    expect(useSegmentationStore.getState().isConcatenating).toBe(true);

    useSegmentationStore.getState().setConcatenating(false);
    expect(useSegmentationStore.getState().isConcatenating).toBe(false);
  });

  it('isConcatenating resets with resetSegmentation', () => {
    useSegmentationStore.setState({ isConcatenating: true });
    useSegmentationStore.getState().resetSegmentation();
    expect(useSegmentationStore.getState().isConcatenating).toBe(false);
  });

  it('setStats stores stats and resetSegmentation clears them', () => {
    const stats = {
      segment_count: 3,
      final_duration_secs: 90,
      original_duration_secs: 600,
      reduction_percent: 85,
    };

    useSegmentationStore.getState().setStats(stats);
    expect(useSegmentationStore.getState().stats).toEqual(stats);

    useSegmentationStore.getState().resetSegmentation();
    expect(useSegmentationStore.getState().stats).toBeNull();
  });
});
