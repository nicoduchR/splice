import React, { useCallback, useMemo } from 'react';
import { useTimelineStore } from '../../stores/timeline-store';
import { useTranscriptStore } from '../../stores/transcript-store';
import { formatTimecode } from '../../lib/format-timecode';
import { useTimelineKeyboardNav } from '../../hooks/use-timeline-keyboard-nav';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface TimelineBarProps {
  onSegmentClick?: (startWordIndex: number) => void;
}

export const TimelineBar = React.memo(function TimelineBar({
  onSegmentClick,
}: TimelineBarProps) {
  const segments = useTimelineStore((s) => s.segments);
  const duration = useTimelineStore((s) => s.duration);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const selections = useTranscriptStore((s) => s.selections);
  const transcript = useTranscriptStore((s) => s.transcript);

  // Map segment id → selection for word index lookup
  const selectionMap = useMemo(() => {
    const map = new Map<string, { startWordIndex: number; endWordIndex: number }>();
    for (const sel of selections) {
      map.set(sel.id, { startWordIndex: sel.startWordIndex, endWordIndex: sel.endWordIndex });
    }
    return map;
  }, [selections]);

  // Extract text preview for a segment from transcript words
  const getTextPreview = useCallback(
    (segmentId: string): string => {
      const sel = selectionMap.get(segmentId);
      if (!sel || !transcript?.words) return '';
      const words = transcript.words
        .slice(sel.startWordIndex, sel.endWordIndex + 1)
        .map((w) => w.text);
      const text = words.join(' ');
      return text.length > 50 ? text.slice(0, 50) + '…' : text;
    },
    [selectionMap, transcript]
  );

  const { handleKeyDown: handleTimelineKeyDown } = useTimelineKeyboardNav();

  const handleSegmentClick = (segmentId: string) => {
    if (!onSegmentClick) return;
    const sel = selectionMap.get(segmentId);
    if (sel) {
      onSegmentClick(sel.startWordIndex);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        id="timeline"
        className="relative w-full bg-muted rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{ height: 48 }}
        role="region"
        aria-label="Timeline"
        aria-roledescription="timeline vidéo"
        data-testid="timeline-bar"
        tabIndex={0}
        onKeyDown={handleTimelineKeyDown}
      >
        {duration > 0 && (
          <>
            {/* Selected segments */}
            {segments.map((segment) => {
              const leftPercent = (segment.startTime / duration) * 100;
              const widthPercent =
                ((segment.endTime - segment.startTime) / duration) * 100;

              return (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="absolute top-0 h-full bg-emerald-600 hover:bg-emerald-500 rounded border border-emerald-400 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      data-testid="timeline-segment"
                      data-segment-id={segment.id}
                      onClick={() => handleSegmentClick(segment.id)}
                      aria-label={`Segment ${formatTimecode(segment.startTime)} - ${formatTimecode(segment.endTime)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-xs space-y-0.5">
                      <div className="font-medium">
                        {formatTimecode(segment.startTime)} → {formatTimecode(segment.endTime)}
                      </div>
                      <div className="text-muted-foreground">
                        Durée : {formatTimecode(segment.endTime - segment.startTime)}
                      </div>
                      <div className="text-muted-foreground italic max-w-[200px] truncate">
                        {getTextPreview(segment.id)}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Playhead */}
            {currentTime > 0 && (
              <div
                className="absolute top-0 h-full pointer-events-none transition-[left] duration-100"
                style={{ left: `${(currentTime / duration) * 100}%` }}
                data-testid="timeline-playhead"
              >
                {/* Handle circle */}
                <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md" />
                {/* Vertical line */}
                <div className="absolute top-0 -translate-x-1/2 w-0.5 h-full bg-white" />
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
});
