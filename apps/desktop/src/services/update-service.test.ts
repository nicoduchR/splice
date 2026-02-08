import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { UnlistenFn } from '@tauri-apps/api/event';
import {
  checkForUpdate,
  downloadUpdate,
  cancelUpdateDownload,
  getUpdateStatus,
  installUpdate,
  onUpdateAvailable,
  onUpdateDownloadProgress,
  onUpdateDownloadComplete,
  onUpdateError,
  subscribeToUpdateEvents,
} from './update-service';

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

describe('update-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkForUpdate', () => {
    it('should invoke check_for_update command', async () => {
      const response = { status: 'available', updateInfo: { version: '1.1.0', release_date: '', release_notes: '', download_url: '', is_mandatory: false }, downloadProgress: null, error: null };
      mockInvoke.mockResolvedValue(response);

      const result = await checkForUpdate();

      expect(mockInvoke).toHaveBeenCalledWith('check_for_update');
      expect(result).toEqual(response);
    });

    it('should return up_to_date when no update available', async () => {
      const response = { status: 'up_to_date', updateInfo: null, downloadProgress: null, error: null };
      mockInvoke.mockResolvedValue(response);

      const result = await checkForUpdate();

      expect(result.status).toBe('up_to_date');
      expect(result.updateInfo).toBeNull();
    });

    it('should propagate errors from invoke', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      await expect(checkForUpdate()).rejects.toThrow('Network error');
    });
  });

  describe('downloadUpdate', () => {
    it('should invoke download_update command', async () => {
      const response = { status: 'downloading', updateInfo: null, downloadProgress: null, error: null };
      mockInvoke.mockResolvedValue(response);

      const result = await downloadUpdate();

      expect(mockInvoke).toHaveBeenCalledWith('download_update');
      expect(result).toEqual(response);
    });
  });

  describe('cancelUpdateDownload', () => {
    it('should invoke cancel_update_download command', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await cancelUpdateDownload();

      expect(mockInvoke).toHaveBeenCalledWith('cancel_update_download');
    });
  });

  describe('getUpdateStatus', () => {
    it('should invoke get_update_status command', async () => {
      const response = { status: 'idle', updateInfo: null, downloadProgress: null, error: null };
      mockInvoke.mockResolvedValue(response);

      const result = await getUpdateStatus();

      expect(mockInvoke).toHaveBeenCalledWith('get_update_status');
      expect(result).toEqual(response);
    });
  });

  describe('installUpdate', () => {
    it('should invoke install_update command', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await installUpdate();

      expect(mockInvoke).toHaveBeenCalledWith('install_update');
    });
  });

  describe('event listeners', () => {
    const mockUnlisten: UnlistenFn = vi.fn();

    beforeEach(() => {
      mockListen.mockResolvedValue(mockUnlisten);
    });

    it('should listen to update:available events and forward payload', async () => {
      const callback = vi.fn();
      await onUpdateAvailable(callback);

      expect(mockListen).toHaveBeenCalledWith('update:available', expect.any(Function));

      // Simulate event
      const eventHandler = mockListen.mock.calls[0][1] as (event: { payload: unknown }) => void;
      const payload = { version: '2.0.0', releaseNotes: 'New', isMandatory: false };
      eventHandler({ payload });

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('should listen to update:download-progress events', async () => {
      const callback = vi.fn();
      await onUpdateDownloadProgress(callback);

      expect(mockListen).toHaveBeenCalledWith('update:download-progress', expect.any(Function));
    });

    it('should listen to update:download-complete events', async () => {
      const callback = vi.fn();
      await onUpdateDownloadComplete(callback);

      expect(mockListen).toHaveBeenCalledWith('update:download-complete', expect.any(Function));
    });

    it('should listen to update:error events', async () => {
      const callback = vi.fn();
      await onUpdateError(callback);

      expect(mockListen).toHaveBeenCalledWith('update:error', expect.any(Function));
    });

    it('should subscribe to all events and return composite unsubscribe', async () => {
      const handlers = {
        onAvailable: vi.fn(),
        onProgress: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      const unsubscribe = await subscribeToUpdateEvents(handlers);

      expect(mockListen).toHaveBeenCalledTimes(4);

      unsubscribe();
      expect(mockUnlisten).toHaveBeenCalledTimes(4);
    });

    it('should only subscribe to provided handlers', async () => {
      const handlers = {
        onAvailable: vi.fn(),
      };

      await subscribeToUpdateEvents(handlers);

      expect(mockListen).toHaveBeenCalledTimes(1);
      expect(mockListen).toHaveBeenCalledWith('update:available', expect.any(Function));
    });
  });
});
