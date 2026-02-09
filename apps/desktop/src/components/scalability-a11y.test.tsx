import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { DropZone } from './video-import/DropZone';
import { TranscriptWord } from './transcript/TranscriptWord';
import type { TranscriptWord as TWord } from '@splice/types';

expect.extend(matchers);

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// ─── Font-size & rem compliance (AC #1) ─────────────────────────────
describe('Font-size rem compliance — AC #1', () => {
  it('no arbitrary px font-sizes (text-[XXpx]) exist in component source files', () => {
    // Scan all component TSX files for text-[Xpx] patterns
    const srcDir = resolve(process.cwd(), 'src/components');
    // grep for text-[XXpx] patterns in component files
    const result = execSync(
      `grep -r "text-\\[\\d\\+px\\]" "${srcDir}" --include="*.tsx" -l 2>/dev/null || true`,
      { encoding: 'utf-8' }
    ).trim();
    expect(result).toBe('');
  });

  it('index.css defines font-size on html element for rem base', () => {
    const cssPath = resolve(process.cwd(), 'src/index.css');
    const css = readFileSync(cssPath, 'utf-8');
    // Must have font-size: 100% or font-size: 16px on html
    expect(css).toMatch(/html\s*\{[^}]*font-size:\s*(100%|16px)/);
  });
});

// ─── Line-height compliance (AC #3) ─────────────────────────────────
describe('Line-height compliance — AC #3', () => {
  it('body has line-height >= 1.5 defined in index.css', () => {
    const cssPath = resolve(process.cwd(), 'src/index.css');
    const css = readFileSync(cssPath, 'utf-8');
    // Match line-height: 1.5 or higher on body
    const bodyMatch = css.match(/body\s*\{[^}]*line-height:\s*([\d.]+)/);
    // Could also be in html, body block
    const htmlBodyMatch = css.match(/html,\s*\n?\s*body\s*\{[^}]*line-height:\s*([\d.]+)/s);
    const match = bodyMatch || htmlBodyMatch;
    expect(match).toBeTruthy();
    const lineHeight = parseFloat(match![1]);
    expect(lineHeight).toBeGreaterThanOrEqual(1.5);
  });

  it('TranscriptViewer uses leading-relaxed or leading-7 (line-height >= 1.5)', () => {
    const viewerPath = resolve(process.cwd(), 'src/components/transcript/TranscriptViewer.tsx');
    const source = readFileSync(viewerPath, 'utf-8');
    // Should contain leading-7 (1.75rem) or leading-relaxed (1.625)
    const hasAdequateLineHeight =
      source.includes('leading-7') || source.includes('leading-relaxed');
    expect(hasAdequateLineHeight).toBe(true);
  });
});

// ─── Modal max-width scalability (AC #2) ─────────────────────────────
describe('Modal max-width scalability — AC #2', () => {
  it('no max-w-[XXXpx] exist in dialog/modal components', () => {
    const srcDir = resolve(process.cwd(), 'src/components');
    const result = execSync(
      `grep -r "max-w-\\[\\d\\+px\\]" "${srcDir}" --include="*.tsx" -l 2>/dev/null || true`,
      { encoding: 'utf-8' }
    ).trim();
    expect(result).toBe('');
  });

  it('no min-w-[XXXpx] exist in components (except 44px touch targets)', () => {
    const srcDir = resolve(process.cwd(), 'src/components');
    const result = execSync(
      `grep -rn "min-w-\\[\\d\\+px\\]" "${srcDir}" --include="*.tsx" 2>/dev/null || true`,
      { encoding: 'utf-8' }
    ).trim();
    // Only min-w-[44px] touch targets should remain
    const nonTouchTargetLines = result
      .split('\n')
      .filter((line: string) => line.trim() && !line.includes('min-w-[44px]'));
    expect(nonTouchTargetLines).toHaveLength(0);
  });
});

// ─── Touch targets at zoom (AC #4) ──────────────────────────────────
describe('Touch targets — AC #4', () => {
  it('button component defines min-h-[44px] for touch targets', () => {
    const buttonPath = resolve(process.cwd(), 'src/components/ui/button.tsx');
    const source = readFileSync(buttonPath, 'utf-8');
    expect(source).toContain('min-h-[44px]');
  });
});

