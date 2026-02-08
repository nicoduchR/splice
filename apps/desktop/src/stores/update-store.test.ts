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
  setInstallOnQuit: vi.fn(),
  subscribeToUpdateEvents: vi.fn(),
  getBackupInfo: vi.fn(),
  manualRollback: vi.fn(),
  sendCrashReport: vi.fn(),
  onRollbackCompleted: vi.fn(),
}));

import { useUpdateStore } from './update-store';
import * as updateService from '../services/update-service';
import type { UpdateStatusResponse } from '../types/update';

const mockCheckForUpdate = vi.mocked(updateService.checkForUpdate);
const mockDownloadUpdate = vi.mocked(updateService.downloadUpdate);
const mockCancelUpdateDownload = vi.mocked(updateService.cancelUpdateDownload);
const mockInstallUpdate = vi.mocked(updateService.installUpdate);
const mockSetInstallOnQuit = vi.mocked(updateService.setInstallOnQuit);
const mockSubscribeToUpdateEvents = vi.mocked(updateService.subscribeToUpdateEvents);
const mockGetBackupInfo = vi.mocked(updateService.getBackupInfo);
const mockManualRollback = vi.mocked(updateService.manualRollback);
const mockSendCrashReport = vi.mocked(updateService.sendCrashReport);
const mockOnRollbackCompleted = vi.mocked(updateService.onRollbackCompleted);

