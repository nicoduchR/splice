import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { TimelineBar } from './TimelineBar';
import { useTimelineStore } from '../../stores/timeline-store';
import { useTranscriptStore } from '../../stores/transcript-store';

expect.extend(matchers);

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('TimelineBar — screen reader accessibility', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      segments: [],
      duration: 0,
      currentTime: 0,
      isPlaying: false,
    });
    useTranscriptStore.setState({
      transcript: null,
      selections: [],
      selectedWordIndices: [],
      currentProjectId: null,
    });
  });

  it('has role="region" for landmark navigation', () => {
    useTimelineStore.setState({ duration: 10 });
    const { getByTestId } = render(<TimelineBar />);
    const bar = getByTestId('timeline-bar');
    expect(bar.getAttribute('role')).toBe('region');
  });

  it('has aria-label="Timeline" for screen reader identification', () => {
    useTimelineStore.setState({ duration: 10 });
    const { getByTestId } = render(<TimelineBar />);
    const bar = getByTestId('timeline-bar');
    expect(bar.getAttribute('aria-label')).toBe('Timeline');
  });

  it('has aria-roledescription="timeline vidéo" for enhanced context', () => {
    useTimelineStore.setState({ duration: 10 });
    const { getByTestId } = render(<TimelineBar />);
    const bar = getByTestId('timeline-bar');
    expect(bar.getAttribute('aria-roledescription')).toBe('timeline vidéo');
  });

  it('timeline is keyboard focusable', () => {
    useTimelineStore.setState({ duration: 10 });
    const { getByTestId } = render(<TimelineBar />);
    const bar = getByTestId('timeline-bar');
    expect(bar.getAttribute('tabindex')).toBe('0');
  });

  it('segments have descriptive aria-labels with timecodes', () => {
    useTimelineStore.setState({
      duration: 10,
      segments: [
        { id: 's1', startTime: 2, endTime: 4, selected: true },
      ],
    });
    useTranscriptStore.setState({
      selections: [
        { id: 's1', projectId: 'p', startWordIndex: 4, endWordIndex: 7, startTime: 2, endTime: 4, createdAt: 1 },
      ],
    });

    const { getByTestId } = render(<TimelineBar />);
    const segment = getByTestId('timeline-segment');
    const label = segment.getAttribute('aria-label');
    expect(label).toMatch(/Segment/);
    expect(label).toMatch(/00:02/);
    expect(label).toMatch(/00:04/);
  });

  it('segments are rendered as buttons for keyboard access', () => {
    useTimelineStore.setState({
      duration: 10,
      segments: [
        { id: 's1', startTime: 2, endTime: 4, selected: true },
      ],
    });
    useTranscriptStore.setState({
      selections: [
        { id: 's1', projectId: 'p', startWordIndex: 4, endWordIndex: 7, startTime: 2, endTime: 4, createdAt: 1 },
      ],
    });

    const { getByTestId } = render(<TimelineBar />);
    const segment = getByTestId('timeline-segment');
    expect(segment.tagName.toLowerCase()).toBe('button');
    expect(segment.getAttribute('type')).toBe('button');
  });

  it('has focus-visible ring styles for keyboard navigation', () => {
    useTimelineStore.setState({ duration: 10 });
    const { getByTestId } = render(<TimelineBar />);
    const bar = getByTestId('timeline-bar');
    expect(bar.className).toContain('focus-visible:ring-2');
  });

  it('passes axe-core accessibility checks (empty state)', async () => {
    useTimelineStore.setState({ duration: 10 });
    const { container } = render(<TimelineBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core accessibility checks (with segments)', async () => {
    useTimelineStore.setState({
      duration: 10,
      segments: [
        { id: 's1', startTime: 2, endTime: 4, selected: true },
        { id: 's2', startTime: 7, endTime: 9, selected: true },
      ],
    });
    useTranscriptStore.setState({
      selections: [
        { id: 's1', projectId: 'p', startWordIndex: 4, endWordIndex: 7, startTime: 2, endTime: 4, createdAt: 1 },
        { id: 's2', projectId: 'p', startWordIndex: 14, endWordIndex: 17, startTime: 7, endTime: 9, createdAt: 2 },
      ],
    });

    const { container } = render(<TimelineBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
