import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentsDemo } from '../ComponentsDemo';

describe('ComponentsDemo Page', () => {
  it('renders the page title', () => {
    render(<ComponentsDemo />);
    expect(screen.getByText('Splice Design System')).toBeInTheDocument();
  });

  describe('Button Section', () => {
    it('displays all button variants', () => {
      render(<ComponentsDemo />);

      // Use getAllByText for repeated text
      const primaryElements = screen.getAllByText('Primary');
      expect(primaryElements.length).toBeGreaterThan(0);

      expect(screen.getByText('Ghost')).toBeInTheDocument();

      const destructiveElements = screen.getAllByText('Destructive');
      expect(destructiveElements.length).toBeGreaterThan(0);

      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    it('displays button with Material Icon', () => {
      render(<ComponentsDemo />);
      expect(screen.getByText('Avec icône')).toBeInTheDocument();
    });
  });

  describe('Dialog Section', () => {
    it('can open and close dialog', async () => {
      const user = userEvent.setup();
      render(<ComponentsDemo />);

      // Dialog should not be visible initially
      expect(screen.queryByText('Exemple Dialog')).not.toBeInTheDocument();

      // Click button to open dialog
      const openButton = screen.getByText('Ouvrir Dialog');
      await user.click(openButton);

      // Dialog should now be visible
      expect(screen.getByText('Exemple Dialog')).toBeInTheDocument();
      expect(screen.getByText(/modal shadcn\/ui avec le thème Splice/)).toBeInTheDocument();
    });
  });

  describe('Progress Section', () => {
    it('displays progress bar with controls', () => {
      render(<ComponentsDemo />);

      expect(screen.getByText('Progression')).toBeInTheDocument();
      expect(screen.getByText('-10%')).toBeInTheDocument();
      expect(screen.getByText('+10%')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('can adjust progress value', async () => {
      const user = userEvent.setup();
      render(<ComponentsDemo />);

      // Find initial progress value (45%)
      expect(screen.getByText('45%')).toBeInTheDocument();

      // Click +10% button
      const plusButton = screen.getByText('+10%');
      await user.click(plusButton);

      // Progress should increase to 55%
      expect(screen.getByText('55%')).toBeInTheDocument();
    });

    it('displays progress examples at 0%, 50%, 100%', () => {
      const { container } = render(<ComponentsDemo />);

      // Should have multiple progress bars
      const progressBars = container.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThan(1);
    });
  });

  describe('Badge Section', () => {
    it('displays all badge variants', () => {
      render(<ComponentsDemo />);

      const badges = screen.getAllByText('Default');
      expect(badges.length).toBeGreaterThan(0);

      // Badge section has its own Secondary and Outline
      const badgeSection = screen.getByText('Badges').parentElement;
      expect(badgeSection).toBeInTheDocument();
    });

    it('displays custom badges from designs', () => {
      render(<ComponentsDemo />);

      expect(screen.getByText('4K')).toBeInTheDocument();
      expect(screen.getByText('Transcription terminée')).toBeInTheDocument();
      expect(screen.getByText('Supporte MP4, MOV, AVI')).toBeInTheDocument();
    });
  });

  describe('Input Section', () => {
    it('displays input examples', () => {
      render(<ComponentsDemo />);

      expect(screen.getByPlaceholderText('Placeholder text')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Disabled')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Input avec erreur')).toBeInTheDocument();
    });
  });

  describe('Color System Section', () => {
    it('displays all custom colors', () => {
      render(<ComponentsDemo />);

      expect(screen.getByText('#1580f9')).toBeInTheDocument(); // Primary
      expect(screen.getByText('#1A1A1F')).toBeInTheDocument(); // Background Dark
      expect(screen.getByText('#27272D')).toBeInTheDocument(); // Panel Dark
      expect(screen.getByText('#54c41c')).toBeInTheDocument(); // Success
      expect(screen.getByText('#FF4D4F')).toBeInTheDocument(); // Error
      expect(screen.getByText('#f59e0b')).toBeInTheDocument(); // Warning
    });
  });

  describe('Breakpoints Section', () => {
    it('displays responsive breakpoints info', () => {
      render(<ComponentsDemo />);
      expect(screen.getByText('Breakpoints Desktop')).toBeInTheDocument();
    });
  });

  describe('Accessibility Section', () => {
    it('displays accessibility compliance information', () => {
      render(<ComponentsDemo />);

      expect(screen.getByText(/Contraste WCAG AA respecté/)).toBeInTheDocument();
      expect(screen.getByText(/Touch targets minimum 44x44px/)).toBeInTheDocument();
      expect(screen.getByText(/Focus indicators visibles/)).toBeInTheDocument();
      expect(screen.getByText(/Navigation clavier complète/)).toBeInTheDocument();
    });
  });

  describe('Material Symbols Section', () => {
    it('displays Material Symbol icons', () => {
      render(<ComponentsDemo />);

      expect(screen.getByText('Material Symbols Icons')).toBeInTheDocument();

      // Icons appear twice (as icon + label), use getAllByText
      const movieIcons = screen.getAllByText('movie');
      expect(movieIcons.length).toBeGreaterThan(0);

      const videoFileIcons = screen.getAllByText('video_file');
      expect(videoFileIcons.length).toBeGreaterThan(0);

      const contentCutIcons = screen.getAllByText('content_cut');
      expect(contentCutIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('renders complete demo page without errors', () => {
      const { container } = render(<ComponentsDemo />);
      expect(container).toBeInTheDocument();

      // Verify all main sections are present
      expect(screen.getByText('Buttons')).toBeInTheDocument();
      expect(screen.getByText('Dialog')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Badges')).toBeInTheDocument();
      expect(screen.getByText('Input')).toBeInTheDocument();
      expect(screen.getByText('Système de couleurs')).toBeInTheDocument();
      expect(screen.getByText('Accessibilité')).toBeInTheDocument();
    });
  });
});
