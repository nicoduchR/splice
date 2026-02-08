import React from 'react';
import { ErrorDialog } from './ErrorDialog';
import { logError } from '@/lib/logger';
import { sanitizeErrorForUser } from '@/lib/error-messages';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log full error with component stack for debugging (AC #5)
    logError('ErrorBoundary', error);
    if (errorInfo.componentStack) {
      logError('ErrorBoundary.componentStack', new Error(errorInfo.componentStack));
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorDialog
          isOpen={true}
          severity="error"
          title="Erreur inattendue"
          description="Une erreur inattendue s'est produite dans l'application."
          suggestedActions={[
            "Redémarrez l'application en cliquant sur « Recharger ».",
            "Si le problème persiste, utilisez « Copier les détails » et contactez le support.",
          ]}
          onRetry={this.handleReload}
          onClose={this.handleReload}
          errorDetails={this.state.error?.message ? sanitizeErrorForUser(this.state.error.message) : undefined}
        />
      );
    }

    return this.props.children;
  }
}
