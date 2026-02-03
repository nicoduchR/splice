import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExportStore } from './export-store';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock Tauri event listener
const mockUnlisten = vi.fn();
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(mockUnlisten)),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

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

  it('startExport calls invoke with correct parameters', async () => {
    useExportStore.getState().updateSettings({
      quality: 'high',
      outputPath: '/Users/test/Desktop',
      fileName: 'export.mp4',
    });

    mockInvoke.mockResolvedValueOnce('/Users/test/Desktop/export.mp4');

    await useExportStore.getState().startExport('project-1');

    expect(mockInvoke).toHaveBeenCalledWith('export_video', {
      projectId: 'project-1',
      quality: 'high',
      outputPath: '/Users/test/Desktop',
      fileName: 'export.mp4',
    });
  });

  it('startExport sets up event listeners', async () => {
    mockInvoke.mockResolvedValueOnce('ok');

    await useExportStore.getState().startExport('project-1');

    // Should have registered 3 listeners: progress, completed, error
    expect(mockListen).toHaveBeenCalledWith('export:progress', expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith('export:completed', expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith('export:error', expect.any(Function));
  });

  it('startExport cleans up listeners after completion', async () => {
    mockInvoke.mockResolvedValueOnce('ok');

    await useExportStore.getState().startExport('project-1');

    // mockUnlisten should be called 3 times (once per listener) in finally block
    expect(mockUnlisten).toHaveBeenCalledTimes(3);
  });

  it('startExport handles export:progress event', async () => {
    let progressCallback: ((event: { payload: { progress: number } }) => void) | null = null;
    mockListen.mockImplementation(async (eventName: string, cb: (...args: unknown[]) => void) => {
      if (eventName === 'export:progress') {
        progressCallback = cb as typeof progressCallback;
      }
      return mockUnlisten;
    });

    // Don't resolve invoke immediately so we can trigger events during export
    mockInvoke.mockImplementation(() => {
      if (progressCallback) {
        progressCallback({ payload: { progress: 42.5 } });
      }
      return Promise.resolve('ok');
    });

    await useExportStore.getState().startExport('project-1');

    expect(useExportStore.getState().exportProgress).toBe(42.5);
  });

  it('startExport handles error from invoke', async () => {
    mockInvoke.mockRejectedValueOnce('Export failed');

    await useExportStore.getState().startExport('project-1');

    expect(useExportStore.getState().isExporting).toBe(false);
    expect(useExportStore.getState().exportError).toBe('Export failed');
  });

  it('cancelExport calls invoke cancel_export', () => {
    useExportStore.setState({ _exportingProjectId: 'project-1' } as never);
    mockInvoke.mockResolvedValueOnce(undefined);

    useExportStore.getState().cancelExport();

    expect(mockInvoke).toHaveBeenCalledWith('cancel_export', { projectId: 'project-1' });
    expect(useExportStore.getState().isExporting).toBe(false);
    expect(useExportStore.getState().exportProgress).toBeNull();
  });
});
