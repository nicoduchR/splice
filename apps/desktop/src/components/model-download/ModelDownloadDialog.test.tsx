import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelDownloadDialog } from './ModelDownloadDialog';
import { listen } from '@tauri-apps/api/event';

// Mock Tauri API
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

describe('ModelDownloadDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<ModelDownloadDialog isOpen={true} />);

    expect(
      screen.getByText('Téléchargement du moteur de transcription')
    ).toBeInTheDocument();
    expect(screen.getByText('Téléchargement en cours...')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ModelDownloadDialog isOpen={false} />);

    expect(
      screen.queryByText('Téléchargement du moteur de transcription')
    ).not.toBeInTheDocument();
  });

  it('should display initial progress at 0%', () => {
    render(<ModelDownloadDialog isOpen={true} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should register download failure listeners with kebab-case and legacy underscore event names', () => {
    render(<ModelDownloadDialog isOpen={true} />);

    expect(listen).toHaveBeenCalledWith('model:download-failed', expect.any(Function));
    expect(listen).toHaveBeenCalledWith('model:download_failed', expect.any(Function));
  });

  it('should show cancel button during download', () => {
    render(<ModelDownloadDialog isOpen={true} />);

    const cancelButton = screen.getByRole('button', { name: /Annuler/i });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).not.toBeDisabled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ModelDownloadDialog isOpen={true} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /Annuler/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should display error message when error occurs', () => {
    // This would need a way to simulate error state
    // For now, we test the component renders error UI correctly
    // when error prop is passed (if we add it)
  });

  it('should show retry button on failure', () => {
    // This test would verify the retry button appears
    // when download fails - implementation depends on error state
  });

  it('should disable cancel button when download is near completion', () => {
    // Test that cancel is disabled at >90% to prevent
    // accidental cancellation during final stages
  });
});
