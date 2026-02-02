import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TranscriptViewerToolbar } from './TranscriptViewerToolbar';

const defaultProps = {
  searchQuery: '',
  onSearchQueryChange: vi.fn(),
  currentMatchIndex: 0,
  totalMatches: 0,
  onNextMatch: vi.fn(),
  onPrevMatch: vi.fn(),
};

describe('TranscriptViewerToolbar', () => {
  it('should render clear all button', () => {
    render(<TranscriptViewerToolbar {...defaultProps} />);
    expect(screen.getByTitle('Effacer toutes les sélections')).toBeInTheDocument();
  });

  it('should open confirmation dialog when clicking clear all', () => {
    render(<TranscriptViewerToolbar {...defaultProps} onClearAll={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Effacer toutes les sélections'));
    expect(screen.getByText('Effacer toutes les sélections ?')).toBeInTheDocument();
  });

  it('should not clear selections when clicking cancel in dialog', () => {
    const mockClearAll = vi.fn();
    render(<TranscriptViewerToolbar {...defaultProps} onClearAll={mockClearAll} />);
    fireEvent.click(screen.getByTitle('Effacer toutes les sélections'));
    fireEvent.click(screen.getByText('Annuler'));
    expect(mockClearAll).not.toHaveBeenCalled();
  });

  it('should call onClearAll when clicking Effacer in dialog', () => {
    const mockClearAll = vi.fn();
    render(<TranscriptViewerToolbar {...defaultProps} onClearAll={mockClearAll} />);
    fireEvent.click(screen.getByTitle('Effacer toutes les sélections'));
    fireEvent.click(screen.getByText('Effacer'));
    expect(mockClearAll).toHaveBeenCalled();
  });

  it('should disable undo button when canUndo is false', () => {
    render(<TranscriptViewerToolbar {...defaultProps} canUndo={false} />);
    const undoBtn = screen.getByTitle('Annuler (⌘Z)');
    expect(undoBtn).toBeDisabled();
  });

  it('should enable undo button when canUndo is true', () => {
    render(<TranscriptViewerToolbar {...defaultProps} canUndo={true} onUndo={vi.fn()} />);
    const undoBtn = screen.getByTitle('Annuler (⌘Z)');
    expect(undoBtn).not.toBeDisabled();
  });

  it('should disable redo button when canRedo is false', () => {
    render(<TranscriptViewerToolbar {...defaultProps} canRedo={false} />);
    const redoBtn = screen.getByTitle('Rétablir (⌘⇧Z)');
    expect(redoBtn).toBeDisabled();
  });

  it('should enable redo button when canRedo is true', () => {
    render(<TranscriptViewerToolbar {...defaultProps} canRedo={true} onRedo={vi.fn()} />);
    const redoBtn = screen.getByTitle('Rétablir (⌘⇧Z)');
    expect(redoBtn).not.toBeDisabled();
  });

  it('should call onUndo when undo button clicked', () => {
    const mockOnUndo = vi.fn();
    render(<TranscriptViewerToolbar {...defaultProps} canUndo={true} onUndo={mockOnUndo} />);
    fireEvent.click(screen.getByTitle('Annuler (⌘Z)'));
    expect(mockOnUndo).toHaveBeenCalled();
  });

  it('should call onRedo when redo button clicked', () => {
    const mockOnRedo = vi.fn();
    render(<TranscriptViewerToolbar {...defaultProps} canRedo={true} onRedo={mockOnRedo} />);
    fireEvent.click(screen.getByTitle('Rétablir (⌘⇧Z)'));
    expect(mockOnRedo).toHaveBeenCalled();
  });

  it('should allow undo after clear all (integration with store)', () => {
    // This tests the full flow: clear via dialog → undo restores selections
    // We verify the toolbar wires onClearAll correctly; store undo is tested in store tests
    const mockClearAll = vi.fn();
    const mockOnUndo = vi.fn();
    render(
      <TranscriptViewerToolbar
        {...defaultProps}
        onClearAll={mockClearAll}
        onUndo={mockOnUndo}
        canUndo={true}
      />
    );
    // Clear all
    fireEvent.click(screen.getByTitle('Effacer toutes les sélections'));
    fireEvent.click(screen.getByText('Effacer'));
    expect(mockClearAll).toHaveBeenCalled();

    // Undo should be available and callable
    fireEvent.click(screen.getByTitle('Annuler (⌘Z)'));
    expect(mockOnUndo).toHaveBeenCalled();
  });

  it('should show undo restoration message in dialog description', () => {
    render(<TranscriptViewerToolbar {...defaultProps} onClearAll={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Effacer toutes les sélections'));
    expect(screen.getByText(/Vous pouvez annuler avec Cmd\+Z/)).toBeInTheDocument();
  });
});
