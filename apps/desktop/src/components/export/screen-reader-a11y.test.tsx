import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { ExportDialog } from './ExportDialog';
import { ExportProgress } from './ExportProgress';
import { useExportStore } from '../../stores/export-store';
import { useVideoStore } from '../../stores/video-store';

expect.extend(matchers);

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({
    estimated_size_bytes: 50_000_000,
    estimated_duration_seconds: 30,
  }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe('ExportDialog — screen reader accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExportStore.setState({
      isExportDialogOpen: true,
      exportSettings: { quality: 'preserve', outputPath: '', fileName: 'test_edited.mp4' },
      estimatedFileSize: 50_000_000,
      estimatedDuration: 30,
      isEstimating: false,
      isExporting: false,
      exportProgress: null,
      exportError: null,
      exportResult: null,
    });
    useVideoStore.setState({
      currentProject: {
        id: 'project-1',
        file_path: '/path/to/test.mp4',
        file_name: 'test.mp4',
        duration_seconds: 120,
        created_at: 0,
        updated_at: 0,
      },
    } as any);
  });

  it('has fieldset/legend for quality radio group', () => {
    render(<ExportDialog />);
    const fieldset = document.querySelector('fieldset');
    expect(fieldset).toBeTruthy();
    const legend = fieldset?.querySelector('legend');
    expect(legend).toBeTruthy();
    expect(legend?.textContent).toContain('Qualité');
  });

  it('radio options have aria-describedby linking to descriptions', () => {
    render(<ExportDialog />);
    const radio = document.querySelector('[aria-describedby="quality-desc-preserve"]');
    expect(radio).toBeTruthy();
    const desc = document.getElementById('quality-desc-preserve');
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toContain('Copie directe');
  });

  it('destination input has aria-label', () => {
    render(<ExportDialog />);
    const input = screen.getByLabelText('Chemin de destination');
    expect(input).toBeTruthy();
    expect(input.getAttribute('readonly')).not.toBeNull();
  });

  it('filename input is linked to label via htmlFor/id', () => {
    render(<ExportDialog />);
    const input = document.getElementById('export-filename');
    expect(input).toBeTruthy();
    expect(input?.tagName.toLowerCase()).toBe('input');
  });

  it('passes axe-core accessibility checks', async () => {
    const { container } = render(<ExportDialog />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('ExportProgress — screen reader accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExportStore.setState({
      isExporting: true,
      exportProgress: {
        percent: 45,
        currentFrame: 1234,
        totalFrames: 2742,
        speed: 2.5,
        fps: 30,
        elapsedSecs: 20,
        eta: 25,
        fileSizeBytes: 50 * 1024 * 1024,
        estimatedTotalBytes: 110 * 1024 * 1024,
      },
      cancelExport: vi.fn(),
    } as any);
  });

  it('progress bar has correct ARIA role and attributes', () => {
    render(<ExportProgress />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeTruthy();
    expect(progressBar.getAttribute('aria-label')).toBe("Progression de l'export");
    expect(progressBar.getAttribute('aria-valuenow')).toBe('45');
    expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('progress bar has sr-only text for screen readers', () => {
    render(<ExportProgress />);
    const srOnly = document.querySelector('.sr-only');
    expect(srOnly).toBeTruthy();
    // SR announces at 10% intervals: 45% rounds down to 40%
    expect(srOnly?.textContent).toContain('40%');
  });
});
