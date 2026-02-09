import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { formatTimecode } from '../../lib/format-timecode';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import type { SegmentBoundary } from '../../stores/segmentation-store';

interface PreviewPlayerProps {
  filePath: string;
  segmentBoundaries?: SegmentBoundary[];
}

export function PreviewPlayer({ filePath, segmentBoundaries = [] }: PreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [previousVolume, setPreviousVolume] = useState(0.7);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredBoundary, setHoveredBoundary] = useState<number | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const videoSrc = useMemo(() => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      return convertFileSrc(filePath, 'asset');
    }
    return filePath;
  }, [filePath]);

  // Auto-play on load (AC #3)
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && isFinite(video.duration)) {
      setDuration(video.duration);
      video.play().catch(() => {});
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
    const video = videoRef.current;
    if (video) video.volume = clamped;
  }, []);

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setPreviousVolume(volume);
      handleVolumeChange(0);
    } else {
      handleVolumeChange(previousVolume || 0.7);
    }
  }, [volume, previousVolume, handleVolumeChange]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Set initial volume
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.volume = volume;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scrubber click handler
  const scrubFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const bar = scrubberRef.current;
      if (!bar || duration <= 0) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      handleSeek(ratio * duration);
    },
    [duration, handleSeek]
  );

  const handleScrubberMouseDown = useCallback(
    (e: React.MouseEvent) => {
      scrubFromEvent(e);
      const handleMove = (ev: MouseEvent) => scrubFromEvent(ev);
      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [scrubFromEvent]
  );

  // Keyboard shortcuts (AC #5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLButtonElement
      )
        return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek((videoRef.current?.currentTime ?? 0) - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek((videoRef.current?.currentTime ?? 0) + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(volumeRef.current + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(volumeRef.current - 0.1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, handleSeek, handleVolumeChange, toggleFullscreen]);

  // Seek bar keyboard handler (WCAG AA - slider must respond to arrow keys when focused)
  const handleScrubberKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = 5; // seconds
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        handleSeek((videoRef.current?.currentTime ?? 0) + step);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        handleSeek((videoRef.current?.currentTime ?? 0) - step);
      }
    },
    [handleSeek]
  );

  // Screen reader: announce play/pause state changes
  const [srPlayState, setSrPlayState] = useState('');
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSrPlayState(isPlaying ? 'Lecture' : 'Pause');
  }, [isPlaying]);

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full bg-black">
      {/* Video container */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoSrc}
          className="max-w-full max-h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={handlePlay}
          onPause={handlePause}
          playsInline
        />
      </div>

      {/* Seek bar (AC #4) */}
      <div className="px-4 pt-3 pb-1">
        <div
          ref={scrubberRef}
          className="relative w-full bg-muted rounded-full cursor-pointer group"
          style={{ height: 8 }}
          onMouseDown={handleScrubberMouseDown}
          onKeyDown={handleScrubberKeyDown}
          role="slider"
          aria-label="Barre de progression vidéo"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          tabIndex={0}
        >
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
            style={{ width: `${playheadPercent}%` }}
          />
          {/* Playhead */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md pointer-events-none transition-[left] duration-75 group-hover:scale-125"
            style={{ left: `${playheadPercent}%` }}
          />
          {/* Segment boundary markers */}
          {duration > 0 && segmentBoundaries.map((boundary, i) => {
            // Show markers at segment start positions (skip first segment — starts at 0)
            if (i === 0) return null;
            const percent = (boundary.start_time / duration) * 100;
            if (percent <= 0 || percent >= 100) return null;
            return (
              <div
                key={boundary.index}
                role="button"
                tabIndex={0}
                aria-label={`Segment ${boundary.index + 1} — ${formatTimecode(boundary.start_time)}`}
                className="absolute top-0 h-full cursor-pointer z-10"
                style={{ left: `${percent}%`, width: 8, transform: 'translateX(-50%)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek(boundary.start_time);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSeek(boundary.start_time);
                  }
                }}
                onMouseEnter={() => setHoveredBoundary(i)}
                onMouseLeave={() => setHoveredBoundary(null)}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-400/50" />
                {hoveredBoundary === i && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none">
                    Segment {boundary.index + 1} — {formatTimecode(boundary.start_time)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: play/pause */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-muted/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            tabIndex={0}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>

        {/* Center: timecode */}
        <div className="text-xs text-muted-foreground tabular-nums">
          {formatTimecode(currentTime)} / {formatTimecode(duration)}
        </div>

        {/* Right: volume + fullscreen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            onClick={toggleMute}
            aria-label={volume > 0 ? 'Couper le son' : 'Rétablir le son'}
            tabIndex={0}
          >
            {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-1 accent-primary"
            aria-label="Volume"
            role="slider"
            aria-valuenow={Math.round(volume * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
          />
          <button
            type="button"
            className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            tabIndex={0}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Screen reader: announce play/pause */}
      <span aria-live="polite" className="sr-only">
        {srPlayState}
      </span>
    </div>
  );
}
