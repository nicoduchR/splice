import { useEffect, useRef } from 'react';
import { useTimelineStore } from '../stores/timeline-store';
import { saveProjectState } from '../services/project-state-service';

/**
 * Hook that auto-saves project state (timeline position, volume) every 30 seconds.
 * Only active when a projectId is provided (i.e., a project is loaded).
 */
export function useProjectStateAutosave(projectId: string | null) {
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  useEffect(() => {
    if (!projectId) return;

    const save = () => {
      const { currentTime, volume } = useTimelineStore.getState();
      const currentProjectId = projectIdRef.current;
      if (!currentProjectId) return;

      saveProjectState({
        projectId: currentProjectId,
        timelinePosition: currentTime,
        volume,
      }).catch((e) => {
        console.error('Failed to auto-save project state:', e);
      });
    };

    // Save immediately on mount (project loaded)
    save();

    // Auto-save every 30 seconds
    const intervalId = setInterval(save, 30_000);

    return () => {
      // Final save before cleanup
      save();
      clearInterval(intervalId);
    };
  }, [projectId]);
}
