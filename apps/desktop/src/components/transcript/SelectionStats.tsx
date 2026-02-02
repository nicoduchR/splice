import React, { useMemo } from 'react';
import { useTimelineStore } from '../../stores/timeline-store';
import { formatTimecode } from '../../lib/format-timecode';

function getReductionColor(percent: number): string {
  if (percent > 50) return 'text-emerald-400';
  if (percent >= 20) return 'text-yellow-400';
  return 'text-muted-foreground';
}

export const SelectionStats = React.memo(function SelectionStats() {
  const segments = useTimelineStore((s) => s.segments);
  const duration = useTimelineStore((s) => s.duration);

  const stats = useMemo(() => {
    if (segments.length === 0) return null;
    const selectedDuration = segments.reduce(
      (sum, seg) => sum + (seg.endTime - seg.startTime),
      0
    );
    const reductionPercent =
      duration > 0
        ? Math.round(((duration - selectedDuration) / duration) * 100)
        : 0;
    return {
      segmentCount: segments.length,
      selectedDuration,
      reductionPercent,
    };
  }, [segments, duration]);

  if (!stats) {
    return (
      <span className="text-xs text-muted-foreground">Aucune sélection</span>
    );
  }

  return (
    <span className="text-xs font-medium tabular-nums px-2.5 py-1 bg-muted/20 rounded-full border border-border-dark">
      {stats.segmentCount} segment{stats.segmentCount > 1 ? 's' : ''} &bull;{' '}
      {formatTimecode(stats.selectedDuration)} / {formatTimecode(duration)} &bull;{' '}
      <span className={getReductionColor(stats.reductionPercent)}>
        {stats.reductionPercent}% réduction
      </span>
      {' '}&bull; final {formatTimecode(stats.selectedDuration)}
    </span>
  );
});
