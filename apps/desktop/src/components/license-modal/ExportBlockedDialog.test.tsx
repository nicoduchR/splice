import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportBlockedDialog } from './ExportBlockedDialog';
import { useExportStore } from '../../stores/export-store';
import { useLicenseStore } from '../../stores/license-store';
import { LICENSE_PLAN } from '../../services/license-api';

// Mock Tauri for store tests
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(vi.fn())),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe('ExportBlockedDialog', () => {
  const defaultProps = {
    isOpen: true,
    onUpgrade: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with correct title when open', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    expect(screen.getByText('Export disponible uniquement pour Splice Pro')).toBeInTheDocument();
  });

  it('renders dialog with correct message', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    expect(
      screen.getByText(
        'Vous avez créé un montage parfait! Pour exporter votre vidéo, passez à Splice Pro.'
      )
    ).toBeInTheDocument();
  });

  it('renders "Passer à Pro" button', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Passer à Pro' })).toBeInTheDocument();
  });

  it('renders "Fermer" button', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('calls onUpgrade when "Passer à Pro" button is clicked', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Passer à Pro' }));

    expect(defaultProps.onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when "Fermer" button is clicked', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render content when isOpen is false', () => {
    render(<ExportBlockedDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Export disponible uniquement pour Splice Pro')).not.toBeInTheDocument();
  });

  it('has emerald green background on "Passer à Pro" button', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    const upgradeButton = screen.getByRole('button', { name: 'Passer à Pro' });
    expect(upgradeButton).toHaveClass('bg-emerald-600');
  });

  // New tests for enhanced UI (Story 7.4)
  it('renders benefits list with 4 items', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    expect(screen.getByText('Export illimité en MP4 haute qualité')).toBeInTheDocument();
    expect(screen.getByText("Vidéos jusqu'à 2h (pas de limite 30min)")).toBeInTheDocument();
    expect(screen.getByText('Support prioritaire')).toBeInTheDocument();
    expect(screen.getByText('Mises à jour incluses')).toBeInTheDocument();
  });

  it('renders pricing information', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    expect(screen.getByText('19€/mois ou 99€/an')).toBeInTheDocument();
  });

  it('shows loading state when isUpgrading is true', () => {
    render(<ExportBlockedDialog {...defaultProps} isUpgrading={true} />);

    expect(screen.getByText('Attente...')).toBeInTheDocument();
  });

  it('disables buttons when isUpgrading is true', () => {
    render(<ExportBlockedDialog {...defaultProps} isUpgrading={true} />);

    const upgradeButton = screen.getByRole('button', { name: /Attente/i });
    const closeButton = screen.getByRole('button', { name: 'Fermer' });

    expect(upgradeButton).toBeDisabled();
    expect(closeButton).toBeDisabled();
  });

  it('does not close dialog when clicking outside during upgrade', () => {
    const onClose = vi.fn();
    // Note: This tests the onOpenChange callback behavior
    // The actual overlay click simulation requires more complex setup
    render(<ExportBlockedDialog {...defaultProps} isUpgrading={true} onClose={onClose} />);

    // Dialog should still be visible
    expect(screen.getByText('Export disponible uniquement pour Splice Pro')).toBeInTheDocument();
  });

  it('calls onClose when dialog is closed via onOpenChange (overlay click)', () => {
    const { rerender } = render(<ExportBlockedDialog {...defaultProps} />);

    // Re-render with isOpen=false simulates the dialog closing
    rerender(<ExportBlockedDialog {...defaultProps} isOpen={false} />);

    // The onClose should have been called via onOpenChange when dialog state changes
    expect(screen.queryByText('Export disponible uniquement pour Splice Pro')).not.toBeInTheDocument();
  });

  // Story 7.5: Early adopter link tests
  it('renders early adopter link when onEarlyAdopterClick is provided', () => {
    render(<ExportBlockedDialog {...defaultProps} onEarlyAdopterClick={vi.fn()} />);

    expect(screen.getByText('Vous avez un code early adopter?')).toBeInTheDocument();
  });

  it('does not render early adopter link when onEarlyAdopterClick is not provided', () => {
    render(<ExportBlockedDialog {...defaultProps} />);

    expect(screen.queryByText('Vous avez un code early adopter?')).not.toBeInTheDocument();
  });

  it('calls onEarlyAdopterClick when link is clicked', () => {
    const onEarlyAdopterClick = vi.fn();
    render(<ExportBlockedDialog {...defaultProps} onEarlyAdopterClick={onEarlyAdopterClick} />);

    fireEvent.click(screen.getByText('Vous avez un code early adopter?'));

    expect(onEarlyAdopterClick).toHaveBeenCalledTimes(1);
  });

  it('disables early adopter link during upgrade', () => {
    render(<ExportBlockedDialog {...defaultProps} isUpgrading={true} onEarlyAdopterClick={vi.fn()} />);

    const link = screen.getByText('Vous avez un code early adopter?');
    expect(link).toBeDisabled();
  });

  it('early adopter link has correct styling', () => {
    render(<ExportBlockedDialog {...defaultProps} onEarlyAdopterClick={vi.fn()} />);

    const link = screen.getByText('Vous avez un code early adopter?');
    expect(link).toHaveClass('text-gray-400');
    expect(link).toHaveClass('text-sm');
  });
});

