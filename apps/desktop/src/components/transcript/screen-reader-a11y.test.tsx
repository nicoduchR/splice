import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { TranscriptViewer } from './TranscriptViewer';
import { SelectionStats } from './SelectionStats';
import { useTimelineStore } from '../../stores/timeline-store';
import type { TranscriptWord } from '@splice/types';

expect.extend(matchers);

const mockWords: TranscriptWord[] = Array.from({ length: 10 }, (_, i) => ({
  index: i,
  text: `word${i}`,
  start_time: i * 0.5,
  end_time: (i + 1) * 0.5,
  confidence: 0.95,
}));

describe('TranscriptViewer — screen reader accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('has role="document" with correct aria attributes', () => {
    const { container } = render(
      <TranscriptViewer
        words={mockWords}
        selectedIndices={[]}
        onWordClick={vi.fn()}
        onSelectionChange={vi.fn()}
      />
    );

    const doc = container.querySelector('[role="document"]');
    expect(doc).toBeTruthy();
    expect(doc!.getAttribute('aria-label')).toBe('Transcription vidéo');
  });

  it('transcript container is focusable via tabIndex', () => {
    const { container } = render(
      <TranscriptViewer
        words={mockWords}
        selectedIndices={[]}
        onWordClick={vi.fn()}
        onSelectionChange={vi.fn()}
      />
    );

    const doc = container.querySelector('[role="document"]');
    expect(doc).toBeTruthy();
    expect(doc!.getAttribute('tabindex')).toBe('0');
  });

  it('passes axe-core accessibility checks', async () => {
    const { container } = render(
      <TranscriptViewer
        words={mockWords}
        selectedIndices={[]}
        onWordClick={vi.fn()}
        onSelectionChange={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('SelectionStats — screen reader accessibility', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      segments: [],
      duration: 0,
    });
  });

  it('has aria-live="polite" for dynamic updates', () => {
    useTimelineStore.setState({
      duration: 100,
      segments: [
        { id: 's1', startTime: 0, endTime: 30, selected: true },
      ],
    });
    const { container } = render(<SelectionStats />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
  });

  it('has aria-atomic="true" to announce full content', () => {
    useTimelineStore.setState({
      duration: 100,
      segments: [
        { id: 's1', startTime: 0, endTime: 30, selected: true },
      ],
    });
    const { container } = render(<SelectionStats />);
    const liveRegion = container.querySelector('[aria-atomic="true"]');
    expect(liveRegion).toBeTruthy();
  });

  it('combines aria-live and aria-atomic on the stats element', () => {
    useTimelineStore.setState({
      duration: 100,
      segments: [
        { id: 's1', startTime: 0, endTime: 30, selected: true },
      ],
    });
    const { container } = render(<SelectionStats />);
    const el = container.querySelector('[aria-live="polite"][aria-atomic="true"]');
    expect(el).toBeTruthy();
    expect(el!.textContent).toContain('segment');
    expect(el!.textContent).toContain('réduction');
  });

  it('passes axe-core accessibility checks', async () => {
    useTimelineStore.setState({
      duration: 100,
      segments: [
        { id: 's1', startTime: 0, endTime: 30, selected: true },
      ],
    });
    const { container } = render(<SelectionStats />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
