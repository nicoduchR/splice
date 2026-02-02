import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSegmentationStore } from './segmentation-store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('SegmentationStore - finalVideoPath', () => {
  beforeEach(() => {
    useSegmentationStore.setState({
      isSegmenting: false,
      segmentationProgress: null,
      isValidating: false,
      validationProgress: null,
      isConcatenating: false,
      stats: null,
      error: null,
      finalVideoPath: null,
    });
  });

  it('sets finalVideoPath via setFinalVideoPath', () => {
    useSegmentationStore.getState().setFinalVideoPath('/path/to/final.mp4');
    expect(useSegmentationStore.getState().finalVideoPath).toBe('/path/to/final.mp4');
  });

  it('preserves finalVideoPath after resetSegmentation', () => {
    useSegmentationStore.getState().setFinalVideoPath('/path/to/final.mp4');
    useSegmentationStore.getState().resetSegmentation();
    expect(useSegmentationStore.getState().finalVideoPath).toBe('/path/to/final.mp4');
  });

  it('initializes finalVideoPath as null', () => {
    expect(useSegmentationStore.getState().finalVideoPath).toBeNull();
  });
});
