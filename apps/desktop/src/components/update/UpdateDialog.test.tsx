import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdateDialog } from './UpdateDialog';
import { useUpdateStore } from '@/stores/update-store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

function setupStores() {
  useUpdateStore.setState({
    status: 'ready',
    updateInfo: {
      version: '1.2.0',
      release_date: '2026-01-15',
      release_notes: '- Nouvelle fonctionnalité A\n- Correction de bug B\n## Améliorations\n- Performance améliorée',
      download_url: '',
      is_mandatory: false,
    },
    installOnQuit: false,
    installUpdate: vi.fn(),
    setInstallOnQuit: vi.fn(),
    remindLater: vi.fn(),
  });
}

describe('UpdateDialog', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupStores();
  });

  it('affiche la version', () => {
    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('update-version').textContent).toBe('1.2.0');
  });

  it('affiche la date formatée en français', () => {
    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('update-date').textContent).toMatch(/15 janvier 2026/);
  });

  it('affiche le changelog', () => {
    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('changelog')).toBeTruthy();
    expect(screen.getByText('Nouvelle fonctionnalité A')).toBeTruthy();
    expect(screen.getByText('Correction de bug B')).toBeTruthy();
  });

  it('bouton Install Now déclenche confirmation', () => {
    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Installer maintenant'));
    expect(screen.getByText('Confirmer le redémarrage')).toBeTruthy();
  });

  it('confirmation Install Now appelle installUpdate', async () => {
    const installSpy = vi.fn();
    useUpdateStore.setState({ installUpdate: installSpy });

    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Installer maintenant'));
    fireEvent.click(screen.getByText('Redémarrer'));

    await waitFor(() => {
      expect(installSpy).toHaveBeenCalled();
    });
  });

  it('annulation confirmation revient au dialog', () => {
    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Installer maintenant'));
    expect(screen.getByText('Confirmer le redémarrage')).toBeTruthy();
    fireEvent.click(screen.getByText('Annuler'));
    // Dialog principal toujours visible
    expect(screen.getByText('Mise à jour disponible')).toBeTruthy();
  });

  it('bouton Install on Quit appelle setInstallOnQuit', async () => {
    const setInstallOnQuitSpy = vi.fn();
    useUpdateStore.setState({ setInstallOnQuit: setInstallOnQuitSpy });

    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Installer à la fermeture'));

    await waitFor(() => {
      expect(setInstallOnQuitSpy).toHaveBeenCalledWith(true);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('bouton Remind Later appelle remindLater et ferme', () => {
    const remindLaterSpy = vi.fn();
    useUpdateStore.setState({ remindLater: remindLaterSpy });

    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Rappeler plus tard'));

    expect(remindLaterSpy).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('gère l\'absence de release_notes', () => {
    useUpdateStore.setState({
      updateInfo: {
        version: '1.2.0',
        release_date: '',
        release_notes: '',
        download_url: '',
        is_mandatory: false,
      },
    });

    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByText('Aucune note de version disponible.')).toBeTruthy();
  });

  it('ne rend rien quand isOpen est false', () => {
    const { container } = render(<UpdateDialog isOpen={false} onClose={onClose} />);
    // Dialog should not render content when closed
    expect(screen.queryByText('Mise à jour disponible')).toBeNull();
  });

  it('affiche le titre du dialog', () => {
    render(<UpdateDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByText('Mise à jour disponible')).toBeTruthy();
  });
});
