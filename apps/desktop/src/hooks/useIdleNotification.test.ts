import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';
import { useIdleNotification } from './useIdleNotification';
import { useUpdateStore } from '@/stores/update-store';
import { useTranscriptStore } from '@/stores/transcript-store';
import { useExportStore } from '@/stores/export-store';
import { useSegmentationStore } from '@/stores/segmentation-store';

const mockToast = vi.mocked(toast);

describe('useIdleNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUpdateStore.setState({
      status: 'ready',
      updateInfo: {
        version: '1.1.0',
        release_date: '',
        release_notes: '',
        download_url: '',
        is_mandatory: false,
      },
      remindLaterUntil: null,
    });
    useTranscriptStore.setState({ isTranscribing: false });
    useExportStore.setState({ isExporting: false });
    useSegmentationStore.setState({ isSegmenting: false });
  });

  it('affiche toast quand transition busy→idle avec update disponible', () => {
    // Start busy
    useTranscriptStore.setState({ isTranscribing: true });

    const { rerender } = renderHook(() => useIdleNotification());

    // Go idle
    act(() => {
      useTranscriptStore.setState({ isTranscribing: false });
    });
    rerender();

    expect(mockToast.info).toHaveBeenCalledWith(
      'Mise à jour v1.1.0 disponible',
      expect.objectContaining({ duration: 5000 }),
    );
  });

  it('n\'affiche pas toast si pas de mise à jour prête', () => {
    useUpdateStore.setState({ status: 'idle' });
    useTranscriptStore.setState({ isTranscribing: true });

    const { rerender } = renderHook(() => useIdleNotification());

    act(() => {
      useTranscriptStore.setState({ isTranscribing: false });
    });
    rerender();

    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('n\'affiche pas toast si remindLater est actif', () => {
    useUpdateStore.setState({ remindLaterUntil: Date.now() + 24 * 60 * 60 * 1000 });
    useTranscriptStore.setState({ isTranscribing: true });

    const { rerender } = renderHook(() => useIdleNotification());

    act(() => {
      useTranscriptStore.setState({ isTranscribing: false });
    });
    rerender();

    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('affiche toast une seule fois par session idle pour la même version', () => {
    useTranscriptStore.setState({ isTranscribing: true });

    const { rerender } = renderHook(() => useIdleNotification());

    // First busy→idle
    act(() => {
      useTranscriptStore.setState({ isTranscribing: false });
    });
    rerender();

    expect(mockToast.info).toHaveBeenCalledTimes(1);

    // Second busy→idle with same version
    act(() => {
      useTranscriptStore.setState({ isTranscribing: true });
    });
    rerender();

    act(() => {
      useTranscriptStore.setState({ isTranscribing: false });
    });
    rerender();

    // Should not show toast again for same version
    expect(mockToast.info).toHaveBeenCalledTimes(1);
  });

  it('n\'affiche pas toast si pas de transition busy→idle', () => {
    // Start idle, stay idle
    renderHook(() => useIdleNotification());

    expect(mockToast.info).not.toHaveBeenCalled();
  });
});
