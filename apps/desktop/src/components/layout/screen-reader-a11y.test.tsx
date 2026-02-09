import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { TopBar } from './TopBar';

expect.extend(matchers);

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('../../stores/update-store', () => ({
  useUpdateStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      status: 'idle',
      updateInfo: null,
      installOnQuit: false,
      shouldShowNotification: () => false,
    })
  ),
}));

vi.mock('../../stores/transcription-store', () => ({
  useTranscriptionStore: vi.fn(() => false),
}));

vi.mock('../../stores/export-store', () => ({
  useExportStore: vi.fn(() => false),
}));

vi.mock('../../stores/segmentation-store', () => ({
  useSegmentationStore: vi.fn(() => false),
}));

describe('TopBar — screen reader accessibility', () => {
  it('has header landmark', () => {
    const { container } = render(<TopBar currentScreen="editor" />);
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
  });

  it('has nav landmark with aria-label', () => {
    const { container } = render(<TopBar currentScreen="editor" />);
    const nav = container.querySelector('nav[aria-label="Actions principales"]');
    expect(nav).toBeTruthy();
  });

  it('decorative logo SVG has aria-hidden', () => {
    const { container } = render(<TopBar currentScreen="editor" />);
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeTruthy();
  });

  it('passes axe-core accessibility checks (editor mode)', async () => {
    const { container } = render(<TopBar currentScreen="editor" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core accessibility checks (preview mode)', async () => {
    const { container } = render(
      <TopBar currentScreen="preview" onBackToEditor={vi.fn()} onExport={vi.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
