import { useCallback } from 'react';
import { useTimelineStore } from '../stores/timeline-store';

const FRAME_DURATION = 1 / 30; // ~0.033s per frame at 30fps
const JUMP_DURATION = 5; // 5 seconds for Shift+Arrow

export function useTimelineKeyboardNav() {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Don't capture if focus is on an input or textarea
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    )
      return;

    const { currentTime, duration, seek } = useTimelineStore.getState();

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (e.shiftKey) {
          seek(Math.max(0, currentTime - JUMP_DURATION));
        } else {
          seek(Math.max(0, currentTime - FRAME_DURATION));
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (e.shiftKey) {
          seek(Math.min(duration, currentTime + JUMP_DURATION));
        } else {
          seek(Math.min(duration, currentTime + FRAME_DURATION));
        }
        break;

      case 'Home':
        e.preventDefault();
        seek(0);
        break;

      case 'End':
        e.preventDefault();
        seek(duration);
        break;
    }
  // Empty deps: getState() always returns fresh state from Zustand, no stale closures
  }, []);

  return { handleKeyDown };
}
