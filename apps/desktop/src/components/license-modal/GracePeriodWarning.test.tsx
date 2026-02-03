import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GracePeriodWarning } from './GracePeriodWarning';
import { useLicenseStore } from '@/stores/license-store';

// Mock the license store
vi.mock('@/stores/license-store', () => ({
  useLicenseStore: vi.fn(),
}));

describe('GracePeriodWarning', () => {
  const mockVerifyOnStartup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLicenseStore).mockReturnValue({
      licenseKey: 'SPLICE-TEST-1234',
      verifyOnStartup: mockVerifyOnStartup,
      lastVerifiedAt: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60, // 10 days ago
      error: null,
    });
  });

  it('should render the modal when open', () => {
    render(<GracePeriodWarning open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('Connexion requise pour vérifier la licence')).toBeInTheDocument();
    expect(screen.getByText(/La période de grâce de 7 jours est expirée/)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<GracePeriodWarning open={false} onOpenChange={() => {}} />);

    expect(screen.queryByText('Connexion requise pour vérifier la licence')).not.toBeInTheDocument();
  });

  it('should display days since last verification', () => {
    render(<GracePeriodWarning open={true} onOpenChange={() => {}} />);

    // Should show "il y a 10 jours" for 10 days ago
    expect(screen.getByText(/il y a 10 jours/)).toBeInTheDocument();
  });

  it('should call verifyOnStartup when retry button is clicked', async () => {
    mockVerifyOnStartup.mockResolvedValue(undefined);

    render(<GracePeriodWarning open={true} onOpenChange={() => {}} />);

    const retryButton = screen.getByText('Réessayer');
    fireEvent.click(retryButton);

    expect(mockVerifyOnStartup).toHaveBeenCalledTimes(1);
  });

  it('should show loading state during verification', async () => {
    // Make verifyOnStartup wait
    mockVerifyOnStartup.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<GracePeriodWarning open={true} onOpenChange={() => {}} />);

    const retryButton = screen.getByText('Réessayer');
    fireEvent.click(retryButton);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText('Vérification en cours...')).toBeInTheDocument();
    });
  });

  it('should display error message when present', () => {
    vi.mocked(useLicenseStore).mockReturnValue({
      licenseKey: 'SPLICE-TEST-1234',
      verifyOnStartup: mockVerifyOnStartup,
      lastVerifiedAt: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60,
      error: 'Erreur réseau: connexion impossible',
    });

    render(<GracePeriodWarning open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('Erreur réseau: connexion impossible')).toBeInTheDocument();
  });

  it('should handle case when never verified', () => {
    vi.mocked(useLicenseStore).mockReturnValue({
      licenseKey: null,
      verifyOnStartup: mockVerifyOnStartup,
      lastVerifiedAt: null,
      error: null,
    });

    render(<GracePeriodWarning open={true} onOpenChange={() => {}} />);

    expect(screen.getByText(/Aucune vérification de licence enregistrée/)).toBeInTheDocument();
  });
});
