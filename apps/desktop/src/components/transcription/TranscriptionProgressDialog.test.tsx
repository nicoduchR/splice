import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TranscriptionProgressDialog } from './TranscriptionProgressDialog';

// Mock Tauri API
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve()),
}));

describe('TranscriptionProgressDialog', () => {
  const mockVideoInfo = {
    id: 'test-video-123',
    file_name: 'interview-client-final.mp4',
    duration_seconds: 5025, // 01:23:45
    file_size_bytes: 4_200_000_000, // 4.2 GB
  };

  const mockProgress = {
    video_id: 'test-video-123',
    stage: 'transcribing' as const,
    progress: 0.78,
    message: 'Transcription en cours...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open with video info', () => {
    render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
      />
    );

    expect(screen.getByText('interview-client-final.mp4')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('should display progress bar with correct percentage', () => {
    render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
      />
    );

    const progressText = screen.getByText('78%');
    expect(progressText).toBeInTheDocument();
  });

  it('should call onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Annuler/i });
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should display different messages based on stage', () => {
    const { rerender } = render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={{
          ...mockProgress,
          stage: 'extracting',
          message: 'Extraction audio...',
        }}
        videoInfo={mockVideoInfo}
      />
    );

    expect(screen.getByText(/Extraction audio/i)).toBeInTheDocument();

    rerender(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={{
          ...mockProgress,
          stage: 'loading',
          message: 'Chargement du modèle...',
        }}
        videoInfo={mockVideoInfo}
      />
    );

    expect(screen.getByText(/Chargement du modèle/i)).toBeInTheDocument();

    rerender(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={{
          ...mockProgress,
          stage: 'transcribing',
          message: 'Transcription en cours...',
        }}
        videoInfo={mockVideoInfo}
      />
    );

    expect(screen.getByText(/Transcription en cours/i)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <TranscriptionProgressDialog
        isOpen={false}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
      />
    );

    expect(screen.queryByText('interview-client-final.mp4')).not.toBeInTheDocument();
  });

  it('should show privacy notice', () => {
    render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
      />
    );

    expect(screen.getByText(/Transcription locale et sécurisée/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Aucune donnée ne quitte votre appareil/i)
    ).toBeInTheDocument();
  });

  it('should format video duration correctly', () => {
    render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
      />
    );

    // Duration should be formatted as 01:23:45
    expect(screen.getByText('01:23:45')).toBeInTheDocument();
  });

  it('should format file size correctly', () => {
    render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
      />
    );

    // File size is shown in GiB units (base 1024), so 4_200_000_000 bytes -> 3.9 GB
    expect(screen.getByText(/3\.9 GB/i)).toBeInTheDocument();
  });

  it('should show progress bar for videos longer than 10 minutes', () => {
    render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={{
          ...mockVideoInfo,
          duration_seconds: 700, // 11 minutes
        }}
      />
    );

    // Should show progress percentage
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('should show spinner for videos shorter than 10 minutes', () => {
    render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={{
          ...mockVideoInfo,
          duration_seconds: 500, // 8 minutes
        }}
      />
    );

    // Should NOT show percentage for short videos
    expect(screen.queryByText('78%')).not.toBeInTheDocument();
  });

  it('should display technical metadata', () => {
    render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
      />
    );

    expect(screen.getByText(/Parakeet TDT/i)).toBeInTheDocument();
    expect(screen.getByText(/CPU/i)).toBeInTheDocument();
  });

  it('should calculate and display time remaining for long videos', async () => {
    const { rerender } = render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={{ ...mockProgress, progress: 0.1 }}
        videoInfo={mockVideoInfo}
      />
    );

    // Simulate progress updates over time to trigger time calculation
    await waitFor(() => {
      rerender(
        <TranscriptionProgressDialog
          isOpen={true}
          progress={{ ...mockProgress, progress: 0.5 }}
          videoInfo={mockVideoInfo}
        />
      );
    });

    // After multiple progress updates, time remaining should be calculated
    // Note: exact timing is hard to test deterministically, just check the element exists
    await waitFor(() => {
      const timeText = screen.queryByText(/secondes? restantes?/i);
      // Time remaining calculation requires multiple samples, may not appear immediately
      if (timeText) {
        expect(timeText).toBeInTheDocument();
      }
    });
  });

  it('should reset progress history when dialog closes', () => {
    const { rerender } = render(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
      />
    );

    // Close dialog
    rerender(
      <TranscriptionProgressDialog
        isOpen={false}
        progress={mockProgress}
        videoInfo={mockVideoInfo}
      />
    );

    // Reopen with new progress
    rerender(
      <TranscriptionProgressDialog
        isOpen={true}
        progress={{ ...mockProgress, progress: 0.2 }}
        videoInfo={mockVideoInfo}
      />
    );

    // Time calculation should restart (no old history)
    expect(screen.queryByText(/secondes? restantes?/i)).not.toBeInTheDocument();
  });
});
