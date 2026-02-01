import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TranscriptViewer } from './TranscriptViewer';
import type { TranscriptWord } from '@splice/types';

describe('TranscriptViewer Performance Tests', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect for virtualizer
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  it('should render 10,000 words in less than 200ms', () => {
    const largeWordList: TranscriptWord[] = Array.from({ length: 10000 }, (_, i) => ({
      index: i,
      text: `word${i}`,
      start_time: i * 0.5,
      end_time: (i + 1) * 0.5,
      confidence: 0.95,
    }));

    const startTime = performance.now();

    render(
      <TranscriptViewer
        words={largeWordList}
        selectedIndices={[]}
        onWordClick={() => {}}
        onSelectionChange={() => {}}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Render time for 10,000 words: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(200); // <200ms pour 10k mots
  });

  it('should virtualize and render only visible items', () => {
    const largeWordList: TranscriptWord[] = Array.from({ length: 10000 }, (_, i) => ({
      index: i,
      text: `word${i}`,
      start_time: i * 0.5,
      end_time: (i + 1) * 0.5,
      confidence: 0.95,
    }));

    const { container } = render(
      <TranscriptViewer
        words={largeWordList}
        selectedIndices={[]}
        onWordClick={() => {}}
        onSelectionChange={() => {}}
      />
    );

    // Vérifier qu'il y a beaucoup moins de 10k DOM nodes
    const renderedWords = container.querySelectorAll('[data-index]');
    console.log(`Rendered DOM nodes: ${renderedWords.length} out of 10,000`);

    // Avec virtualization, on devrait avoir <200 nodes rendus
    expect(renderedWords.length).toBeLessThan(200);
  });

  it('should handle 50,000 words without crashing', () => {
    const massiveWordList: TranscriptWord[] = Array.from({ length: 50000 }, (_, i) => ({
      index: i,
      text: `word${i}`,
      start_time: i * 0.5,
      end_time: (i + 1) * 0.5,
      confidence: 0.95,
    }));

    const startTime = performance.now();

    const { container } = render(
      <TranscriptViewer
        words={massiveWordList}
        selectedIndices={[]}
        onWordClick={() => {}}
        onSelectionChange={() => {}}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Render time for 50,000 words: ${renderTime.toFixed(2)}ms`);

    // Should still render reasonably fast
    expect(renderTime).toBeLessThan(500);

    // Should still virtualize
    const renderedWords = container.querySelectorAll('[data-index]');
    expect(renderedWords.length).toBeLessThan(200);
  });

  it('should maintain performance with frequent updates', () => {
    const wordList: TranscriptWord[] = Array.from({ length: 10000 }, (_, i) => ({
      index: i,
      text: `word${i}`,
      start_time: i * 0.5,
      end_time: (i + 1) * 0.5,
      confidence: 0.95,
    }));

    const { rerender } = render(
      <TranscriptViewer
        words={wordList}
        selectedIndices={[]}
        onWordClick={() => {}}
        onSelectionChange={() => {}}
      />
    );

    // Simulate 10 selection updates
    const startTime = performance.now();

    for (let i = 0; i < 10; i++) {
      rerender(
        <TranscriptViewer
          words={wordList}
          selectedIndices={[i * 100, i * 100 + 1, i * 100 + 2]}
          onWordClick={() => {}}
          onSelectionChange={() => {}}
        />
      );
    }

    const endTime = performance.now();
    const updateTime = endTime - startTime;
    const avgUpdateTime = updateTime / 10;

    console.log(`Average update time: ${avgUpdateTime.toFixed(2)}ms`);

    // Each update should be fast (<50ms average)
    expect(avgUpdateTime).toBeLessThan(50);
  });
});
