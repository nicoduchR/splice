import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveProjectState, loadProjectState, markCleanShutdown, checkDirtyShutdown } from './project-state-service';

const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe('project-state-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveProjectState', () => {
    it('invokes save_project_state with correct payload', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await saveProjectState({
        projectId: 'project-1',
        timelinePosition: 42.5,
        volume: 0.8,
      });

      expect(mockInvoke).toHaveBeenCalledWith('save_project_state', {
        state: expect.objectContaining({
          id: 1,
          project_id: 'project-1',
          timeline_position: 42.5,
          volume: 0.8,
          was_clean_shutdown: false,
        }),
      });
    });

    it('includes last_saved_at timestamp', async () => {
      mockInvoke.mockResolvedValue(undefined);
      const before = Math.floor(Date.now() / 1000);

      await saveProjectState({
        projectId: 'project-1',
        timelinePosition: 0,
        volume: 1,
      });

      const call = mockInvoke.mock.calls[0];
      const lastSavedAt = call[1].state.last_saved_at;
      expect(lastSavedAt).toBeGreaterThanOrEqual(before);
      expect(lastSavedAt).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    });
  });

  describe('loadProjectState', () => {
    it('returns project state when available', async () => {
      const mockState = {
        id: 1,
        project_id: 'project-1',
        timeline_position: 30.0,
        volume: 0.5,
        last_saved_at: 1706745600,
        was_clean_shutdown: false,
      };
      mockInvoke.mockResolvedValue(mockState);

      const result = await loadProjectState();
      expect(result).toEqual(mockState);
      expect(mockInvoke).toHaveBeenCalledWith('load_project_state');
    });

    it('returns null when no state saved', async () => {
      mockInvoke.mockResolvedValue(null);
      const result = await loadProjectState();
      expect(result).toBeNull();
    });
  });

  describe('markCleanShutdown', () => {
    it('invokes mark_clean_shutdown', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await markCleanShutdown();
      expect(mockInvoke).toHaveBeenCalledWith('mark_clean_shutdown');
    });
  });

  describe('checkDirtyShutdown', () => {
    it('returns true when dirty shutdown detected', async () => {
      mockInvoke.mockResolvedValue(true);
      const result = await checkDirtyShutdown();
      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('check_dirty_shutdown');
    });

    it('returns false when clean shutdown', async () => {
      mockInvoke.mockResolvedValue(false);
      const result = await checkDirtyShutdown();
      expect(result).toBe(false);
    });
  });
});
