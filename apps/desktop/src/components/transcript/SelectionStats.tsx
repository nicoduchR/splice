import React, { useMemo } from 'react';
import { useTimelineStore } from '../../stores/timeline-store';
import { formatTimecode } from '../../lib/format-timecode';

interface SelectionStatsProps {
  selectionMode?: 'keep' | 'remove';
}

function getReductionColor(percent: number): string {
  if (percent > 50) return 'text-emerald-400';
  if (percent >= 20) return 'text-yellow-400';
  return 'text-muted-foreground';
}

export const SelectionStats = React.memo(function SelectionStats({
  selectionMode = 'keep',
}: SelectionStatsProps) {
  const segments = useTimelineStore((s) => s.segments);
  const duration = useTimelineStore((s) => s.duration);

  const stats = useMemo(() => {
    if (segments.length === 0) return null;

    const selectedDuration = segments.reduce(
      (sum, seg) => sum + (seg.endTime - seg.startTime),
      0
    );

    const removedDuration = selectionMode === 'remove'
      ? selectedDuration
      : Math.max(duration - selectedDuration, 0);
    const keptDuration = Math.max(duration - removedDuration, 0);
    const reductionPercent = duration > 0
      ? Math.round((removedDuration / duration) * 100)
      : 0;

    return {
      segmentCount: segments.length,
      selectedDuration,
      removedDuration,
      keptDuration,
      reductionPercent,
    };
  }, [segments, duration, selectionMode]);

  if (!stats) {
    return (
      <span className="text-xs text-muted-foreground">
        {selectionMode === 'remove' ? 'Aucune sélection à supprimer' : 'Aucune sélection'}
      </span>
    );
  }

  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      className="text-xs font-medium tabular-nums px-2.5 py-1 bg-muted/20 rounded-full border border-border-dark"
    >
      {stats.segmentCount} segment{stats.segmentCount > 1 ? 's' : ''}{' '}
      {selectionMode === 'remove'
        ? 'à supprimer'
        : `conservé${stats.segmentCount > 1 ? 's' : ''}`}{' '}
      &bull;{' '}
      {selectionMode === 'remove'
        ? `${formatTimecode(stats.removedDuration)} retirés`
        : formatTimecode(stats.selectedDuration)}{' '}
      / {formatTimecode(duration)} &bull;{' '}
      <span className={getReductionColor(stats.reductionPercent)}>
        {stats.reductionPercent}% réduction
      </span>
      {' '}&bull; final {formatTimecode(stats.keptDuration)}
    </span>
  );
});
