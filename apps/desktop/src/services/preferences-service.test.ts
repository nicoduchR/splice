import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import {
  getPreference,
  getTypedPreference,
  setPreference,
  setTypedPreference,
  getAllPreferences,
  PREF_TEMP_DIRECTORY,
} from './preferences-service';

const mockInvoke = vi.mocked(invoke);

describe('preferences-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreference', () => {
    it('calls invoke with correct command and key', async () => {
      mockInvoke.mockResolvedValue('/custom/path');
      const result = await getPreference('temp_directory');
      expect(mockInvoke).toHaveBeenCalledWith('get_preference', { key: 'temp_directory' });
      expect(result).toBe('/custom/path');
    });

    it('returns null when preference not set', async () => {
      mockInvoke.mockResolvedValue(null);
      const result = await getPreference('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getTypedPreference', () => {
    it('parses JSON values', async () => {
      mockInvoke.mockResolvedValue('{"enabled":true,"count":5}');
      const result = await getTypedPreference<{ enabled: boolean; count: number }>('settings');
      expect(result).toEqual({ enabled: true, count: 5 });
    });

    it('returns string values as-is when not JSON', async () => {
      mockInvoke.mockResolvedValue('/custom/path');
      const result = await getTypedPreference<string>('temp_directory');
      expect(result).toBe('/custom/path');
    });

    it('returns null when preference not set', async () => {
      mockInvoke.mockResolvedValue(null);
      const result = await getTypedPreference<string>('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('setPreference', () => {
    it('calls invoke with correct command and params', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await setPreference('temp_directory', '/new/path');
      expect(mockInvoke).toHaveBeenCalledWith('set_preference', {
        key: 'temp_directory',
        value: '/new/path',
      });
    });
  });

  describe('setTypedPreference', () => {
    it('serializes objects to JSON', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await setTypedPreference('settings', { enabled: true });
      expect(mockInvoke).toHaveBeenCalledWith('set_preference', {
        key: 'settings',
        value: '{"enabled":true}',
      });
    });

    it('passes string values directly', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await setTypedPreference('temp_directory', '/path');
      expect(mockInvoke).toHaveBeenCalledWith('set_preference', {
        key: 'temp_directory',
        value: '/path',
      });
    });
  });

  describe('getAllPreferences', () => {
    it('returns all preference entries', async () => {
      const entries = [
        { key: 'temp_directory', value: '/custom' },
        { key: 'theme', value: 'dark' },
      ];
      mockInvoke.mockResolvedValue(entries);
      const result = await getAllPreferences();
      expect(mockInvoke).toHaveBeenCalledWith('get_all_preferences');
      expect(result).toEqual(entries);
    });

    it('returns empty array when no preferences', async () => {
      mockInvoke.mockResolvedValue([]);
      const result = await getAllPreferences();
      expect(result).toEqual([]);
    });
  });

  describe('PREF_TEMP_DIRECTORY', () => {
    it('has correct key value', () => {
      expect(PREF_TEMP_DIRECTORY).toBe('temp_directory');
    });
  });
});
