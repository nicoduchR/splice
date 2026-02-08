/**
 * Project State Service
 *
 * Handles communication with Tauri backend for project state
 * persistence (auto-save, crash recovery, clean shutdown).
 */

import { invoke } from '@tauri-apps/api/core';

export interface ProjectState {
  id: number;
  project_id: string | null;
  timeline_position: number;
  volume: number;
  last_saved_at: number | null;
  was_clean_shutdown: boolean;
}

/**
 * Save the current project state to SQLite
 */
export async function saveProjectState(state: {
  projectId: string | null;
  timelinePosition: number;
  volume: number;
}): Promise<void> {
  return invoke('save_project_state', {
    state: {
      id: 1,
      project_id: state.projectId,
      timeline_position: state.timelinePosition,
      volume: state.volume,
      last_saved_at: Math.floor(Date.now() / 1000),
      was_clean_shutdown: false,
    },
  });
}

/**
 * Load the persisted project state from SQLite
 */
export async function loadProjectState(): Promise<ProjectState | null> {
  return invoke<ProjectState | null>('load_project_state');
}

/**
 * Mark the current shutdown as clean (called before app closes)
 */
export async function markCleanShutdown(): Promise<void> {
  return invoke('mark_clean_shutdown');
}

/**
 * Check if the last shutdown was dirty (crash detected)
 */
export async function checkDirtyShutdown(): Promise<boolean> {
  return invoke<boolean>('check_dirty_shutdown');
}
