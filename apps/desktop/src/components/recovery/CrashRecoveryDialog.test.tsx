import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrashRecoveryDialog } from './CrashRecoveryDialog';

describe('CrashRecoveryDialog', () => {
  const mockOnRecover = vi.fn();
  const mockOnStartFresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <CrashRecoveryDialog
        isOpen={false}
        isRecovering={false}
        onRecover={mockOnRecover}
        onStartFresh={mockOnStartFresh}
      />
    );
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('shows dialog when open', () => {
    render(
      <CrashRecoveryDialog
        isOpen={true}
        isRecovering={false}
        onRecover={mockOnRecover}
        onStartFresh={mockOnStartFresh}
      />
    );
    expect(screen.getByText(/ferm.*de mani.*re inattendue/i)).toBeTruthy();
  });

  it('shows recover and start fresh buttons', () => {
    render(
      <CrashRecoveryDialog
        isOpen={true}
        isRecovering={false}
        onRecover={mockOnRecover}
        onStartFresh={mockOnStartFresh}
      />
    );
    expect(screen.getByTestId('recover-project')).toBeTruthy();
    expect(screen.getByTestId('start-fresh')).toBeTruthy();
  });

  it('calls onRecover when recover button clicked', () => {
    render(
      <CrashRecoveryDialog
        isOpen={true}
        isRecovering={false}
        onRecover={mockOnRecover}
        onStartFresh={mockOnStartFresh}
      />
    );
    fireEvent.click(screen.getByTestId('recover-project'));
    expect(mockOnRecover).toHaveBeenCalledTimes(1);
  });

  it('calls onStartFresh when start fresh button clicked', () => {
    render(
      <CrashRecoveryDialog
        isOpen={true}
        isRecovering={false}
        onRecover={mockOnRecover}
        onStartFresh={mockOnStartFresh}
      />
    );
    fireEvent.click(screen.getByTestId('start-fresh'));
    expect(mockOnStartFresh).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when recovering', () => {
    render(
      <CrashRecoveryDialog
        isOpen={true}
        isRecovering={true}
        onRecover={mockOnRecover}
        onStartFresh={mockOnStartFresh}
      />
    );
    expect(screen.getByTestId('recover-project')).toBeDisabled();
    expect(screen.getByTestId('start-fresh')).toBeDisabled();
  });

  it('shows recovering text when isRecovering is true', () => {
    render(
      <CrashRecoveryDialog
        isOpen={true}
        isRecovering={true}
        onRecover={mockOnRecover}
        onStartFresh={mockOnStartFresh}
      />
    );
    expect(screen.getByText('Récupération...')).toBeTruthy();
  });
});