describe('update-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockOnRollbackCompleted.mockResolvedValue(vi.fn());
    useUpdateStore.setState({
      status: 'idle',
      updateInfo: null,
      downloadProgress: null,
      error: null,
      isChecking: false,
      isDownloading: false,
      installOnQuit: false,
      remindLaterUntil: null,
      remindLaterVersion: null,
      showNotification: false,
      backupInfo: null,
      rollbackCompleted: null,
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
      const mockUnlistenRollback = vi.fn();
      mockSubscribeToUpdateEvents.mockResolvedValue(mockUnsubscribe);
      mockOnRollbackCompleted.mockResolvedValue(mockUnlistenRollback);

      const unsubscribe = await useUpdateStore.getState().initEventListeners();

      expect(mockSubscribeToUpdateEvents).toHaveBeenCalledWith({
        onAvailable: expect.any(Function),
        onProgress: expect.any(Function),
        onComplete: expect.any(Function),
        onError: expect.any(Function),
      });
      expect(mockOnRollbackCompleted).toHaveBeenCalledWith(expect.any(Function));

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockUnlistenRollback).toHaveBeenCalled();
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

    it('should load remindLater from localStorage on init', async () => {
      const futureTime = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('splice_remind_later_until', String(futureTime));
      localStorage.setItem('splice_remind_later_version', '1.0.0');

      mockSubscribeToUpdateEvents.mockResolvedValue(vi.fn());

      await useUpdateStore.getState().initEventListeners();

      expect(useUpdateStore.getState().remindLaterUntil).toBe(futureTime);
      expect(useUpdateStore.getState().remindLaterVersion).toBe('1.0.0');
    });

    it('should reset remindLater on new version', async () => {
      useUpdateStore.setState({
        remindLaterVersion: '1.0.0',
        remindLaterUntil: Date.now() + 24 * 60 * 60 * 1000,
      });
      localStorage.setItem('splice_remind_later_until', String(Date.now() + 24 * 60 * 60 * 1000));
      localStorage.setItem('splice_remind_later_version', '1.0.0');

      let capturedHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSubscribeToUpdateEvents.mockImplementation(async (handlers) => {
        capturedHandlers = handlers as Record<string, (...args: unknown[]) => void>;
        return vi.fn();
      });

      await useUpdateStore.getState().initEventListeners();

      // New version detected
      capturedHandlers.onAvailable({
        version: '2.0.0',
        releaseNotes: 'New version',
        isMandatory: false,
      });

      expect(useUpdateStore.getState().remindLaterUntil).toBeNull();
      expect(useUpdateStore.getState().remindLaterVersion).toBeNull();
      expect(localStorage.getItem('splice_remind_later_until')).toBeNull();
    });
  });

  describe('setInstallOnQuit', () => {
    it('should set installOnQuit and call API', async () => {
      mockSetInstallOnQuit.mockResolvedValue(undefined);

      await useUpdateStore.getState().setInstallOnQuit(true);

      expect(mockSetInstallOnQuit).toHaveBeenCalledWith(true);
      expect(useUpdateStore.getState().installOnQuit).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      mockSetInstallOnQuit.mockRejectedValue(new Error('IPC error'));

      await useUpdateStore.getState().setInstallOnQuit(true);

      // Should not have updated local state on error
      expect(useUpdateStore.getState().installOnQuit).toBe(false);
    });
  });

  describe('remindLater', () => {
    it('should set remindLaterUntil to 24h from now', () => {
      useUpdateStore.setState({
        updateInfo: { version: '1.1.0', release_date: '', release_notes: '', download_url: '', is_mandatory: false },
      });

      const before = Date.now();
      useUpdateStore.getState().remindLater();
      const after = Date.now();

      const state = useUpdateStore.getState();
      const expected = 24 * 60 * 60 * 1000;
      expect(state.remindLaterUntil).toBeGreaterThanOrEqual(before + expected);
      expect(state.remindLaterUntil).toBeLessThanOrEqual(after + expected);
      expect(state.showNotification).toBe(false);
    });

    it('should persist to localStorage', () => {
      useUpdateStore.setState({
        updateInfo: { version: '1.1.0', release_date: '', release_notes: '', download_url: '', is_mandatory: false },
      });

      useUpdateStore.getState().remindLater();

      expect(localStorage.getItem('splice_remind_later_until')).not.toBeNull();
      expect(localStorage.getItem('splice_remind_later_version')).toBe('1.1.0');
    });
  });

  describe('shouldShowNotification', () => {
    it('should return true when ready and not busy and not reminded', () => {
      useUpdateStore.setState({ status: 'ready' });
      expect(useUpdateStore.getState().shouldShowNotification(false)).toBe(true);
    });

    it('should return false when status is not ready', () => {
      useUpdateStore.setState({ status: 'available' });
      expect(useUpdateStore.getState().shouldShowNotification(false)).toBe(false);
    });

    it('should return false when busy', () => {
      useUpdateStore.setState({ status: 'ready' });
      expect(useUpdateStore.getState().shouldShowNotification(true)).toBe(false);
    });

    it('should return false when installOnQuit is true', () => {
      useUpdateStore.setState({ status: 'ready', installOnQuit: true });
      expect(useUpdateStore.getState().shouldShowNotification(false)).toBe(false);
    });

    it('should return false when remindLater is active', () => {
      useUpdateStore.setState({
        status: 'ready',
        remindLaterUntil: Date.now() + 24 * 60 * 60 * 1000,
      });
      expect(useUpdateStore.getState().shouldShowNotification(false)).toBe(false);
    });

    it('should return true when remindLater has expired', () => {
      useUpdateStore.setState({
        status: 'ready',
        remindLaterUntil: Date.now() - 1000,
      });
      expect(useUpdateStore.getState().shouldShowNotification(false)).toBe(true);
    });
  });

  describe('fetchBackupInfo', () => {
    it('should fetch and store backup info', async () => {
      const info = { version: '1.0.0', backupDate: '2026-01-15', sizeMb: 50 };
      mockGetBackupInfo.mockResolvedValue(info);

      await useUpdateStore.getState().fetchBackupInfo();

      expect(mockGetBackupInfo).toHaveBeenCalled();
      expect(useUpdateStore.getState().backupInfo).toEqual(info);
    });

    it('should set null when no backup exists', async () => {
      mockGetBackupInfo.mockResolvedValue(null);

      await useUpdateStore.getState().fetchBackupInfo();

      expect(useUpdateStore.getState().backupInfo).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockGetBackupInfo.mockRejectedValue(new Error('IPC error'));

      await useUpdateStore.getState().fetchBackupInfo();

      expect(useUpdateStore.getState().backupInfo).toBeNull();
    });
  });

  describe('performManualRollback', () => {
    it('should call manualRollback API', async () => {
      mockManualRollback.mockResolvedValue(undefined);

      await useUpdateStore.getState().performManualRollback();

      expect(mockManualRollback).toHaveBeenCalled();
    });

    it('should handle rollback errors', async () => {
      mockManualRollback.mockRejectedValue(new Error('No backup found'));

      await useUpdateStore.getState().performManualRollback();

      expect(useUpdateStore.getState().error).toContain('No backup found');
    });
  });

  describe('sendCrashReport', () => {
    it('should call sendCrashReport API with includeLogs', async () => {
      mockSendCrashReport.mockResolvedValue(undefined);

      await useUpdateStore.getState().sendCrashReport(true);

      expect(mockSendCrashReport).toHaveBeenCalledWith(true);
    });

    it('should handle crash report errors gracefully', async () => {
      mockSendCrashReport.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await useUpdateStore.getState().sendCrashReport(false);
    });
  });

  describe('clearRollbackNotification', () => {
    it('should clear rollbackCompleted state', () => {
      useUpdateStore.setState({
        rollbackCompleted: { previousVersion: '1.1.0', restoredVersion: '1.0.0' },
      });

      useUpdateStore.getState().clearRollbackNotification();

      expect(useUpdateStore.getState().rollbackCompleted).toBeNull();
    });
  });

  describe('rollback event listener', () => {
    it('should listen for rollback:completed event on init', async () => {
      const mockUnlistenRollback = vi.fn();
      mockOnRollbackCompleted.mockResolvedValue(mockUnlistenRollback);
      mockSubscribeToUpdateEvents.mockResolvedValue(vi.fn());

      const unsubscribe = await useUpdateStore.getState().initEventListeners();

      expect(mockOnRollbackCompleted).toHaveBeenCalledWith(expect.any(Function));

      unsubscribe();
      expect(mockUnlistenRollback).toHaveBeenCalled();
    });

    it('should set rollbackCompleted on rollback:completed event', async () => {
      let rollbackCallback: (event: { previousVersion: string; restoredVersion: string }) => void = () => {};
      mockOnRollbackCompleted.mockImplementation(async (cb) => {
        rollbackCallback = cb;
        return vi.fn();
      });
      mockSubscribeToUpdateEvents.mockResolvedValue(vi.fn());

      await useUpdateStore.getState().initEventListeners();

      rollbackCallback({ previousVersion: '1.1.0', restoredVersion: '1.0.0' });

      expect(useUpdateStore.getState().rollbackCompleted).toEqual({
        previousVersion: '1.1.0',
        restoredVersion: '1.0.0',
      });
    });
  });
});
