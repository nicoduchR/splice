import React, { useRef, useCallback, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TranscriptWord as TWord } from '@splice/types';
import { TranscriptWord } from './TranscriptWord';
import { useTranscriptKeyboardNav } from '../../hooks/use-transcript-keyboard-nav';
import { detectParagraphs, formatTimestamp } from '../../utils/transcript-utils';

interface Paragraph {
  startIndex: number;
  words: TWord[];
  timestamp: number;
}

export interface TranscriptViewerProps {
  words: TWord[];
  selectedIndices: number[];
  onWordClick: (index: number) => void;
  onSelectionChange: (startIndex: number, endIndex: number) => void;
  onToggleRange?: (startIndex: number, endIndex: number) => void;
  onSetIndices?: (indices: number[]) => void;
  onClearSelection?: () => void;
  searchQuery?: string;
  className?: string;
}

export const TranscriptViewer = React.memo(function TranscriptViewer({
  words,
  selectedIndices,
  onWordClick,
  onSelectionChange,
  onToggleRange,
  onSetIndices,
  onClearSelection,
  searchQuery = '',
  className = '',
}: TranscriptViewerProps) {
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Build paragraphs from words
  const paragraphs = useMemo(() => {
    if (!words || words.length === 0) return [];
    const starts = detectParagraphs(words);
    const result: Paragraph[] = [];

    for (let i = 0; i < starts.length; i++) {
      const startIdx = starts[i];
      const endIdx = i + 1 < starts.length ? starts[i + 1] : words.length;
      result.push({
        startIndex: startIdx,
        words: words.slice(startIdx, endIdx),
        timestamp: words[startIdx].start_time,
      });
    }

    return result;
  }, [words]);

  // Selected indices as a Set for O(1) lookup
  const selectedSet = useMemo(() => new Set(selectedIndices), [selectedIndices]);

  // Virtualize paragraphs
  const virtualizer = useVirtualizer({
    count: paragraphs.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Scroll to word index — find which paragraph it belongs to
  const scrollToIndex = useCallback(
    (wordIndex: number) => {
      const pIdx = paragraphs.findIndex(
        (p) => wordIndex >= p.startIndex && wordIndex < p.startIndex + p.words.length
      );
      if (pIdx >= 0) {
        virtualizer.scrollToIndex(pIdx, { align: 'center', behavior: 'smooth' });
      }
    },
    [paragraphs, virtualizer]
  );

  // Keyboard navigation
  useTranscriptKeyboardNav(
    words,
    selectedIndices,
    onSelectionChange,
    onClearSelection,
    scrollToIndex
  );

  // Drag selection state
  const [dragStart, setDragStart] = useState<number | null>(null);
  const isDragging = useRef(false);
  const preDrawIndices = useRef<number[]>([]);
  const dragMode = useRef<'add' | 'remove'>('add');

  // Word click handler with shift-click support
  const handleWordClick = useCallback(
    (index: number, isShiftClick: boolean) => {
      // Ignore clicks that are the end of a drag
      if (isDragging.current) return;

      if (isShiftClick && selectedIndices.length > 0) {
        const lastSelected = selectedIndices[selectedIndices.length - 1];
        const startIndex = Math.min(lastSelected, index);
        const endIndex = Math.max(lastSelected, index);
        onSelectionChange(startIndex, endIndex);
      } else {
        onWordClick(index);
      }
    },
    [selectedIndices, onWordClick, onSelectionChange]
  );

  // Drag selection: mousedown on a word starts potential drag
  // If the starting word is already selected → drag will remove; otherwise → drag will add
  const handleWordMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    if (e.shiftKey) return;
    preDrawIndices.current = selectedIndices;
    dragMode.current = selectedSet.has(index) ? 'remove' : 'add';
    setDragStart(index);
    isDragging.current = false;
  }, [selectedIndices, selectedSet]);

  // Drag selection: mousemove over a word extends selection (additive or subtractive)
  const handleWordMouseEnter = useCallback((index: number) => {
    if (dragStart === null) return;
    if (index !== dragStart) {
      isDragging.current = true;
      const start = Math.min(dragStart, index);
      const end = Math.max(dragStart, index);
      const merged = new Set(preDrawIndices.current);
      for (let i = start; i <= end; i++) {
        if (dragMode.current === 'add') {
          merged.add(i);
        } else {
          merged.delete(i);
        }
      }
      const sorted = Array.from(merged).sort((a, b) => a - b);
      if (onSetIndices) {
        onSetIndices(sorted);
      } else if (sorted.length > 0) {
        onSelectionChange(sorted[0], sorted[sorted.length - 1]);
      }
    }
  }, [dragStart, onSetIndices, onSelectionChange]);

  // Drag selection: mouseup ends drag
  const handleMouseUp = useCallback(() => {
    if (dragStart !== null) {
      // Small delay to prevent the click handler from firing after drag
      setTimeout(() => { isDragging.current = false; }, 0);
      setDragStart(null);
    }
  }, [dragStart]);

  // Click on paragraph timestamp toggles entire paragraph selection
  const handleTimestampClick = useCallback((paragraph: Paragraph) => {
    const startIndex = paragraph.startIndex;
    const endIndex = paragraph.startIndex + paragraph.words.length - 1;
    if (onToggleRange) {
      onToggleRange(startIndex, endIndex);
    } else {
      onSelectionChange(startIndex, endIndex);
    }
  }, [onToggleRange, onSelectionChange]);

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
      className={`h-full overflow-auto select-none ${className}`}
      style={{ contain: 'content' }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const paragraph = paragraphs[virtualItem.index];

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
            >
              <div className="flex gap-6 py-3 px-4">
                {/* Timestamp column - click to select entire paragraph */}
                <button
                  type="button"
                  className="shrink-0 w-24 text-muted-foreground font-mono text-sm pt-1 text-left hover:text-white transition-colors cursor-pointer"
                  onClick={() => handleTimestampClick(paragraph)}
                  title="Sélectionner le paragraphe"
                >
                  {formatTimestamp(paragraph.timestamp)}
                </button>

                {/* Words column */}
                <div className="flex-1 leading-7 text-white">
                  {paragraph.words.map((word) => (
                    <React.Fragment key={word.index}>
                      <TranscriptWord
                        word={word}
                        isSelected={selectedSet.has(word.index)}
                        isHighlighted={isWordHighlighted(word)}
                        onClick={() => handleWordClick(word.index, false)}
                        onShiftClick={() => handleWordClick(word.index, true)}
                        onMouseDown={(e) => handleWordMouseDown(word.index, e)}
                        onMouseEnter={() => handleWordMouseEnter(word.index)}
                      />{' '}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
