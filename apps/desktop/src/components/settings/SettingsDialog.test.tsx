import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsDialog } from './SettingsDialog';
import { useUpdateStore } from '@/stores/update-store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/preferences-service', () => ({
  getPreference: vi.fn(),
  setPreference: vi.fn(),
  PREF_TEMP_DIRECTORY: 'temp_directory',
  PREF_TRANSCRIPTION_LANGUAGE_MODE: 'transcription.language_mode',
  PREF_TRANSCRIPTION_WHISPER_PROFILE: 'transcription.whisper_profile',
  PREF_TRANSCRIPTION_WHISPER_AUTO_APPLY_IF_UNEDITED: 'transcription.whisper_auto_apply_if_unedited',
}));

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { getPreference, setPreference } from '@/services/preferences-service';

const mockInvoke = vi.mocked(invoke);
const mockOpen = vi.mocked(open);
const mockGetPreference = vi.mocked(getPreference);
const mockSetPreference = vi.mocked(setPreference);

describe('SettingsDialog', () => {
  const mockOnClose = vi.fn();
  const mockFetchBackupInfo = vi.fn();
  const mockPerformManualRollback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUpdateStore.setState({
      backupInfo: null,
      fetchBackupInfo: mockFetchBackupInfo,
      performManualRollback: mockPerformManualRollback,
    });
    mockGetPreference.mockResolvedValue(null);
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_cache_size') {
        return { proxies_size_gb: 1.5, temp_size_gb: 0.3, total_size_gb: 1.8 };
      }
      return undefined;
    });
  });

  it('ne rend rien quand isOpen est false', () => {
    const { container } = render(
      <SettingsDialog isOpen={false} onClose={mockOnClose} />
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('affiche le titre Paramètres quand ouvert', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Paramètres')).toBeTruthy();
  });

  // --- Cache section ---

  it('affiche la taille du cache', async () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('proxies-size')).toBeTruthy();
    });

    expect(screen.getByTestId('proxies-size').textContent).toBe('1.50 Go');
    expect(screen.getByTestId('temp-size').textContent).toBe('0.30 Go');
    expect(screen.getByTestId('total-size').textContent).toBe('1.80 Go');
  });

  it('affiche le bouton Vider le cache', async () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-cache-button')).toBeTruthy();
    });
  });

  it('vide le cache après confirmation', async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_cache_size') {
        return { proxies_size_gb: 1.5, temp_size_gb: 0.3, total_size_gb: 1.8 };
      }
      if (cmd === 'clear_cache') {
        return { freed_gb: 1.8 };
      }
      return undefined;
    });

    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-cache-button')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('clear-cache-button'));

    // Wait for confirmation dialog to appear
    await waitFor(() => {
      expect(screen.getByTestId('confirm-clear-cache')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('confirm-clear-cache'));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('clear_cache');
    });

    expect(toast.success).toHaveBeenCalledWith('Cache vidé', {
      description: '1.80 Go libérés',
    });
  });

  it('désactive le bouton Vider le cache quand le cache est vide', async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_cache_size') {
        return { proxies_size_gb: 0, temp_size_gb: 0, total_size_gb: 0 };
      }
      return undefined;
    });

    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-cache-button')).toBeTruthy();
    });

    expect(screen.getByTestId('clear-cache-button')).toBeDisabled();
  });

  // --- Temp directory section ---

  it('affiche le répertoire par défaut quand aucun n est configuré', async () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('temp-dir-path')).toBeTruthy();
    });

    expect(screen.getByTestId('temp-dir-path').textContent).toBe('~/.splice/temp/ (par défaut)');
  });

  it('affiche le répertoire personnalisé quand configuré', async () => {
    mockGetPreference.mockResolvedValue('/custom/temp');

    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('temp-dir-path').textContent).toBe('/custom/temp');
    });
  });

  it('change le répertoire temporaire via le sélecteur de dossier', async () => {
    mockOpen.mockResolvedValue('/new/temp/dir');
    mockSetPreference.mockResolvedValue(undefined);

    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('change-temp-dir-button')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('change-temp-dir-button'));

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith({
        directory: true,
        title: 'Choisir le répertoire temporaire',
      });
    });

    await waitFor(() => {
      expect(mockSetPreference).toHaveBeenCalledWith('temp_directory', '/new/temp/dir');
    });

    expect(toast.success).toHaveBeenCalledWith('Répertoire temporaire mis à jour');
  });

  it('affiche le bouton Réinitialiser quand un répertoire est configuré', async () => {
    mockGetPreference.mockResolvedValue('/custom/temp');

    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('reset-temp-dir-button')).toBeTruthy();
    });
  });

  // --- Transcription section ---

  it('affiche les réglages de transcription', async () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Transcription')).toBeTruthy();
    });

    expect(screen.getByTestId('whisper-profile').textContent).toBe('Rapide');
    expect(screen.getByTestId('whisper-auto-apply-toggle')).toBeTruthy();
  });

  it('met à jour la langue de transcription', async () => {
    mockSetPreference.mockResolvedValue(undefined);

    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Forcer Français')).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('Forcer Français'));

    await waitFor(() => {
      expect(mockSetPreference).toHaveBeenCalledWith('transcription.language_mode', 'force_fr');
    });
  });

  // --- Rollback section ---

  it('affiche les infos du backup quand disponible', () => {
    useUpdateStore.setState({
      backupInfo: {
        version: '1.0.0',
        backupDate: '2026-01-15',
        sizeMb: 50,
      },
    });

    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId('backup-version').textContent).toBe('v1.0.0');
    expect(screen.getByTestId('backup-date').textContent).toBe('2026-01-15');
    expect(screen.getByTestId('backup-size').textContent).toBe('50 Mo');
  });

  it('affiche le message quand aucun backup existe', () => {
    render(<SettingsDialog isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('no-backup')).toBeTruthy();
  });
});
