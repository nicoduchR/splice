/**
 * Preferences Service
 *
 * Handles communication with Tauri backend for user preferences
 * persistence (temp directory, settings).
 */

import { invoke } from '@tauri-apps/api/core';
import type { PreferenceEntry } from '@splice/types/generated';

/**
 * Get a single preference value by key.
 * Returns null if the preference is not set.
 */
export async function getPreference(key: string): Promise<string | null> {
  return invoke<string | null>('get_preference', { key });
}

/**
 * Get a typed preference value by key, parsed from JSON.
 * Returns null if the preference is not set.
 */
export async function getTypedPreference<T>(key: string): Promise<T | null> {
  const value = await getPreference(key);
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    // If not valid JSON, return as-is (for simple string values)
    return value as unknown as T;
  }
}

/**
 * Set a preference value (creates or updates).
 */
export async function setPreference(key: string, value: string): Promise<void> {
  return invoke('set_preference', { key, value });
}

/**
 * Set a typed preference value, serialized to JSON.
 */
export async function setTypedPreference<T>(key: string, value: T): Promise<void> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  return setPreference(key, serialized);
}

/**
 * Get all preferences as key-value entries.
 */
export async function getAllPreferences(): Promise<PreferenceEntry[]> {
  return invoke<PreferenceEntry[]>('get_all_preferences');
}

// Well-known preference keys
export const PREF_TEMP_DIRECTORY = 'temp_directory';
export const PREF_TRANSCRIPTION_LANGUAGE_MODE = 'transcription.language_mode';
export const PREF_TRANSCRIPTION_WHISPER_PROFILE = 'transcription.whisper_profile';
export const PREF_TRANSCRIPTION_WHISPER_AUTO_APPLY_IF_UNEDITED = 'transcription.whisper_auto_apply_if_unedited';
