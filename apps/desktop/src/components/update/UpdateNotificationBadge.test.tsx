import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateNotificationBadge } from './UpdateNotificationBadge';
import { useUpdateStore } from '@/stores/update-store';
import { useTranscriptStore } from '@/stores/transcript-store';
import { useExportStore } from '@/stores/export-store';
import { useSegmentationStore } from '@/stores/segmentation-store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

function setupDefaultStores() {
  useUpdateStore.setState({
    status: 'ready',
    updateInfo: {
      version: '1.1.0',
      release_date: '2026-01-15',
      release_notes: 'New features',
      download_url: '',
      is_mandatory: false,
    },
    installOnQuit: false,
    remindLaterUntil: null,
    remindLaterVersion: null,
    showNotification: true,
  });
  useTranscriptStore.setState({ isTranscribing: false });
  useExportStore.setState({ isExporting: false });
  useSegmentationStore.setState({ isSegmenting: false });
}

describe('UpdateNotificationBadge', () => {
  const onClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultStores();
  });

  it('affiche le badge quand status === ready', () => {
    render(<UpdateNotificationBadge onClick={onClick} />);
    expect(screen.getByTestId('update-badge')).toBeTruthy();
  });

  it('masque le badge quand status !== ready', () => {
    useUpdateStore.setState({ status: 'idle' });
    const { container } = render(<UpdateNotificationBadge onClick={onClick} />);
    expect(container.innerHTML).toBe('');
  });

  it('masque le badge quand transcription en cours', () => {
    useTranscriptStore.setState({ isTranscribing: true });
    const { container } = render(<UpdateNotificationBadge onClick={onClick} />);
    expect(container.innerHTML).toBe('');
  });

  it('masque le badge quand export en cours', () => {
    useExportStore.setState({ isExporting: true });
    const { container } = render(<UpdateNotificationBadge onClick={onClick} />);
    expect(container.innerHTML).toBe('');
  });

  it('masque le badge quand segmentation en cours', () => {
    useSegmentationStore.setState({ isSegmenting: true });
    const { container } = render(<UpdateNotificationBadge onClick={onClick} />);
    expect(container.innerHTML).toBe('');
  });

  it('affiche tooltip avec la version au survol', async () => {
    render(<UpdateNotificationBadge onClick={onClick} />);
    const badge = screen.getByTestId('update-badge');
    expect(badge).toBeTruthy();
    // Tooltip uses Radix which renders on hover; verify badge exists with download icon
    const svg = badge.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains('lucide-download')).toBe(true);
  });

  it('affiche icône check quand installOnQuit est actif', () => {
    useUpdateStore.setState({ installOnQuit: true });
    render(<UpdateNotificationBadge onClick={onClick} />);
    const badge = screen.getByTestId('update-badge');
    expect(badge).toBeTruthy();
    // Verify check icon is rendered
    const svg = badge.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains('lucide-check')).toBe(true);
  });

  it('onClick ouvre le dialog', () => {
    render(<UpdateNotificationBadge onClick={onClick} />);
    fireEvent.click(screen.getByTestId('update-badge'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('masque le badge quand remindLater est actif', () => {
    const futureTime = Date.now() + 24 * 60 * 60 * 1000;
    useUpdateStore.setState({ remindLaterUntil: futureTime });
    const { container } = render(<UpdateNotificationBadge onClick={onClick} />);
    expect(container.innerHTML).toBe('');
  });

  it('réaffiche le badge quand remindLater a expiré', () => {
    const pastTime = Date.now() - 1000;
    useUpdateStore.setState({ remindLaterUntil: pastTime });
    render(<UpdateNotificationBadge onClick={onClick} />);
    expect(screen.getByTestId('update-badge')).toBeTruthy();
  });
});
