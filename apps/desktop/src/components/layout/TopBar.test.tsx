import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('renders back to editor button in preview mode', () => {
    const onBackToEditor = vi.fn();
    render(<TopBar currentScreen="preview" onBackToEditor={onBackToEditor} />);

    const btn = screen.getByText('Retour à l\'éditeur');
    expect(btn).toBeTruthy();

    fireEvent.click(btn);
    expect(onBackToEditor).toHaveBeenCalled();
  });

  it('renders enabled export button in preview mode and calls onExport', () => {
    const onExport = vi.fn();
    render(<TopBar currentScreen="preview" onBackToEditor={() => {}} onExport={onExport} />);

    const btn = screen.getByText('Exporter');
    expect(btn).toBeTruthy();
    expect(btn.closest('button')?.disabled).toBeFalsy();

    fireEvent.click(btn);
    expect(onExport).toHaveBeenCalled();
  });

  it('does not render export button in preview mode without onExport', () => {
    render(<TopBar currentScreen="preview" onBackToEditor={() => {}} />);
    expect(screen.queryByText('Exporter')).toBeNull();
  });

  it('does not render export button in editor mode', () => {
    render(<TopBar currentScreen="editor" />);
    expect(screen.queryByText('Exporter')).toBeNull();
  });

  it('does not render back button in editor mode', () => {
    render(<TopBar currentScreen="editor" />);
    expect(screen.queryByText('Retour à l\'éditeur')).toBeNull();
  });

  it('renders nav landmark for actions', () => {
    const { container } = render(<TopBar currentScreen="editor" />);
    const nav = container.querySelector('nav[aria-label="Actions principales"]');
    expect(nav).toBeTruthy();
  });

  it('renders header landmark', () => {
    const { container } = render(<TopBar currentScreen="editor" />);
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
  });

  it('renders logo SVG with aria-hidden', () => {
    const { container } = render(<TopBar currentScreen="editor" />);
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeTruthy();
  });
});
