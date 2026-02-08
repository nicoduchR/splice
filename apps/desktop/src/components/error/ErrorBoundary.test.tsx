import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Mock the logger module (Task 5 — will be created later)
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

// Suppress console.error for intentional errors in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test crash error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    // Should show error dialog title
    expect(screen.getByText('Erreur inattendue')).toBeInTheDocument();
  });

  it('shows suggested actions in fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(
      screen.getByText(/Redémarrez l'application/i)
    ).toBeInTheDocument();
  });

  it('does not show stack traces in the UI (NFR30)', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    const content = screen.getByTestId('error-dialog-content');
    // Should not contain stack trace patterns
    expect(content.textContent).not.toContain('at ThrowingComponent');
    expect(content.textContent).not.toContain('.tsx:');
    expect(content.textContent).not.toContain('.ts:');
  });

  it('shows Réessayer button in fallback (reload action)', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(
      screen.getByRole('button', { name: /réessayer/i })
    ).toBeInTheDocument();
  });

  it('logs error via logger', async () => {
    const { logError } = await import('@/lib/logger');
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(logError).toHaveBeenCalledWith(
      'ErrorBoundary',
      expect.any(Error)
    );
  });
});
