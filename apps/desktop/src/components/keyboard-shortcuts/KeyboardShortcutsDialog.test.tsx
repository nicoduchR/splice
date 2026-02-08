import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';

describe('KeyboardShortcutsDialog', () => {
  it('should render all shortcut sections when open', () => {
    render(
      <KeyboardShortcutsDialog isOpen={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText('Raccourcis clavier')).toBeInTheDocument();
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('Transcript')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Lecteur')).toBeInTheDocument();
    expect(screen.getByText('Modals')).toBeInTheDocument();
  });

  it('should not render content when closed', () => {
    render(
      <KeyboardShortcutsDialog isOpen={false} onOpenChange={vi.fn()} />
    );

    expect(screen.queryByText('Raccourcis clavier')).not.toBeInTheDocument();
  });

  it('should display shortcut descriptions', () => {
    render(
      <KeyboardShortcutsDialog isOpen={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText('Play / Pause')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
    expect(screen.getByText('Rétablir')).toBeInTheDocument();
    expect(screen.getByText('Mot précédent / suivant')).toBeInTheDocument();
    expect(screen.getByText('Paragraphe précédent / suivant')).toBeInTheDocument();
    expect(screen.getByText('±1 frame (1/30s)')).toBeInTheDocument();
    expect(screen.getByText('±5 secondes')).toBeInTheDocument();
    expect(screen.getByText('Début de la vidéo')).toBeInTheDocument();
    expect(screen.getByText('Fin de la vidéo')).toBeInTheDocument();
    expect(screen.getByText('Volume ±10%')).toBeInTheDocument();
    expect(screen.getByText('Plein écran')).toBeInTheDocument();
  });

  it('should display keyboard keys with kbd elements', () => {
    render(
      <KeyboardShortcutsDialog isOpen={true} onOpenChange={vi.fn()} />
    );

    const kbds = screen.getAllByText(/(Space|Escape|Home|End|Tab|Enter|F)/);
    expect(kbds.length).toBeGreaterThan(0);
  });

  it('should detect Mac platform and show ⌘', () => {
    const originalPlatform = navigator.platform;

    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
      configurable: true,
    });

    render(
      <KeyboardShortcutsDialog isOpen={true} onOpenChange={vi.fn()} />
    );

    // Verify ⌘ appears in the dialog content
    const container = screen.getByTestId('shortcuts-sections');
    expect(container.textContent).toContain('⌘');

    // Restore platform
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  it('should call onOpenChange when closed via Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <KeyboardShortcutsDialog isOpen={true} onOpenChange={onOpenChange} />
    );

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should have accessible dialog description', () => {
    render(
      <KeyboardShortcutsDialog isOpen={true} onOpenChange={vi.fn()} />
    );

    expect(
      screen.getByText(/Liste de tous les raccourcis clavier/)
    ).toBeInTheDocument();
  });
});
