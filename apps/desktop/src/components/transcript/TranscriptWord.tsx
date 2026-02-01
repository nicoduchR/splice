import React from 'react';
import type { TranscriptWord as TWord } from '@splice/types';
import { formatTimestamp } from '../../utils/transcript-utils';
import { cn } from '../../lib/utils';

export interface TranscriptWordProps {
  word: TWord;
  isSelected: boolean;
  isHighlighted: boolean; // Pour recherche
  showTimestamp: boolean;
  onClick: () => void;
  onShiftClick: () => void;
}

export const TranscriptWord = React.memo(function TranscriptWord({
  word,
  isSelected,
  isHighlighted,
  showTimestamp,
  onClick,
  onShiftClick,
}: TranscriptWordProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      onShiftClick();
    } else {
      onClick();
    }
  };

  return (
    <span
      role="button"
      tabIndex={-1}
      aria-selected={isSelected}
      data-word-index={word.index}
      onClick={handleClick}
      className={cn(
        'inline-block cursor-pointer transition-colors duration-150 px-1 py-0.5 rounded',
        // Hover state
        'hover:bg-primary/10',
        // Selected state
        isSelected && 'bg-primary/20 text-white',
        // Search highlight state
        isHighlighted && 'bg-yellow-500/30 text-white ring-1 ring-yellow-500/50',
        // Focus visible (keyboard navigation)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark'
      )}
    >
      {word.text}
      {showTimestamp && (
        <span className="ml-1 text-xs font-mono text-muted-foreground">
          {formatTimestamp(word.start_time)}
        </span>
      )}
    </span>
  );
});
