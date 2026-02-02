import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { SelectionStats } from './SelectionStats';
import { useTimelineStore } from '../../stores/timeline-store';

describe('SelectionStats', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      segments: [],
      duration: 0,
    });
  });

  it('should show empty state when no selections', () => {
    useTimelineStore.setState({ duration: 100, segments: [] });
    const { getByText } = render(<SelectionStats />);
    expect(getByText('Aucune sélection')).toBeTruthy();
  });

  it('should show correct stats for 1 segment', () => {
    useTimelineStore.setState({
      duration: 2730, // 45:30
      segments: [
        { id: 's1', startTime: 0, endTime: 765, selected: true }, // 12:45
      ],
    });
    const { getByText } = render(<SelectionStats />);
    expect(getByText(/1 segment/)).toBeTruthy();
    expect(getByText(/12:45/)).toBeTruthy();
    expect(getByText(/45:30/)).toBeTruthy();
    expect(getByText(/72%/)).toBeTruthy(); // (2730-765)/2730 ≈ 72%
  });

  it('should show green color for >50% reduction', () => {
    useTimelineStore.setState({
      duration: 100,
      segments: [
        { id: 's1', startTime: 0, endTime: 30, selected: true }, // 70% reduction
      ],
    });
    const { container } = render(<SelectionStats />);
    const reductionEl = container.querySelector('.text-emerald-400');
    expect(reductionEl).toBeTruthy();
  });

  it('should show yellow color for 20-50% reduction', () => {
    useTimelineStore.setState({
      duration: 100,
      segments: [
        { id: 's1', startTime: 0, endTime: 65, selected: true }, // 35% reduction
      ],
    });
    const { container } = render(<SelectionStats />);
    const reductionEl = container.querySelector('.text-yellow-400');
    expect(reductionEl).toBeTruthy();
  });

  it('should show grey color for <20% reduction', () => {
    useTimelineStore.setState({
      duration: 100,
      segments: [
        { id: 's1', startTime: 0, endTime: 90, selected: true }, // 10% reduction
      ],
    });
    const { container } = render(<SelectionStats />);
    const reductionEl = container.querySelector('.text-muted-foreground');
    expect(reductionEl).toBeTruthy();
  });

  it('should update when segments change', () => {
    useTimelineStore.setState({
      duration: 100,
      segments: [{ id: 's1', startTime: 0, endTime: 30, selected: true }],
    });
    const { getByText } = render(<SelectionStats />);
    expect(getByText(/1 segment/)).toBeTruthy();

    // Add second segment
    act(() => {
      useTimelineStore.setState({
        segments: [
          { id: 's1', startTime: 0, endTime: 30, selected: true },
          { id: 's2', startTime: 50, endTime: 60, selected: true },
        ],
      });
    });
    expect(getByText(/2 segments/)).toBeTruthy();
  });

  it('should format duration correctly with formatTimecode', () => {
    useTimelineStore.setState({
      duration: 3700, // > 1h → HH:MM:SS
      segments: [
        { id: 's1', startTime: 0, endTime: 3600, selected: true }, // 1:00:00
      ],
    });
    const { getByText } = render(<SelectionStats />);
    expect(getByText(/01:00:00/)).toBeTruthy();
    expect(getByText(/01:01:40/)).toBeTruthy(); // 3700 seconds
  });

  it('should show 0% reduction when duration is 0', () => {
    useTimelineStore.setState({
      duration: 0,
      segments: [
        { id: 's1', startTime: 0, endTime: 30, selected: true },
      ],
    });
    const { getByText } = render(<SelectionStats />);
    expect(getByText(/0% réduction/)).toBeTruthy();
  });

  it('should show estimated final duration', () => {
    useTimelineStore.setState({
      duration: 2730,
      segments: [
        { id: 's1', startTime: 0, endTime: 765, selected: true },
      ],
    });
    const { getByText } = render(<SelectionStats />);
    expect(getByText(/final 12:45/)).toBeTruthy();
  });
});