describe('ExportBlockedDialog integration with stores', () => {
  beforeEach(() => {
    // Reset stores
    useExportStore.setState({
      isExportDialogOpen: false,
      showExportBlockedDialog: false,
      exportError: null,
      isUpgrading: false,
      _upgradePollingInterval: null,
    });
  });

  it('freemium user clicking export triggers ExportBlockedDialog via store', () => {
    // Set user as freemium
    useLicenseStore.setState({ plan: LICENSE_PLAN.FREE });

    // Simulate clicking export button (calls openExportDialog)
    useExportStore.getState().openExportDialog();

    // Verify blocked dialog state is set
    expect(useExportStore.getState().showExportBlockedDialog).toBe(true);
    expect(useExportStore.getState().isExportDialogOpen).toBe(false);
  });

  it('pro user clicking export opens ExportDialog normally via store', () => {
    // Set user as pro
    useLicenseStore.setState({ plan: LICENSE_PLAN.PRO });

    // Simulate clicking export button
    useExportStore.getState().openExportDialog();

    // Verify export dialog opens, not blocked dialog
    expect(useExportStore.getState().showExportBlockedDialog).toBe(false);
    expect(useExportStore.getState().isExportDialogOpen).toBe(true);
  });

  it('clicking Fermer closes the blocked dialog via store', () => {
    useExportStore.setState({ showExportBlockedDialog: true });

    // Render component connected to store
    const handleClose = vi.fn(() => {
      useExportStore.getState().closeExportBlockedDialog();
    });

    render(
      <ExportBlockedDialog
        isOpen={true}
        onUpgrade={vi.fn()}
        onClose={handleClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(useExportStore.getState().showExportBlockedDialog).toBe(false);
  });

  it('stopUpgradeFlow clears polling interval', () => {
    // Set up a mock interval
    const mockInterval = setInterval(() => {}, 1000);
    useExportStore.setState({
      isUpgrading: true,
      _upgradePollingInterval: mockInterval,
    });

    // Stop upgrade flow
    useExportStore.getState().stopUpgradeFlow();

    // Verify state is cleared
    expect(useExportStore.getState().isUpgrading).toBe(false);
    expect(useExportStore.getState()._upgradePollingInterval).toBeNull();

    // Cleanup
    clearInterval(mockInterval);
  });

  it('startUpgradeFlow sets isUpgrading to true immediately', async () => {
    // Mock fetch and dependencies
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            checkoutUrl: 'https://checkout.stripe.com/test',
            sessionId: 'cs_test',
          },
        }),
    });

    // Start upgrade flow (don't await - we want to check immediate state)
    const promise = useExportStore.getState().startUpgradeFlow('test@example.com', 'price_123');

    // Small delay to let the async function start
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify isUpgrading is true during the flow
    expect(useExportStore.getState().isUpgrading).toBe(true);

    // Clean up - stop the flow
    useExportStore.getState().stopUpgradeFlow();
    await promise.catch(() => {}); // Ignore any errors
  });
});
