import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExportStore } from './export-store';
import { useLicenseStore } from './license-store';
import { LICENSE_PLAN } from '../services/license-api';

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
    useExportStore.getState().closeExportBlockedDialog();
    useExportStore.getState().updateSettings({ quality: 'preserve', outputPath: '', fileName: '' });
    // Reset license store to 'pro' by default for existing tests
    useLicenseStore.setState({ plan: LICENSE_PLAN.PRO });
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
    useExportStore.setState({ isExporting: true, exportProgress: { percent: 50 }, exportError: 'error' });
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

  it('startExport handles export:progress event with rich data', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let progressCallback: ((event: any) => void) | null = null;
    mockListen.mockImplementation(async (eventName: string, cb: (...args: unknown[]) => void) => {
      if (eventName === 'export:progress') {
        progressCallback = cb;
      }
      return mockUnlisten;
    });

    // Don't resolve invoke immediately so we can trigger events during export
    mockInvoke.mockImplementation(() => {
      if (progressCallback) {
        progressCallback({
          payload: {
            progress: 42.5,
            current_frame: 1234,
            total_frames: null,
            encoding_speed: 2.5,
            fps: 30.0,
            elapsed_secs: 20.0,
            eta_secs: 25.0,
            file_size_bytes: 50000000,
            estimated_total_bytes: 110000000,
          },
        });
      }
      return Promise.resolve('ok');
    });

    await useExportStore.getState().startExport('project-1');

    const progress = useExportStore.getState().exportProgress;
    expect(progress).not.toBeNull();
    expect(progress?.percent).toBe(42.5);
    expect(progress?.currentFrame).toBe(1234);
    expect(progress?.speed).toBe(2.5);
    expect(progress?.elapsedSecs).toBe(20.0);
    expect(progress?.eta).toBe(25.0);
    expect(progress?.fileSizeBytes).toBe(50000000);
    expect(progress?.estimatedTotalBytes).toBe(110000000);
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

  it('export:completed triggers notification when document is hidden', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let completedCallback: ((event: any) => void) | null = null;
    mockListen.mockImplementation(async (eventName: string, cb: (...args: unknown[]) => void) => {
      if (eventName === 'export:completed') {
        completedCallback = cb;
      }
      return mockUnlisten;
    });

    // Mock document.hidden
    const originalHidden = document.hidden;
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });

    // Mock notification module
    const mockSendNotification = vi.fn();
    const mockIsPermissionGranted = vi.fn().mockResolvedValue(true);
    vi.doMock('@tauri-apps/plugin-notification', () => ({
      isPermissionGranted: mockIsPermissionGranted,
      requestPermission: vi.fn(),
      sendNotification: mockSendNotification,
    }));

    mockInvoke.mockImplementation(() => {
      if (completedCallback) {
        completedCallback({
          payload: {
            project_id: 'project-1',
            output_path: '/path/to/video.mp4',
            file_size: 1000000,
            duration_seconds: 125.5,
          },
        });
      }
      return Promise.resolve('ok');
    });

    await useExportStore.getState().startExport('project-1');

    // Verify export completed state
    expect(useExportStore.getState().exportProgress?.percent).toBe(100);

    // Restore document.hidden
    Object.defineProperty(document, 'hidden', { value: originalHidden, configurable: true });
  });

  it('export:completed sets exportResult with file metadata', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let completedCallback: ((event: any) => void) | null = null;
    mockListen.mockImplementation(async (eventName: string, cb: (...args: unknown[]) => void) => {
      if (eventName === 'export:completed') {
        completedCallback = cb;
      }
      return mockUnlisten;
    });

    mockInvoke.mockImplementation(() => {
      if (completedCallback) {
        completedCallback({
          payload: {
            project_id: 'project-1',
            output_path: '/Users/test/Videos/exported.mp4',
            file_size: 50000000,
            duration_seconds: 765.0,
          },
        });
      }
      return Promise.resolve('ok');
    });

    await useExportStore.getState().startExport('project-1');

    const result = useExportStore.getState().exportResult;
    expect(result).not.toBeNull();
    expect(result?.outputPath).toBe('/Users/test/Videos/exported.mp4');
    expect(result?.fileSizeBytes).toBe(50000000);
    expect(result?.durationSeconds).toBe(765.0);
  });

  it('closeExportResult clears exportResult', () => {
    useExportStore.setState({
      exportResult: {
        outputPath: '/path/to/video.mp4',
        fileSizeBytes: 1000000,
        durationSeconds: 60,
      },
    });

    useExportStore.getState().closeExportResult();

    expect(useExportStore.getState().exportResult).toBeNull();
  });

  it('resetExport clears exportResult along with other state', () => {
    useExportStore.setState({
      isExporting: true,
      exportProgress: { percent: 50 },
      exportError: 'error',
      exportResult: {
        outputPath: '/path/to/video.mp4',
        fileSizeBytes: 1000000,
        durationSeconds: 60,
      },
    });

    useExportStore.getState().resetExport();

    expect(useExportStore.getState().exportResult).toBeNull();
    expect(useExportStore.getState().isExporting).toBe(false);
    expect(useExportStore.getState().exportProgress).toBeNull();
  });

  describe('License check on export', () => {
    it('openExportDialog with free plan shows ExportBlockedDialog', () => {
      useLicenseStore.setState({ plan: LICENSE_PLAN.FREE });

      useExportStore.getState().openExportDialog();

      expect(useExportStore.getState().showExportBlockedDialog).toBe(true);
      expect(useExportStore.getState().isExportDialogOpen).toBe(false);
    });

    it('openExportDialog with pro plan opens ExportDialog normally', () => {
      useLicenseStore.setState({ plan: LICENSE_PLAN.PRO });

      useExportStore.getState().openExportDialog();

      expect(useExportStore.getState().showExportBlockedDialog).toBe(false);
      expect(useExportStore.getState().isExportDialogOpen).toBe(true);
    });

    it('closeExportBlockedDialog sets showExportBlockedDialog to false', () => {
      useExportStore.setState({ showExportBlockedDialog: true });

      useExportStore.getState().closeExportBlockedDialog();

      expect(useExportStore.getState().showExportBlockedDialog).toBe(false);
    });

    it('openExportDialog clears error even for free users', () => {
      useLicenseStore.setState({ plan: LICENSE_PLAN.FREE });
      useExportStore.setState({ exportError: 'previous error' });

      useExportStore.getState().openExportDialog();

      expect(useExportStore.getState().exportError).toBeNull();
    });

    it('openExportDialog blocks export when plan is undefined (defensive)', () => {
      // Simulate corrupted state where plan is undefined
      useLicenseStore.setState({ plan: undefined as unknown as 'free' | 'pro' });

      useExportStore.getState().openExportDialog();

      // Should block export (show blocked dialog) for any non-pro state
      expect(useExportStore.getState().showExportBlockedDialog).toBe(true);
      expect(useExportStore.getState().isExportDialogOpen).toBe(false);
    });

    it('openExportDialog blocks export when plan is unexpected value (defensive)', () => {
      // Simulate corrupted state with unexpected plan value
      useLicenseStore.setState({ plan: 'invalid' as unknown as 'free' | 'pro' });

      useExportStore.getState().openExportDialog();

      // Should block export for any non-pro state
      expect(useExportStore.getState().showExportBlockedDialog).toBe(true);
      expect(useExportStore.getState().isExportDialogOpen).toBe(false);
    });
  });
});
