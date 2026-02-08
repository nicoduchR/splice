import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useTimelineStore } from '../../stores/timeline-store';
import { useTranscriptStore } from '../../stores/transcript-store';
import { useVideoStore } from '../../stores/video-store';
import { formatTimecode } from '../../lib/format-timecode';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface VideoPlayerProps {
  filePath: string;
  width?: number;
  height?: number;
  onSegmentClick?: (startWordIndex: number) => void;
}

export const VideoPlayer = React.memo(function VideoPlayer({
  filePath,
  width,
  height,
  onSegmentClick,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);

  // Timeline store
  const currentTime = useTimelineStore((s) => s.currentTime);
  const duration = useTimelineStore((s) => s.duration);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const volume = useTimelineStore((s) => s.volume);
  const isSeeking = useTimelineStore((s) => s.isSeeking);
  const segments = useTimelineStore((s) => s.segments);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);
  const setDuration = useTimelineStore((s) => s.setDuration);
  const togglePlayback = useTimelineStore((s) => s.togglePlayback);
  const setPlaying = useTimelineStore((s) => s.setPlaying);
  const setVolume = useTimelineStore((s) => s.setVolume);
  const seek = useTimelineStore((s) => s.seek);
  const setSeeking = useTimelineStore((s) => s.setSeeking);

  // Proxy support: use proxy path if available
  const proxyPath = useVideoStore((s) => s.proxyPath);
  const effectivePath = proxyPath ?? filePath;

  // For segment click → word index
  const selections = useTranscriptStore((s) => s.selections);
  const selectionMap = useMemo(() => {
    const map = new Map<string, { startWordIndex: number }>();
    for (const sel of selections) {
      map.set(sel.id, { startWordIndex: sel.startWordIndex });
    }
    return map;
  }, [selections]);

  const videoSrc = useMemo(() => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      return convertFileSrc(effectivePath, 'asset');
    }
    return effectivePath;
  }, [effectivePath]);

  // Resolution badge
  const resolutionLabel = useMemo(() => {
    if (!width || !height) return null;
    if (width >= 3840) return '4K';
    if (width >= 1920) return 'HD 1080p';
    if (width >= 1280) return 'HD 720p';
    if (width >= 854) return '480p';
    return `${width}×${height}`;
  }, [width, height]);

  // Preserve currentTime when switching source (proxy ↔ original)
  const prevSrcRef = useRef(videoSrc);
  useEffect(() => {
    if (prevSrcRef.current !== videoSrc) {
      prevSrcRef.current = videoSrc;
      const video = videoRef.current;
      if (video) {
        const savedTime = currentTime;
        const onLoaded = () => {
          video.currentTime = savedTime;
          video.removeEventListener('loadedmetadata', onLoaded);
        };
        video.addEventListener('loadedmetadata', onLoaded);
      }
    }
  }, [videoSrc, currentTime]);

  // Sync video element → store (debounced timeupdate)
  const lastTimeUpdate = useRef(0);
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || isSeeking) return;
    const now = performance.now();
    if (now - lastTimeUpdate.current < 100) return;
    lastTimeUpdate.current = now;
    setCurrentTime(video.currentTime);
  }, [isSeeking, setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, [setDuration]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
  }, [setPlaying]);

  // Sync store → video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.volume = volume;
  }, [volume]);

  // When store currentTime changes from seek, update video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isSeeking) return;
    video.currentTime = currentTime;
  }, [currentTime, isSeeking]);

  // Scrubber click/drag
  const scrubFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const bar = scrubberRef.current;
      if (!bar || duration <= 0) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seek(ratio * duration);
    },
    [duration, seek]
  );

  const handleScrubberMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setSeeking(true);
      scrubFromEvent(e);

      const handleMove = (ev: MouseEvent) => scrubFromEvent(ev);
      const handleUp = () => {
        setSeeking(false);
        // Sync final position to video
        const video = videoRef.current;
        if (video) video.currentTime = useTimelineStore.getState().currentTime;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [setSeeking, scrubFromEvent]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if focus is on an input, textarea, or button
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
          seek(Math.max(0, useTimelineStore.getState().currentTime - 5));
          if (videoRef.current)
            videoRef.current.currentTime = useTimelineStore.getState().currentTime;
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(useTimelineStore.getState().currentTime + 5);
          if (videoRef.current)
            videoRef.current.currentTime = useTimelineStore.getState().currentTime;
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, seek]);

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Video container */}
      <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoSrc}
          className="max-w-full max-h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          playsInline
        />

        {/* Play overlay */}
        {!isPlaying && (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 text-white ml-1" />
            </div>
          </button>
        )}

        {/* Resolution badge */}
        {resolutionLabel && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 text-xs text-white font-medium">
            {resolutionLabel}
          </div>
        )}
      </div>

      {/* Scrubber */}
      <div className="px-4 pt-3 pb-1 bg-panel-dark">
        <TooltipProvider delayDuration={200}>
          <div
            ref={scrubberRef}
            className="relative w-full bg-muted rounded-full cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ height: 8 }}
            onMouseDown={handleScrubberMouseDown}
            role="slider"
            aria-label="Video scrubber"
            tabIndex={0}
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
          >
            {/* Segments */}
            {segments.map((segment) => {
              const leftPercent = duration > 0 ? (segment.startTime / duration) * 100 : 0;
              const widthPercent = duration > 0 ? ((segment.endTime - segment.startTime) / duration) * 100 : 0;
              return (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-0 h-full bg-emerald-500 rounded-full hover:bg-emerald-400 transition-colors"
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const sel = selectionMap.get(segment.id);
                        if (sel && onSegmentClick) onSegmentClick(sel.startWordIndex);
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {formatTimecode(segment.startTime)} → {formatTimecode(segment.endTime)}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Playhead */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md pointer-events-none transition-[left] duration-75 group-hover:scale-125"
              style={{ left: `${playheadPercent}%` }}
            />
          </div>
        </TooltipProvider>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-panel-dark">
        {/* Left: transport */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => {
              seek(Math.max(0, useTimelineStore.getState().currentTime - 5));
              if (videoRef.current) videoRef.current.currentTime = useTimelineStore.getState().currentTime;
            }}
            aria-label="Reculer 5s"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-muted/30 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => {
              seek(useTimelineStore.getState().currentTime + 5);
              if (videoRef.current) videoRef.current.currentTime = useTimelineStore.getState().currentTime;
            }}
            aria-label="Avancer 5s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center: timecode */}
        <div className="text-xs text-muted-foreground tabular-nums">
          {formatTimecode(currentTime)} / {formatTimecode(duration)}
        </div>

        {/* Right: volume */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
            aria-label={volume > 0 ? 'Couper le son' : 'Rétablir le son'}
          >
            {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 accent-primary"
          />
        </div>
      </div>
    </div>
  );
});
