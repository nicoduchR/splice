import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TranscriptWord } from './TranscriptWord';
import type { TranscriptWord as TWord } from '@splice/types/generated';

describe('TranscriptWord', () => {
  const mockWord: TWord = {
    index: 0,
    text: 'Hello',
    start_time: 0.5,
    end_time: 1.0,
    confidence: 0.95,
  };

  it('should render word with text', () => {
    render(
      <TranscriptWord
        word={mockWord}
        isSelected={false}
        isHighlighted={false}
        showTimestamp={false}
        onClick={vi.fn()}
        onShiftClick={vi.fn()}
      />
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should apply selected state style', () => {
    render(
      <TranscriptWord
        word={mockWord}
        isSelected={true}
        isHighlighted={false}
        showTimestamp={false}
        onClick={vi.fn()}
        onShiftClick={vi.fn()}
      />
    );

    const wordElement = screen.getByText('Hello');
    expect(wordElement).toHaveClass('bg-primary/20');
    expect(wordElement).toHaveClass('text-white');
  });

  it('should apply highlighted state style for search', () => {
    render(
      <TranscriptWord
        word={mockWord}
        isSelected={false}
        isHighlighted={true}
        showTimestamp={false}
        onClick={vi.fn()}
        onShiftClick={vi.fn()}
      />
    );

    const wordElement = screen.getByText('Hello');
    expect(wordElement).toHaveClass('bg-yellow-500/30');
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <TranscriptWord
        word={mockWord}
        isSelected={false}
        isHighlighted={false}
        showTimestamp={false}
        onClick={handleClick}
        onShiftClick={vi.fn()}
      />
    );

    const wordElement = screen.getByText('Hello');
    fireEvent.click(wordElement);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should call onShiftClick when shift+clicked', () => {
    const handleShiftClick = vi.fn();
    render(
      <TranscriptWord
        word={mockWord}
        isSelected={false}
        isHighlighted={false}
        showTimestamp={false}
        onClick={vi.fn()}
        onShiftClick={handleShiftClick}
      />
    );

    const wordElement = screen.getByText('Hello');
    fireEvent.click(wordElement, { shiftKey: true });

    expect(handleShiftClick).toHaveBeenCalledTimes(1);
  });

  it('should show timestamp when showTimestamp is true', () => {
    render(
      <TranscriptWord
        word={mockWord}
        isSelected={false}
        isHighlighted={false}
        showTimestamp={true}
        onClick={vi.fn()}
        onShiftClick={vi.fn()}
      />
    );

    expect(screen.getByText('00:00.500')).toBeInTheDocument();
  });

  it('should hide timestamp when showTimestamp is false', () => {
    render(
      <TranscriptWord
        word={mockWord}
        isSelected={false}
        isHighlighted={false}
        showTimestamp={false}
        onClick={vi.fn()}
        onShiftClick={vi.fn()}
      />
    );

    expect(screen.queryByText('00:00.500')).not.toBeInTheDocument();
  });
});
