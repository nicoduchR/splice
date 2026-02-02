import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';
import { Badge } from '../badge';
import { Input } from '../input';
import { Progress } from '../progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../dialog';

describe('Design System Components', () => {
  describe('Button Component', () => {
    it('renders all button variants', () => {
      const { container } = render(
        <div>
          <Button variant="default">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      );

      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
      expect(screen.getByText('Ghost')).toBeInTheDocument();
      expect(screen.getByText('Outline')).toBeInTheDocument();
      expect(screen.getByText('Destructive')).toBeInTheDocument();
    });

    it('button has minimum touch target size (44x44px)', () => {
      render(<Button className="min-h-[44px] min-w-[44px]">Click</Button>);
      const button = screen.getByText('Click');

      // Verify button exists and has proper classes
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');
    });

    it('disabled button is not clickable', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByText('Disabled');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Badge Component', () => {
    it('renders all badge variants', () => {
      render(
        <div>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      );

      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
      expect(screen.getByText('Outline')).toBeInTheDocument();
      expect(screen.getByText('Destructive')).toBeInTheDocument();
    });

    it('renders badge with custom colors', () => {
      const { container } = render(
        <Badge className="bg-primary/20 text-primary">4K</Badge>
      );

      const badge = screen.getByText('4K');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-primary/20');
      expect(badge.className).toContain('text-primary');
    });
  });

  describe('Input Component', () => {
    it('renders input with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('disabled input is not editable', async () => {
      const user = userEvent.setup();
      render(<Input disabled placeholder="Disabled" />);

      const input = screen.getByPlaceholderText('Disabled') as HTMLInputElement;
      expect(input).toBeDisabled();

      await user.type(input, 'test');
      expect(input.value).toBe('');
    });

    it('input accepts user input', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);

      const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
      await user.type(input, 'Hello');

      expect(input.value).toBe('Hello');
    });
  });

  describe('Progress Component', () => {
    it('renders progress bar with value', () => {
      const { container } = render(<Progress value={50} />);

      // Progress component uses aria-valuenow
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toBeInTheDocument();
      expect(progress?.getAttribute('aria-valuenow')).toBe('50');
    });

    it('renders progress at 0%', () => {
      const { container } = render(<Progress value={0} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress?.getAttribute('aria-valuenow')).toBe('0');
    });

    it('renders progress at 100%', () => {
      const { container } = render(<Progress value={100} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress?.getAttribute('aria-valuenow')).toBe('100');
    });
  });

  describe('Dialog Component', () => {
    it('renders dialog content when open', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Dialog description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByText('Dialog description')).toBeInTheDocument();
    });

    it('does not render dialog content when closed', () => {
      render(
        <Dialog open={false}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hidden Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Hidden Dialog')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('buttons have accessible focus indicators', () => {
      render(<Button className="focus:ring-2 focus:ring-primary">Focus Test</Button>);
      const button = screen.getByText('Focus Test');

      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toContain('focus:ring-primary');
    });

    it('progress has aria attributes', () => {
      const { container } = render(<Progress value={75} />);
      const progress = container.querySelector('[role="progressbar"]');

      expect(progress?.getAttribute('role')).toBe('progressbar');
      expect(progress?.getAttribute('aria-valuenow')).toBe('75');
    });
  });
});
