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
      data-word-index={word.index}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={cn(
        'cursor-pointer transition-colors duration-150 rounded px-0.5',
        'hover:bg-primary/10',
        isSelected && 'bg-emerald-500/30 text-white',
        isHighlighted && !isSelected && 'bg-yellow-500/30 text-white ring-1 ring-yellow-500/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark'
      )}
    >
      {word.text}
    </span>
  );
});
