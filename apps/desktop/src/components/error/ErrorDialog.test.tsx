import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDialog } from './ErrorDialog';

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

describe('ErrorDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    severity: 'error' as const,
    title: 'Erreur de test',
    description: 'Une erreur est survenue pendant le traitement.',
    suggestedActions: [
      'Vérifiez que le fichier existe toujours.',
      'Réessayez ultérieurement.',
    ],
    onClose: vi.fn(),
  };

  it('renders with error severity icon (XCircle)', () => {
    render(<ErrorDialog {...defaultProps} />);
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });

  it('renders with warning severity icon (AlertTriangle)', () => {
    render(<ErrorDialog {...defaultProps} severity="warning" />);
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
  });

  it('displays title and description', () => {
    render(<ErrorDialog {...defaultProps} />);
    expect(screen.getByText('Erreur de test')).toBeInTheDocument();
    expect(
      screen.getByText('Une erreur est survenue pendant le traitement.')
    ).toBeInTheDocument();
  });

  it('displays suggested actions as bullet list', () => {
    render(<ErrorDialog {...defaultProps} />);
    expect(
      screen.getByText('Vérifiez que le fichier existe toujours.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Réessayez ultérieurement.')
    ).toBeInTheDocument();
  });

  it('shows Fermer button and calls onClose', () => {
    render(<ErrorDialog {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: /fermer/i });
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows Réessayer button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorDialog {...defaultProps} onRetry={onRetry} />);
    const retryButton = screen.getByRole('button', { name: /réessayer/i });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show Réessayer button when onRetry is not provided', () => {
    render(<ErrorDialog {...defaultProps} />);
    expect(
      screen.queryByRole('button', { name: /réessayer/i })
    ).not.toBeInTheDocument();
  });

  it('shows Copier les détails button when errorDetails is provided', () => {
    render(
      <ErrorDialog
        {...defaultProps}
        errorDetails="Error code: ERR_001, timestamp: 2026-02-08T10:00:00Z"
      />
    );
    expect(
      screen.getByRole('button', { name: /copier les détails/i })
    ).toBeInTheDocument();
  });

  it('does not show Copier les détails button when errorDetails is not provided', () => {
    render(<ErrorDialog {...defaultProps} />);
    expect(
      screen.queryByRole('button', { name: /copier les détails/i })
    ).not.toBeInTheDocument();
  });

  it('copies error details to clipboard when Copier les détails is clicked', async () => {
    render(
      <ErrorDialog
        {...defaultProps}
        errorDetails="Error code: ERR_001"
      />
    );
    const copyButton = screen.getByRole('button', {
      name: /copier les détails/i,
    });
    fireEvent.click(copyButton);
    expect(mockWriteText).toHaveBeenCalledTimes(1);
    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining('Error code: ERR_001')
    );
  });

  it('does not display stack traces in the UI (NFR30)', () => {
    render(
      <ErrorDialog
        {...defaultProps}
        description="Erreur inattendue."
        errorDetails="at Object.<anonymous> (/src/main.ts:42:13)"
      />
    );
    // The description should not contain stack traces
    const content = screen.getByTestId('error-dialog-content');
    expect(content.textContent).not.toContain('Object.<anonymous>');
    expect(content.textContent).not.toContain('/src/main.ts');
  });

  it('does not render when isOpen is false', () => {
    render(<ErrorDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Erreur de test')).not.toBeInTheDocument();
  });
});