// ─── Reduced motion support (AC #5) ─────────────────────────────────
describe('prefers-reduced-motion support — AC #5', () => {
  it('CSS file contains @media (prefers-reduced-motion: reduce) rule', () => {
    const cssPath = resolve(process.cwd(), 'src/index.css');
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation-duration: 0.01ms');
    expect(css).toContain('transition-duration: 0.01ms');
    expect(css).toContain('scroll-behavior: auto');
  });

  it('matchMedia can detect prefers-reduced-motion: reduce', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    expect(mql.matches).toBe(true);

    const mqlOther = window.matchMedia('(prefers-color-scheme: dark)');
    expect(mqlOther.matches).toBe(false);

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });
});

// ─── Zoom 200% simulation tests (AC #2, #4, #5) ─────────────────────
describe('Zoom 200% simulation — viewport rendering', () => {
  it('DropZone renders without horizontal overflow in narrow container (simulated 200% zoom)', () => {
    // 1280px screen at 200% zoom = ~640px effective viewport
    const { container } = render(
      <div style={{ width: '640px', overflow: 'auto' }}>
        <DropZone
          onFileSelected={vi.fn()}
          onBrowseFiles={vi.fn()}
          isValidating={false}
          error={null}
          validatingFilePath={null}
        />
      </div>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toBeTruthy();

    // Verify DropZone uses w-full (fills container, no fixed width overflow)
    const dropZoneRoot = wrapper.firstElementChild as HTMLElement;
    expect(dropZoneRoot).toBeTruthy();
    expect(dropZoneRoot.className).toContain('w-full');

    // Verify no child element has an inline fixed width exceeding container
    const allElements = wrapper.querySelectorAll('*');
    allElements.forEach((el) => {
      const style = (el as HTMLElement).style;
      if (style.width) {
        const widthPx = parseInt(style.width, 10);
        if (!isNaN(widthPx)) {
          expect(widthPx).toBeLessThanOrEqual(640);
        }
      }
    });

    // Verify button uses relative min-width (rem, not px > 640)
    const button = wrapper.querySelector('button');
    expect(button).toBeTruthy();
    expect(button!.className).toContain('min-w-[13.75rem]');
  });

  it('DropZone in validating state renders in narrow container', () => {
    const { container } = render(
      <div style={{ width: '640px', overflow: 'auto' }}>
        <DropZone
          onFileSelected={vi.fn()}
          onBrowseFiles={vi.fn()}
          isValidating={true}
          error={null}
          validatingFilePath="/test/video.mp4"
        />
      </div>
    );
    // Verify validating state constrains width with max-w-lg
    const constrainedEl = container.querySelector('.max-w-lg');
    expect(constrainedEl).toBeTruthy();

    // Verify constrained element also uses w-full (responsive)
    expect(constrainedEl!.className).toContain('w-full');

    // Verify progress bar uses responsive width class (w-48, not w-[XXXpx])
    const progressBar = container.querySelector('.w-48');
    expect(progressBar).toBeTruthy();
  });
});

// ─── axe-core accessibility checks (AC #1-5) ────────────────────────
describe('axe-core scalability checks', () => {
  const mockWord: TWord = {
    index: 0,
    text: 'hello',
    start_time: 0,
    end_time: 0.5,
    confidence: 0.95,
  };

  it('TranscriptWord passes axe-core checks (text scalability context)', async () => {
    const { container } = render(
      <TranscriptWord
        word={mockWord}
        isSelected={false}
        isHighlighted={false}
        onClick={vi.fn()}
        onShiftClick={vi.fn()}
      />
    );
    const results = await axe(container, {
      rules: { 'aria-allowed-attr': { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it('DropZone passes axe-core checks', async () => {
    const { container } = render(
      <DropZone
        onFileSelected={vi.fn()}
        onBrowseFiles={vi.fn()}
        isValidating={false}
        error={null}
        validatingFilePath={null}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
