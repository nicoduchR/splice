import React from 'react';
import type { TranscriptWord as TWord } from '@splice/types';
import { cn } from '../../lib/utils';

export interface TranscriptWordProps {
  word: TWord;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onShiftClick: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
}

export const TranscriptWord = React.memo(function TranscriptWord({
  word,
  isSelected,
  isHighlighted,
  onClick,
  onShiftClick,
  onMouseDown,
  onMouseEnter,
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
      aria-label={isSelected ? `${word.text}, sélectionné` : word.text}
      aria-roledescription="mot"
      data-word-index={word.index}
      data-word-selected={isSelected ? "true" : undefined}
      data-word-highlighted={isHighlighted && !isSelected ? "true" : undefined}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={cn(
        'cursor-pointer transition-colors duration-150 rounded px-0.5',
        'hover:bg-primary/10',
        isSelected && 'bg-emerald-500/30 text-white border-b-2 border-emerald-500',
        isHighlighted && !isSelected && 'bg-yellow-500/30 text-white ring-2 ring-yellow-400/70 rounded-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark'
      )}
    >
      {word.text}
    </span>
  );
});
