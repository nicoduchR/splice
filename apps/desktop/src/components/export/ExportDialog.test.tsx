import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from './ExportDialog';
import { useExportStore } from '../../stores/export-store';
import { useVideoStore } from '../../stores/video-store';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
const mockSave = vi.mocked(save);
const mockInvoke = vi.mocked(invoke);

function setUpStores() {
  // Mock invoke to return estimates so useEffect doesn't null-out state
  mockInvoke.mockResolvedValue({
    estimated_size_bytes: 50_000_000,
    estimated_duration_seconds: 30,
  } as any);

  useExportStore.setState({
    isExportDialogOpen: true,
    exportSettings: { quality: 'preserve', outputPath: '', fileName: 'test_video_edited.mp4' },
    estimatedFileSize: 50_000_000,
    estimatedDuration: 30,
    isEstimating: false,
    isExporting: false,
    exportProgress: null,
    exportError: null,
  });
  useVideoStore.setState({
    currentProject: {
      id: 'project-1',
      file_path: '/path/to/test_video.mp4',
      file_name: 'test_video.mp4',
      duration_seconds: 120,
      created_at: 0,
      updated_at: 0,
    },
  } as any);
}

describe('ExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUpStores();
  });

  it('renders all form fields when open', () => {
    render(<ExportDialog />);

    expect(screen.getByText('Exporter la vidéo')).toBeTruthy();
    expect(screen.getByText('MP4 • H.264 High')).toBeTruthy();
    expect(screen.getByText('Préserver l\'original')).toBeTruthy();
    expect(screen.getByText('Haute')).toBeTruthy();
    expect(screen.getByText('Moyenne')).toBeTruthy();
    expect(screen.getByText('Basse')).toBeTruthy();
    expect(screen.getByText('Parcourir')).toBeTruthy();
    expect(screen.getByText('Annuler')).toBeTruthy();
    expect(screen.getByText('Exporter')).toBeTruthy();
  });

  it('displays estimated size and duration', async () => {
    render(<ExportDialog />);

    // Wait for useEffect to settle
    await vi.waitFor(() => {
      expect(screen.getByText('48 MB')).toBeTruthy();
    });
    expect(screen.getByText('~30 secondes')).toBeTruthy();
  });

  it('calls closeExportDialog on cancel click', () => {
    const closeSpy = vi.fn();
    useExportStore.setState({ closeExportDialog: closeSpy });

    render(<ExportDialog />);
    fireEvent.click(screen.getByText('Annuler'));
    expect(closeSpy).toHaveBeenCalled();
  });

  it('calls startExport on export click', () => {
    const exportSpy = vi.fn();
    useExportStore.setState({
      startExport: exportSpy,
      exportSettings: { quality: 'preserve', outputPath: '/Users/test/Desktop', fileName: 'test_video_edited.mp4' },
    });

    render(<ExportDialog />);
    fireEvent.click(screen.getByText('Exporter'));
    expect(exportSpy).toHaveBeenCalledWith('project-1');
  });

  it('calls save dialog on browse click', async () => {
    mockSave.mockResolvedValueOnce('/Users/test/Desktop/my_export.mp4');

    render(<ExportDialog />);
    fireEvent.click(screen.getByText('Parcourir'));

    expect(mockSave).toHaveBeenCalledWith({
      filters: [{ name: 'MP4', extensions: ['mp4'] }],
      defaultPath: 'test_video_edited.mp4',
    });
  });

  it('does not render when dialog is closed', () => {
    useExportStore.setState({ isExportDialogOpen: false });
    render(<ExportDialog />);
    expect(screen.queryByText('Exporter la vidéo')).toBeNull();
  });

  it('triggers estimation on mount and when quality changes', async () => {
    render(<ExportDialog />);
    // Initial call on mount
    expect(mockInvoke).toHaveBeenCalledWith('estimate_export', {
      projectId: 'project-1',
      quality: 'preserve',
    });

    mockInvoke.mockClear();

    // Change quality in store (simulates radio selection)
    useExportStore.getState().updateSettings({ quality: 'high' });

    await vi.waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('estimate_export', {
        projectId: 'project-1',
        quality: 'high',
      });
    });
  });

  it('splits returned path from browse into outputPath and fileName', async () => {
    mockSave.mockResolvedValueOnce('/Users/test/Desktop/my_export.mp4');

    render(<ExportDialog />);
    fireEvent.click(screen.getByText('Parcourir'));

    await vi.waitFor(() => {
      const state = useExportStore.getState();
      expect(state.exportSettings.outputPath).toBe('/Users/test/Desktop');
      expect(state.exportSettings.fileName).toBe('my_export.mp4');
    });
  });

  it('disables export button when outputPath is empty', () => {
    useExportStore.setState({
      isExportDialogOpen: true,
      exportSettings: { quality: 'preserve', outputPath: '', fileName: 'test.mp4' },
    });
    render(<ExportDialog />);
    const exportBtn = screen.getByText('Exporter').closest('button');
    expect(exportBtn?.disabled).toBe(true);
  });
});
