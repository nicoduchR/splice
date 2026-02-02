import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TimelineSegment {
  id: string;
  startTime: number;
  endTime: number;
  selected: boolean;
}

interface TimelineStore {
  // State
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isSeeking: boolean;
  segments: TimelineSegment[];

  // Actions
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  togglePlayback: () => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  setSeeking: (seeking: boolean) => void;
  setSegments: (segments: TimelineSegment[]) => void;
  addSegment: (segment: TimelineSegment) => void;
}

export const useTimelineStore = create<TimelineStore>()(
  devtools(
    (set, get) => ({
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      volume: 0.7,
      isSeeking: false,
      segments: [],

      setCurrentTime: (time) => {
        const { duration } = get();

        // Validate time is non-negative
        if (time < 0) {
          console.warn('Timeline: Attempted to set negative time, clamping to 0');
          set({ currentTime: 0 });
          return;
        }

        // Clamp to duration only if duration is set (> 0)
        const clampedTime = duration > 0 ? Math.min(time, duration) : time;
        set({ currentTime: clampedTime });
      },

      setDuration: (duration) => {
        // Validate duration is non-negative
        if (duration < 0) {
          console.error('Timeline: Invalid negative duration, ignoring');
          return;
        }

        set({ duration });

        // If currentTime exceeds new duration, clamp it
        const { currentTime } = get();
        if (duration > 0 && currentTime > duration) {
          set({ currentTime: duration });
        }
      },

      togglePlayback: () => {
        set({ isPlaying: !get().isPlaying });
      },

      setPlaying: (playing) => {
        set({ isPlaying: playing });
      },

      setVolume: (volume) => {
        set({ volume: Math.max(0, Math.min(1, volume)) });
      },

      seek: (time) => {
        const { duration } = get();
        const clamped = duration > 0 ? Math.min(Math.max(0, time), duration) : Math.max(0, time);
        set({ currentTime: clamped });
      },

      setSeeking: (seeking) => {
        set({ isSeeking: seeking });
      },

      setSegments: (segments) => {
        set({ segments });
      },

      addSegment: (segment) => {
        set({ segments: [...get().segments, segment] });
      },
    }),
    { name: 'TimelineStore' }
  )
);
