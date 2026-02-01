import React, { useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TranscriptWord as TWord } from '@splice/types';
import { TranscriptWord } from './TranscriptWord';
import { useTranscriptKeyboardNav } from '../../hooks/use-transcript-keyboard-nav';
import { detectParagraphs } from '../../utils/transcript-utils';

export interface TranscriptViewerProps {
  words: TWord[];
  selectedIndices: number[];
  onWordClick: (index: number) => void;
  onSelectionChange: (startIndex: number, endIndex: number) => void;
  onClearSelection?: () => void;
  showTimestamps?: boolean;
  searchQuery?: string;
  className?: string;
}

export const TranscriptViewer = React.memo(function TranscriptViewer({
  words,
  selectedIndices,
  onWordClick,
  onSelectionChange,
  onClearSelection,
  showTimestamps = false,
  searchQuery = '',
  className = '',
}: TranscriptViewerProps) {
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Detect paragraph breaks for spacing
  const paragraphStarts = useMemo(() => detectParagraphs(words), [words]);

  // Virtual scrolling configuration
  const virtualizer = useVirtualizer({
    count: words.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 28, // Estimated word height
    overscan: 50, // Render 50 extra items outside viewport for smooth scrolling
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Scroll to index helper for keyboard navigation
  const scrollToIndex = useCallback(
    (index: number) => {
      virtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
    },
    [virtualizer]
  );

  // Setup keyboard navigation
  useTranscriptKeyboardNav(
    words,
    selectedIndices,
    onSelectionChange,
    onClearSelection,
    scrollToIndex
  );

  // Word click handler with shift-click support
  const handleWordClick = useCallback(
    (index: number, isShiftClick: boolean) => {
      if (isShiftClick && selectedIndices.length > 0) {
        // Extend selection from last selected to clicked word
        const lastSelected = selectedIndices[selectedIndices.length - 1];
        const startIndex = Math.min(lastSelected, index);
        const endIndex = Math.max(lastSelected, index);
        onSelectionChange(startIndex, endIndex);
      } else {
        // Toggle single word selection
        onWordClick(index);
      }
    },
    [selectedIndices, onWordClick, onSelectionChange]
  );

  // Check if word matches search query
  const isWordHighlighted = useCallback(
    (word: TWord) => {
      if (!searchQuery) return false;
      return word.text.toLowerCase().includes(searchQuery.toLowerCase());
    },
    [searchQuery]
  );

  return (
    <div
      ref={scrollElementRef}
      role="textbox"
      aria-label="Transcript viewer"
      aria-multiline="true"
      aria-readonly="true"
      tabIndex={0}
      className={`h-full overflow-auto ${className}`}
      style={{
        contain: 'strict', // CSS containment for performance
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const word = words[virtualItem.index];
          const isSelected = selectedIndices.includes(virtualItem.index);
          const isHighlighted = isWordHighlighted(word);
          const isParagraphStart = paragraphStarts.includes(virtualItem.index);

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className={isParagraphStart && virtualItem.index !== 0 ? 'mb-4' : ''}
            >
              <TranscriptWord
                word={word}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                showTimestamp={showTimestamps}
                onClick={() => handleWordClick(virtualItem.index, false)}
                onShiftClick={() => handleWordClick(virtualItem.index, true)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
