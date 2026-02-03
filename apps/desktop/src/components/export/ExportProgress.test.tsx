import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportProgress } from './ExportProgress';
import { useExportStore, type ExportProgressInfo } from '../../stores/export-store';

// Mock the store
vi.mock('../../stores/export-store', () => ({
  useExportStore: vi.fn(),
}));

const mockUseExportStore = vi.mocked(useExportStore);

describe('ExportProgress', () => {
  const defaultProgress: ExportProgressInfo = {
    percent: 45,
    currentFrame: 1234,
    totalFrames: 2742,
    speed: 2.5,
    fps: 30,
    elapsedSecs: 20,
    eta: 25,
    fileSizeBytes: 50 * 1024 * 1024,
    estimatedTotalBytes: 110 * 1024 * 1024,
  };

  const mockCancelExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseExportStore.mockImplementation((selector) => {
      const state = {
        isExporting: true,
        exportProgress: defaultProgress,
        cancelExport: mockCancelExport,
      };
      return selector(state as any);
    });
  });

  it('renders nothing when not exporting', () => {
    mockUseExportStore.mockImplementation((selector) =>
      selector({ isExporting: false, exportProgress: null, cancelExport: mockCancelExport } as any)
    );
    const { container } = render(<ExportProgress />);
    expect(container.firstChild).toBeNull();
  });

  it('renders progress bar with correct percentage', () => {
    render(<ExportProgress />);
    expect(screen.getByText('Export en cours...')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('displays correct progress bar width', () => {
    render(<ExportProgress />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '45');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('displays frame count when available', () => {
    render(<ExportProgress />);
    // Find the Frames label and verify its container has the frame count
    const framesLabel = screen.getByText('Frames :');
    expect(framesLabel).toBeInTheDocument();
    // The frame count (1234) should be in the same container
    // toLocaleString uses various separators: comma, dot, narrow no-break space, etc.
    expect(framesLabel.parentElement?.textContent).toMatch(/1[\s\u202f,.]?234/);
  });

  it('displays total frames when available', () => {
    render(<ExportProgress />);
    const framesLabel = screen.getByText('Frames :');
    // With totalFrames, should show "currentFrame / totalFrames"
    expect(framesLabel.parentElement?.textContent).toMatch(/2[\s\u202f,.]?742/);
  });

  it('displays encoding speed', () => {
    render(<ExportProgress />);
    expect(screen.getByText('2.5x realtime')).toBeInTheDocument();
  });

  it('displays fps when available', () => {
    render(<ExportProgress />);
    expect(screen.getByText('FPS :')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('displays elapsed time', () => {
    render(<ExportProgress />);
    expect(screen.getByText(/20s/)).toBeInTheDocument();
  });

  it('displays ETA when available', () => {
    render(<ExportProgress />);
    expect(screen.getByText(/25s/)).toBeInTheDocument();
  });

  it('displays file size and estimated total', () => {
    render(<ExportProgress />);
    expect(screen.getByText(/50 MB/)).toBeInTheDocument();
    expect(screen.getByText(/~110 MB/)).toBeInTheDocument();
  });

  it('shows cancel button', () => {
    render(<ExportProgress />);
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('opens confirmation dialog when cancel is clicked', async () => {
    render(<ExportProgress />);
    fireEvent.click(screen.getByRole('button', { name: /annuler l'export/i }));
    await waitFor(() => {
      expect(screen.getByText(/L'export en cours sera interrompu/)).toBeInTheDocument();
    });
  });

  it('calls cancelExport when confirmed', async () => {
    render(<ExportProgress />);
    fireEvent.click(screen.getByRole('button', { name: /annuler l'export/i }));
    await waitFor(() => {
      expect(screen.getByText(/L'export en cours sera interrompu/)).toBeInTheDocument();
    });
    // Click the confirm button in the dialog
    const confirmButton = screen.getByRole('button', { name: 'Annuler l\'export' });
    fireEvent.click(confirmButton);
    await waitFor(() => {
      expect(mockCancelExport).toHaveBeenCalledTimes(1);
    });
  });

  it('has correct ARIA attributes on progress bar', () => {
    render(<ExportProgress />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Progression de l\'export');
    expect(progressBar).toHaveAttribute('aria-valuenow', '45');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('updates progress display when percent changes', () => {
    const { rerender } = render(<ExportProgress />);
    expect(screen.getByText('45%')).toBeInTheDocument();

    // Update progress
    mockUseExportStore.mockImplementation((selector) =>
      selector({
        isExporting: true,
        exportProgress: { ...defaultProgress, percent: 75 },
        cancelExport: mockCancelExport,
      } as any)
    );

    rerender(<ExportProgress />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles progress without optional fields', () => {
    mockUseExportStore.mockImplementation((selector) =>
      selector({
        isExporting: true,
        exportProgress: { percent: 30 },
        cancelExport: mockCancelExport,
      } as any)
    );

    render(<ExportProgress />);
    expect(screen.getByText('30%')).toBeInTheDocument();
    // Should not crash when optional fields are missing
    expect(screen.queryByText(/realtime/)).not.toBeInTheDocument();
  });
});
