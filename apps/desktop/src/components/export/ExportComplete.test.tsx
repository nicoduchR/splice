import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportComplete } from './ExportComplete';
import { useExportStore, type ExportResult } from '../../stores/export-store';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock format-utils with controllable OS detection
vi.mock('../../lib/format-utils', async () => {
  const actual = await vi.importActual<typeof import('../../lib/format-utils')>('../../lib/format-utils');
  return {
    ...actual,
    getFileBrowserName: vi.fn(() => 'Finder'),
  };
});

import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { getFileBrowserName } from '../../lib/format-utils';
const mockInvoke = vi.mocked(invoke);
const mockGetFileBrowserName = vi.mocked(getFileBrowserName);

describe('ExportComplete', () => {
  const mockResult: ExportResult = {
    outputPath: '/Users/test/Videos/my_video_edited.mp4',
    fileSizeBytes: 385 * 1024 * 1024, // 385 MB
    durationSeconds: 12 * 60 + 45, // 12:45
  };

  const mockOnExportAnother = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useExportStore.setState({
      exportResult: mockResult,
    });
  });

  it('renders success header with correct title', () => {
    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Export terminé avec succès!')).toBeInTheDocument();
  });

  it('displays formatted file size', () => {
    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('385 MB')).toBeInTheDocument();
  });

  it('displays formatted duration (MM:SS)', () => {
    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('12:45')).toBeInTheDocument();
  });

  it('displays formatted duration (HH:MM:SS) for longer videos', () => {
    const longResult: ExportResult = {
      ...mockResult,
      durationSeconds: 2 * 3600 + 15 * 60 + 30, // 2:15:30
    };

    render(
      <ExportComplete
        result={longResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('2:15:30')).toBeInTheDocument();
  });

  it('displays full output path', () => {
    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(mockResult.outputPath)).toBeInTheDocument();
  });

  it('calls invoke("open_file") when "Ouvrir le fichier" button is clicked', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    const openButton = screen.getByText('Ouvrir le fichier');
    fireEvent.click(openButton);

    expect(mockInvoke).toHaveBeenCalledWith('open_file', { path: mockResult.outputPath });
  });

  it('calls invoke("show_in_folder") when "Afficher dans Finder" button is clicked', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    const showButton = screen.getByText('Afficher dans Finder');
    fireEvent.click(showButton);

    expect(mockInvoke).toHaveBeenCalledWith('show_in_folder', { path: mockResult.outputPath });
  });

  it('calls onExportAnother and resets exportResult when "Exporter un autre" is clicked', () => {
    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    const exportAnotherButton = screen.getByText('Exporter un autre');
    fireEvent.click(exportAnotherButton);

    expect(mockOnExportAnother).toHaveBeenCalledTimes(1);
    // exportResult should be reset via closeExportResult
    expect(useExportStore.getState().exportResult).toBeNull();
  });

  it('calls onClose and resets exportResult when "Terminé" is clicked', () => {
    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    const doneButton = screen.getByText('Terminé');
    fireEvent.click(doneButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    // exportResult should be reset via closeExportResult
    expect(useExportStore.getState().exportResult).toBeNull();
  });

  it('handles open_file error with toast notification', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInvoke.mockRejectedValueOnce(new Error('File not found'));

    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    const openButton = screen.getByText('Ouvrir le fichier');
    fireEvent.click(openButton);

    // Wait for async error to be logged and toast to be called
    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to open file:', expect.any(Error));
      expect(toast.error).toHaveBeenCalledWith("Impossible d'ouvrir le fichier");
    });

    consoleError.mockRestore();
  });

  it('handles show_in_folder error with toast notification', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInvoke.mockRejectedValueOnce(new Error('Folder not found'));
    mockGetFileBrowserName.mockReturnValue('Finder');

    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    const showButton = screen.getByText('Afficher dans Finder');
    fireEvent.click(showButton);

    // Wait for async error to be logged and toast to be called
    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to show in folder:', expect.any(Error));
      expect(toast.error).toHaveBeenCalledWith("Impossible d'afficher dans Finder");
    });

    consoleError.mockRestore();
  });

  it('displays OS-specific file browser name (Windows)', () => {
    mockGetFileBrowserName.mockReturnValue('Explorateur');

    render(
      <ExportComplete
        result={mockResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Afficher dans Explorateur')).toBeInTheDocument();
  });

  it('displays file size in GB for large files', () => {
    const largeResult: ExportResult = {
      ...mockResult,
      fileSizeBytes: 2.5 * 1024 ** 3, // 2.5 GB
    };

    render(
      <ExportComplete
        result={largeResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('2.5 GB')).toBeInTheDocument();
  });

  it('displays file size in KB for small files', () => {
    const smallResult: ExportResult = {
      ...mockResult,
      fileSizeBytes: 512 * 1024, // 512 KB
    };

    render(
      <ExportComplete
        result={smallResult}
        onExportAnother={mockOnExportAnother}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('512 KB')).toBeInTheDocument();
  });
});
