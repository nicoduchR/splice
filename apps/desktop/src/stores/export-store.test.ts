import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExportStore } from './export-store';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
const mockInvoke = vi.mocked(invoke);

describe('useExportStore', () => {
  beforeEach(() => {
    useExportStore.getState().resetExport();
    useExportStore.getState().closeExportDialog();
    useExportStore.getState().updateSettings({ quality: 'preserve', outputPath: '', fileName: '' });
    vi.clearAllMocks();
  });

  it('openExportDialog / closeExportDialog toggle state', () => {
    expect(useExportStore.getState().isExportDialogOpen).toBe(false);

    useExportStore.getState().openExportDialog();
    expect(useExportStore.getState().isExportDialogOpen).toBe(true);

    useExportStore.getState().closeExportDialog();
    expect(useExportStore.getState().isExportDialogOpen).toBe(false);
  });

  it('updateSettings updates quality and path', () => {
    useExportStore.getState().updateSettings({ quality: 'high' });
    expect(useExportStore.getState().exportSettings.quality).toBe('high');

    useExportStore.getState().updateSettings({ outputPath: '/Users/test/Desktop', fileName: 'my_video.mp4' });
    expect(useExportStore.getState().exportSettings.outputPath).toBe('/Users/test/Desktop');
    expect(useExportStore.getState().exportSettings.fileName).toBe('my_video.mp4');

    // Quality should still be high (partial update)
    expect(useExportStore.getState().exportSettings.quality).toBe('high');
  });

  it('estimateExportSize calls invoke and updates state', async () => {
    mockInvoke.mockResolvedValueOnce({
      estimated_size_bytes: 50_000_000,
      estimated_duration_seconds: 30,
    });

    await useExportStore.getState().estimateExportSize('project-1', 'high');

    expect(mockInvoke).toHaveBeenCalledWith('estimate_export', {
      projectId: 'project-1',
      quality: 'high',
    });
    expect(useExportStore.getState().estimatedFileSize).toBe(50_000_000);
    expect(useExportStore.getState().estimatedDuration).toBe(30);
    expect(useExportStore.getState().isEstimating).toBe(false);
  });

  it('estimateExportSize handles errors gracefully', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('No cuts found'));

    await useExportStore.getState().estimateExportSize('project-1', 'high');

    expect(useExportStore.getState().estimatedFileSize).toBeNull();
    expect(useExportStore.getState().estimatedDuration).toBeNull();
    expect(useExportStore.getState().isEstimating).toBe(false);
  });

  it('openExportDialog clears previous errors', () => {
    useExportStore.setState({ exportError: 'previous error' });
    useExportStore.getState().openExportDialog();
    expect(useExportStore.getState().exportError).toBeNull();
  });

  it('resetExport clears export state', () => {
    useExportStore.setState({ isExporting: true, exportProgress: 50, exportError: 'error' });
    useExportStore.getState().resetExport();
    expect(useExportStore.getState().isExporting).toBe(false);
    expect(useExportStore.getState().exportProgress).toBeNull();
    expect(useExportStore.getState().exportError).toBeNull();
  });
});
