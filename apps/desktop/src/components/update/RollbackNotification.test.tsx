import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RollbackNotification } from './RollbackNotification';
import { useUpdateStore } from '@/stores/update-store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

describe('RollbackNotification', () => {
  const mockSendCrashReport = vi.fn();
  const mockClearRollbackNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUpdateStore.setState({
      rollbackCompleted: null,
      sendCrashReport: mockSendCrashReport,
      clearRollbackNotification: mockClearRollbackNotification,
    });
  });

  it('ne rend rien quand rollbackCompleted est null', () => {
    const { container } = render(<RollbackNotification />);
    expect(container.innerHTML).toBe('');
  });

  it('affiche le dialogue quand un rollback est effectue', () => {
    useUpdateStore.setState({
      rollbackCompleted: {
        previousVersion: '1.1.0',
        restoredVersion: '1.0.0',
      },
    });

    render(<RollbackNotification />);
    expect(screen.getByText('Version précédente restaurée')).toBeTruthy();
  });

  it('affiche les versions correctes', () => {
    useUpdateStore.setState({
      rollbackCompleted: {
        previousVersion: '2.0.0',
        restoredVersion: '1.9.0',
      },
    });

    render(<RollbackNotification />);
    expect(screen.getByText(/v2\.0\.0/)).toBeTruthy();
    expect(screen.getByText(/v1\.9\.0/)).toBeTruthy();
  });

  it('bouton crash report appelle sendCrashReport', async () => {
    mockSendCrashReport.mockResolvedValue(undefined);
    useUpdateStore.setState({
      rollbackCompleted: {
        previousVersion: '1.1.0',
        restoredVersion: '1.0.0',
      },
    });

    render(<RollbackNotification />);
    fireEvent.click(screen.getByTestId('send-crash-report'));

    await waitFor(() => {
      expect(mockSendCrashReport).toHaveBeenCalledWith(true);
    });
  });

  it('affiche "Rapport envoye" apres envoi reussi', async () => {
    mockSendCrashReport.mockResolvedValue(undefined);
    useUpdateStore.setState({
      rollbackCompleted: {
        previousVersion: '1.1.0',
        restoredVersion: '1.0.0',
      },
    });

    render(<RollbackNotification />);
    fireEvent.click(screen.getByTestId('send-crash-report'));

    await waitFor(() => {
      expect(screen.getByTestId('report-sent')).toBeTruthy();
    });
  });

  it('bouton OK ferme le dialogue', () => {
    useUpdateStore.setState({
      rollbackCompleted: {
        previousVersion: '1.1.0',
        restoredVersion: '1.0.0',
      },
    });

    render(<RollbackNotification />);
    fireEvent.click(screen.getByText('OK'));
    expect(mockClearRollbackNotification).toHaveBeenCalled();
  });
});
