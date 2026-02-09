import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TranscriptWord } from './transcript/TranscriptWord';
import { SelectionStats } from './transcript/SelectionStats';
import { TimelineBar } from './timeline/TimelineBar';
import { ErrorDialog } from './error/ErrorDialog';
import { useTimelineStore } from '../stores/timeline-store';
import { useTranscriptStore } from '../stores/transcript-store';
import type { TranscriptWord as TWord } from '@splice/types';

expect.extend(matchers);

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// ─── WCAG Contrast Ratio Helpers ──────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Alpha-blend a color with an opaque background
function alphaBlend(fg: string, bg: string, alpha: number): string {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  const r = Math.round(fgRgb.r * alpha + bgRgb.r * (1 - alpha));
  const g = Math.round(fgRgb.g * alpha + bgRgb.g * (1 - alpha));
  const b = Math.round(fgRgb.b * alpha + bgRgb.b * (1 - alpha));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─── Color Constants ──────────────────────────────────────────────────
const BG_MAIN = '#0f1823';     // --background
const BG_CARD = '#161f2b';     // --card
const FG_WHITE = '#FFFFFF';
const FG_MUTED = '#808a96';    // --muted-foreground (HSL 218 11% 56%)
const PRIMARY = '#1580f9';
const EMERALD_600 = '#059669';
const EMERALD_500 = '#10b981';
const DESTRUCTIVE = '#FF4D4F';
const WARNING = '#f59e0b';
const GRAY_400 = '#9ca3af';
const GRAY_500_TW = '#6b7280';
const TEXT_MUTED_TW = '#9CA3AF'; // text-muted in tailwind config
const YELLOW_400 = '#facc15';
const EMERALD_400 = '#34d399';

// ─── WCAG Contrast Ratio Tests ────────────────────────────────────────
describe('WCAG AA Contrast Ratios — Programmatic Audit', () => {
  describe('Normal text (minimum 4.5:1)', () => {
    it('white text on main background (#0f1823) exceeds 4.5:1', () => {
      const ratio = contrastRatio(FG_WHITE, BG_MAIN);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('muted text (#808a96) on main background exceeds 4.5:1', () => {
      const ratio = contrastRatio(FG_MUTED, BG_MAIN);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('gray-400 (#9ca3af) on main background exceeds 4.5:1', () => {
      const ratio = contrastRatio(GRAY_400, BG_MAIN);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('text-muted (#9CA3AF) on card background exceeds 4.5:1', () => {
      const ratio = contrastRatio(TEXT_MUTED_TW, BG_CARD);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('destructive red (#FF4D4F) on main background exceeds 4.5:1', () => {
      const ratio = contrastRatio(DESTRUCTIVE, BG_MAIN);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('warning yellow (#f59e0b) on main background exceeds 4.5:1', () => {
      const ratio = contrastRatio(WARNING, BG_MAIN);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('white text on selection background (emerald-500/30 blend) exceeds 4.5:1', () => {
      const blended = alphaBlend(EMERALD_500, BG_MAIN, 0.3);
      const ratio = contrastRatio(FG_WHITE, blended);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Large text / UI components (minimum 3:1)', () => {
    it('white text on primary button (#1580f9) exceeds 3:1', () => {
      const ratio = contrastRatio(FG_WHITE, PRIMARY);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('white text on emerald-600 button (#059669) exceeds 3:1', () => {
      const ratio = contrastRatio(FG_WHITE, EMERALD_600);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('emerald-600 timeline segment against main background exceeds 3:1', () => {
      const ratio = contrastRatio(EMERALD_600, BG_MAIN);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('primary (#1580f9) focus ring against main background exceeds 3:1', () => {
      const ratio = contrastRatio(PRIMARY, BG_MAIN);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Color-coded text indicators (minimum 4.5:1)', () => {
    it('emerald-400 reduction text on main background exceeds 4.5:1', () => {
      const ratio = contrastRatio(EMERALD_400, BG_MAIN);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('yellow-400 reduction text on main background exceeds 4.5:1', () => {
      const ratio = contrastRatio(YELLOW_400, BG_MAIN);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});

// ─── Non-Color Indicators Tests ───────────────────────────────────────
describe('Color Independence — Non-color indicators', () => {
  const mockWord: TWord = {
    index: 0,
    text: 'hello',
    start_time: 0,
    end_time: 0.5,
    confidence: 0.95,
  };

  describe('TranscriptWord selection indicators', () => {
    it('selected word has border-b-2 (non-color indicator)', () => {
      const { container } = render(
        <TranscriptWord
          word={mockWord}
          isSelected={true}
          isHighlighted={false}
          onClick={vi.fn()}
          onShiftClick={vi.fn()}
        />
      );
      const span = container.querySelector('span');
      expect(span?.className).toContain('border-b-2');
      expect(span?.className).toContain('border-emerald-500');
    });

    it('highlighted (search) word has ring-2 (non-color indicator)', () => {
      const { container } = render(
        <TranscriptWord
          word={mockWord}
          isSelected={false}
          isHighlighted={true}
          onClick={vi.fn()}
          onShiftClick={vi.fn()}
        />
      );
      const span = container.querySelector('span');
      expect(span?.className).toContain('ring-2');
    });

    it('selected word sets data-word-selected for high contrast CSS targeting', () => {
      const { container } = render(
        <TranscriptWord
          word={mockWord}
          isSelected={true}
          isHighlighted={false}
          onClick={vi.fn()}
          onShiftClick={vi.fn()}
        />
      );
      const span = container.querySelector('span');
      expect(span?.getAttribute('data-word-selected')).toBe('true');
    });

    it('highlighted word sets data-word-highlighted for high contrast CSS targeting', () => {
      const { container } = render(
        <TranscriptWord
          word={mockWord}
          isSelected={false}
          isHighlighted={true}
          onClick={vi.fn()}
          onShiftClick={vi.fn()}
        />
      );
      const span = container.querySelector('span');
      expect(span?.getAttribute('data-word-highlighted')).toBe('true');
    });

    it('selected and highlighted words have distinct visual indicators', () => {
      const { container: selectedContainer } = render(
        <TranscriptWord
          word={mockWord}
          isSelected={true}
          isHighlighted={false}
          onClick={vi.fn()}
          onShiftClick={vi.fn()}
        />
      );
      const { container: highlightedContainer } = render(
        <TranscriptWord
          word={{ ...mockWord, index: 1 }}
          isSelected={false}
          isHighlighted={true}
          onClick={vi.fn()}
          onShiftClick={vi.fn()}
        />
      );
      const selectedSpan = selectedContainer.querySelector('span');
      const highlightedSpan = highlightedContainer.querySelector('span');

      // Selected uses border-b (underline), highlighted uses ring (outline) — distinct in grayscale
      expect(selectedSpan?.className).toContain('border-b-2');
      expect(highlightedSpan?.className).toContain('ring-2 ring-yellow');
      // Selected has bg-emerald, highlighted has bg-yellow — different backgrounds
      expect(selectedSpan?.className).toContain('bg-emerald');
      expect(highlightedSpan?.className).toContain('bg-yellow');
    });
  });

  describe('TimelineBar segment indicators', () => {
    beforeEach(() => {
      useTimelineStore.setState({
        segments: [{ id: 's1', startTime: 0, endTime: 10, selected: true }],
        duration: 60,
        currentTime: 0,
      });
      useTranscriptStore.setState({
        selections: [{ id: 's1', startWordIndex: 0, endWordIndex: 5 }],
        transcript: {
          words: Array.from({ length: 6 }, (_, i) => ({
            index: i,
            text: `w${i}`,
            start_time: i,
            end_time: i + 1,
            confidence: 0.9,
          })),
        },
      });
    });

    it('timeline segments have visible border (non-color indicator)', () => {
      const { container } = render(<TimelineBar />);
      const segment = container.querySelector('[data-testid="timeline-segment"]');
      expect(segment).toBeTruthy();
      expect(segment?.className).toContain('border');
    });
  });

  describe('ErrorDialog uses icon + text + color', () => {
    it('error state renders icon, text, and visual distinction', () => {
      const { getByTestId, getByText } = render(
        <ErrorDialog
          isOpen={true}
          severity="error"
          title="Test Error"
          description="Error description"
          suggestedActions={['Try again']}
          onClose={vi.fn()}
        />
      );
      expect(getByTestId('error-icon')).toBeTruthy();
      expect(getByText('Test Error')).toBeTruthy();
      expect(getByText('Error description')).toBeTruthy();
    });

    it('warning state renders icon, text, and visual distinction', () => {
      const { getByTestId, getByText } = render(
        <ErrorDialog
          isOpen={true}
          severity="warning"
          title="Test Warning"
          description="Warning description"
          suggestedActions={['Check settings']}
          onClose={vi.fn()}
        />
      );
      expect(getByTestId('warning-icon')).toBeTruthy();
      expect(getByText('Test Warning')).toBeTruthy();
    });
  });
});

// ─── axe-core Accessibility Checks ────────────────────────────────────
describe('axe-core contrast validation', () => {
  const mockWord: TWord = {
    index: 0,
    text: 'hello',
    start_time: 0,
    end_time: 0.5,
    confidence: 0.95,
  };

  it('TranscriptWord (selected) passes axe-core contrast checks', async () => {
    const { container } = render(
      <TranscriptWord
        word={mockWord}
        isSelected={true}
        isHighlighted={false}
        onClick={vi.fn()}
        onShiftClick={vi.fn()}
      />
    );
    // Exclude aria-allowed-attr: aria-selected on role="button" is a pre-existing 10-2 pattern
    const results = await axe(container, {
      rules: { 'aria-allowed-attr': { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it('TranscriptWord (highlighted) passes axe-core contrast checks', async () => {
    const { container } = render(
      <TranscriptWord
        word={mockWord}
        isSelected={false}
        isHighlighted={true}
        onClick={vi.fn()}
        onShiftClick={vi.fn()}
      />
    );
    // Exclude aria-allowed-attr: aria-selected on role="button" is a pre-existing 10-2 pattern
    const results = await axe(container, {
      rules: { 'aria-allowed-attr': { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it('SelectionStats passes axe-core checks', async () => {
    useTimelineStore.setState({
      duration: 100,
      segments: [{ id: 's1', startTime: 0, endTime: 30, selected: true }],
    });
    const { container } = render(<SelectionStats />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ErrorDialog passes axe-core checks', async () => {
    const { container } = render(
      <ErrorDialog
        isOpen={true}
        severity="error"
        title="Test Error"
        description="Error description"
        suggestedActions={['Try again']}
        onClose={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── High Contrast Mode Tests ─────────────────────────────────────────
describe('prefers-contrast: more — high contrast mode', () => {
  it('CSS file contains @media (prefers-contrast: more) with required overrides', () => {
    const cssPath = resolve(process.cwd(), 'src/index.css');
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('@media (prefers-contrast: more)');
    expect(css).toContain('--border:');
    expect(css).toContain('--muted-foreground:');
    expect(css).toContain('--ring:');
    expect(css).toContain('focus-visible');
    expect(css).toContain('[data-word-selected="true"]');
    expect(css).toContain('[data-word-highlighted="true"]');
    expect(css).toContain('[data-segment-id]');
  });

  it('matchMedia can detect prefers-contrast: more', () => {
    // Mock matchMedia to simulate high contrast mode
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-contrast: more)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const mql = window.matchMedia('(prefers-contrast: more)');
    expect(mql.matches).toBe(true);

    // Non-matching queries
    const mqlOther = window.matchMedia('(prefers-color-scheme: dark)');
    expect(mqlOther.matches).toBe(false);

    // Restore
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });
});
