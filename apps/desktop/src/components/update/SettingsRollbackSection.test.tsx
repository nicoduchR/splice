import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsRollbackSection } from './SettingsRollbackSection';
import { useUpdateStore } from '@/stores/update-store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

describe('SettingsRollbackSection', () => {
  const mockFetchBackupInfo = vi.fn();
  const mockPerformManualRollback = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUpdateStore.setState({
      backupInfo: null,
      fetchBackupInfo: mockFetchBackupInfo,
      performManualRollback: mockPerformManualRollback,
    });
  });

  it('ne rend rien quand isOpen est false', () => {
    const { container } = render(
      <SettingsRollbackSection isOpen={false} onClose={mockOnClose} />
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('affiche le dialogue quand isOpen est true', () => {
    render(<SettingsRollbackSection isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Mises à jour')).toBeTruthy();
  });

  it('appelle fetchBackupInfo a l ouverture', () => {
    render(<SettingsRollbackSection isOpen={true} onClose={mockOnClose} />);
    expect(mockFetchBackupInfo).toHaveBeenCalled();
  });

  it('affiche le message quand aucun backup existe', () => {
    render(<SettingsRollbackSection isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('no-backup')).toBeTruthy();
    expect(screen.getByText('Aucune version précédente disponible.')).toBeTruthy();
  });

  it('affiche les infos du backup quand disponible', () => {
    useUpdateStore.setState({
      backupInfo: {
        version: '1.0.0',
        backupDate: '2026-01-15',
        sizeMb: 50,
      },
    });

    render(<SettingsRollbackSection isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId('backup-version')).toBeTruthy();
    expect(screen.getByText('v1.0.0')).toBeTruthy();
    expect(screen.getByTestId('backup-date')).toBeTruthy();
    expect(screen.getByText('2026-01-15')).toBeTruthy();
    expect(screen.getByTestId('backup-size')).toBeTruthy();
    expect(screen.getByText('50 Mo')).toBeTruthy();
  });

  it('affiche le bouton de rollback avec la version', () => {
    useUpdateStore.setState({
      backupInfo: {
        version: '1.2.0',
        backupDate: '2026-01-15',
        sizeMb: 30,
      },
    });

    render(<SettingsRollbackSection isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('rollback-button')).toBeTruthy();
    expect(screen.getByText('Revenir à v1.2.0')).toBeTruthy();
  });

  it('affiche le dialogue de confirmation au clic sur rollback', () => {
    useUpdateStore.setState({
      backupInfo: {
        version: '1.0.0',
        backupDate: '2026-01-15',
        sizeMb: 50,
      },
    });

    render(<SettingsRollbackSection isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId('rollback-button'));

    expect(screen.getByText('Confirmer le rollback')).toBeTruthy();
    expect(screen.getByText(/Voulez-vous revenir à la version v1\.0\.0/)).toBeTruthy();
  });

  it('appelle performManualRollback sur confirmation', async () => {
    mockPerformManualRollback.mockResolvedValue(undefined);
    useUpdateStore.setState({
      backupInfo: {
        version: '1.0.0',
        backupDate: '2026-01-15',
        sizeMb: 50,
      },
    });

    render(<SettingsRollbackSection isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId('rollback-button'));
    fireEvent.click(screen.getByTestId('confirm-rollback'));

    await waitFor(() => {
      expect(mockPerformManualRollback).toHaveBeenCalled();
    });
  });
});
