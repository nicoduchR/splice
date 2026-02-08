import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

vi.mock('../services/update-service', () => ({
  checkForUpdate: vi.fn(),
  downloadUpdate: vi.fn(),
  cancelUpdateDownload: vi.fn(),
  getUpdateStatus: vi.fn(),
  installUpdate: vi.fn(),
  subscribeToUpdateEvents: vi.fn(),
}));

import { useUpdateStore } from './update-store';
import * as updateService from '../services/update-service';
import type { UpdateStatusResponse } from '../types/update';

const mockCheckForUpdate = vi.mocked(updateService.checkForUpdate);
const mockDownloadUpdate = vi.mocked(updateService.downloadUpdate);
const mockCancelUpdateDownload = vi.mocked(updateService.cancelUpdateDownload);
const mockInstallUpdate = vi.mocked(updateService.installUpdate);
const mockSubscribeToUpdateEvents = vi.mocked(updateService.subscribeToUpdateEvents);

describe('update-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUpdateStore.setState({
      status: 'idle',
      updateInfo: null,
      downloadProgress: null,
      error: null,
      isChecking: false,
      isDownloading: false,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useUpdateStore.getState();
      expect(state.status).toBe('idle');
      expect(state.updateInfo).toBeNull();
      expect(state.downloadProgress).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isChecking).toBe(false);
      expect(state.isDownloading).toBe(false);
    });
  });

  describe('checkForUpdate', () => {
    it('should set isChecking and status to checking', async () => {
      // Use a deferred promise to capture intermediate state
      let resolveCheck!: (value: UpdateStatusResponse) => void;
      mockCheckForUpdate.mockReturnValue(new Promise((r) => { resolveCheck = r; }));

      const promise = useUpdateStore.getState().checkForUpdate();

      expect(useUpdateStore.getState().isChecking).toBe(true);
      expect(useUpdateStore.getState().status).toBe('checking');

      resolveCheck({ status: 'up_to_date', updateInfo: null, downloadProgress: null, error: null });
      await promise;
    });

    it('should update state when update is available', async () => {
      const updateInfo = {
        version: '1.1.0',
        release_date: '2026-01-15',
        release_notes: 'Bug fixes',
        download_url: '',
        is_mandatory: false,
      };
      mockCheckForUpdate.mockResolvedValue({
        status: 'available',
        updateInfo,
        downloadProgress: null,
        error: null,
      });

      await useUpdateStore.getState().checkForUpdate();

      const state = useUpdateStore.getState();
      expect(state.status).toBe('available');
      expect(state.updateInfo).toEqual(updateInfo);
      expect(state.isChecking).toBe(false);
    });

    it('should set up_to_date when no update available', async () => {
      mockCheckForUpdate.mockResolvedValue({
        status: 'up_to_date',
        updateInfo: null,
        downloadProgress: null,
        error: null,
      });

      await useUpdateStore.getState().checkForUpdate();

      expect(useUpdateStore.getState().status).toBe('up_to_date');
      expect(useUpdateStore.getState().updateInfo).toBeNull();
    });

    it('should handle error response from API', async () => {
      mockCheckForUpdate.mockResolvedValue({
        status: 'error',
        updateInfo: null,
        downloadProgress: null,
        error: 'Server unavailable',
      });

      await useUpdateStore.getState().checkForUpdate();

      expect(useUpdateStore.getState().status).toBe('error');
      expect(useUpdateStore.getState().error).toBe('Server unavailable');
      expect(useUpdateStore.getState().isChecking).toBe(false);
    });

    it('should handle thrown errors gracefully', async () => {
      mockCheckForUpdate.mockRejectedValue(new Error('Network failure'));

      await useUpdateStore.getState().checkForUpdate();

      expect(useUpdateStore.getState().status).toBe('error');
      expect(useUpdateStore.getState().error).toContain('Network failure');
      expect(useUpdateStore.getState().isChecking).toBe(false);
    });
  });

  describe('startDownload', () => {
    it('should not start if no update available', async () => {
      await useUpdateStore.getState().startDownload();

      expect(mockDownloadUpdate).not.toHaveBeenCalled();
    });

    it('should start download when update is available', async () => {
      mockDownloadUpdate.mockResolvedValue({
        status: 'downloading',
        updateInfo: null,
        downloadProgress: null,
        error: null,
      });

      useUpdateStore.setState({
        status: 'available',
        updateInfo: { version: '1.1.0', release_date: '', release_notes: '', download_url: '', is_mandatory: false },
      });

      await useUpdateStore.getState().startDownload();

      expect(mockDownloadUpdate).toHaveBeenCalled();
    });

    it('should handle download error response', async () => {
      mockDownloadUpdate.mockResolvedValue({
        status: 'error',
        updateInfo: null,
        downloadProgress: null,
        error: 'Download failed: disk full',
      });

      useUpdateStore.setState({
        status: 'available',
        updateInfo: { version: '1.1.0', release_date: '', release_notes: '', download_url: '', is_mandatory: false },
      });

      await useUpdateStore.getState().startDownload();

      expect(useUpdateStore.getState().status).toBe('error');
      expect(useUpdateStore.getState().error).toBe('Download failed: disk full');
      expect(useUpdateStore.getState().isDownloading).toBe(false);
    });

    it('should handle thrown download errors', async () => {
      mockDownloadUpdate.mockRejectedValue(new Error('Connection lost'));

      useUpdateStore.setState({
        status: 'available',
        updateInfo: { version: '1.1.0', release_date: '', release_notes: '', download_url: '', is_mandatory: false },
      });

      await useUpdateStore.getState().startDownload();

      expect(useUpdateStore.getState().status).toBe('error');
      expect(useUpdateStore.getState().error).toContain('Connection lost');
    });
  });

  describe('cancelDownload', () => {
    it('should cancel and revert to available status', async () => {
      mockCancelUpdateDownload.mockResolvedValue(undefined);
      useUpdateStore.setState({ status: 'downloading', isDownloading: true });

      await useUpdateStore.getState().cancelDownload();

      expect(mockCancelUpdateDownload).toHaveBeenCalled();
      expect(useUpdateStore.getState().status).toBe('available');
      expect(useUpdateStore.getState().isDownloading).toBe(false);
      expect(useUpdateStore.getState().downloadProgress).toBeNull();
    });
  });

  describe('installUpdate', () => {
    it('should not install if status is not ready', async () => {
      useUpdateStore.setState({ status: 'available' });

      await useUpdateStore.getState().installUpdate();

      expect(mockInstallUpdate).not.toHaveBeenCalled();
    });

    it('should invoke install when status is ready', async () => {
      mockInstallUpdate.mockResolvedValue(undefined);
      useUpdateStore.setState({ status: 'ready' });

      await useUpdateStore.getState().installUpdate();

      expect(mockInstallUpdate).toHaveBeenCalled();
    });

    it('should handle install errors', async () => {
      mockInstallUpdate.mockRejectedValue(new Error('Signature mismatch'));
      useUpdateStore.setState({ status: 'ready' });

      await useUpdateStore.getState().installUpdate();

      expect(useUpdateStore.getState().status).toBe('error');
      expect(useUpdateStore.getState().error).toContain('Signature mismatch');
    });
  });

  describe('clearError', () => {
    it('should clear the error state', () => {
      useUpdateStore.setState({ error: 'Some error' });

      useUpdateStore.getState().clearError();

      expect(useUpdateStore.getState().error).toBeNull();
    });
  });

  describe('resetState', () => {
    it('should reset all state to initial values', () => {
      useUpdateStore.setState({
        status: 'downloading',
        updateInfo: { version: '2.0.0', release_date: '', release_notes: '', download_url: '', is_mandatory: true },
        downloadProgress: { percent: 50, downloaded_bytes: 5000, total_bytes: 10000 },
        error: 'old error',
        isChecking: true,
        isDownloading: true,
      });

      useUpdateStore.getState().resetState();

      const state = useUpdateStore.getState();
      expect(state.status).toBe('idle');
      expect(state.updateInfo).toBeNull();
      expect(state.downloadProgress).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isChecking).toBe(false);
      expect(state.isDownloading).toBe(false);
    });
  });

  describe('initEventListeners', () => {
    it('should subscribe to all update events', async () => {
      const mockUnsubscribe = vi.fn();
      mockSubscribeToUpdateEvents.mockResolvedValue(mockUnsubscribe);

      const unsubscribe = await useUpdateStore.getState().initEventListeners();

      expect(mockSubscribeToUpdateEvents).toHaveBeenCalledWith({
        onAvailable: expect.any(Function),
        onProgress: expect.any(Function),
        onComplete: expect.any(Function),
        onError: expect.any(Function),
      });

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle update:available event correctly', async () => {
      let capturedHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSubscribeToUpdateEvents.mockImplementation(async (handlers) => {
        capturedHandlers = handlers as Record<string, (...args: unknown[]) => void>;
        return vi.fn();
      });

      await useUpdateStore.getState().initEventListeners();

      capturedHandlers.onAvailable({
        version: '2.0.0',
        releaseNotes: 'Major update',
        isMandatory: true,
      });

      const state = useUpdateStore.getState();
      expect(state.status).toBe('available');
      expect(state.updateInfo?.version).toBe('2.0.0');
      expect(state.updateInfo?.is_mandatory).toBe(true);
    });

    it('should handle update:download-progress event correctly', async () => {
      let capturedHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSubscribeToUpdateEvents.mockImplementation(async (handlers) => {
        capturedHandlers = handlers as Record<string, (...args: unknown[]) => void>;
        return vi.fn();
      });

      await useUpdateStore.getState().initEventListeners();

      capturedHandlers.onProgress({
        percent: 45.5,
        downloadedBytes: 45500000,
        totalBytes: 100000000,
      });

      const progress = useUpdateStore.getState().downloadProgress;
      expect(progress?.percent).toBe(45.5);
      expect(progress?.downloaded_bytes).toBe(45500000);
      expect(progress?.total_bytes).toBe(100000000);
    });

    it('should handle update:download-complete event correctly', async () => {
      let capturedHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSubscribeToUpdateEvents.mockImplementation(async (handlers) => {
        capturedHandlers = handlers as Record<string, (...args: unknown[]) => void>;
        return vi.fn();
      });

      await useUpdateStore.getState().initEventListeners();
      useUpdateStore.setState({ isDownloading: true });

      capturedHandlers.onComplete({ version: '2.0.0' });

      expect(useUpdateStore.getState().status).toBe('ready');
      expect(useUpdateStore.getState().isDownloading).toBe(false);
    });

    it('should handle update:error event correctly', async () => {
      let capturedHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSubscribeToUpdateEvents.mockImplementation(async (handlers) => {
        capturedHandlers = handlers as Record<string, (...args: unknown[]) => void>;
        return vi.fn();
      });

      await useUpdateStore.getState().initEventListeners();

      capturedHandlers.onError({ message: 'Signature verification failed' });

      expect(useUpdateStore.getState().status).toBe('error');
      expect(useUpdateStore.getState().error).toBe('Signature verification failed');
      expect(useUpdateStore.getState().isDownloading).toBe(false);
    });
  });
});
