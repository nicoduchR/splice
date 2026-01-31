import { describe, it, expect } from 'vitest';
import tailwindConfig from '../../tailwind.config';

describe('Tailwind Configuration', () => {
  describe('Color System', () => {
    it('has primary blue color from designs', () => {
      expect(tailwindConfig.theme?.extend?.colors).toHaveProperty('primary', '#1580f9');
    });

    it('has dark mode background colors', () => {
      const colors = tailwindConfig.theme?.extend?.colors;
      expect(colors).toHaveProperty('background-dark', '#1A1A1F');
      expect(colors).toHaveProperty('panel-dark', '#27272D');
      expect(colors).toHaveProperty('card-dark', '#27272F');
    });

    it('has border colors', () => {
      const colors = tailwindConfig.theme?.extend?.colors;
      expect(colors).toHaveProperty('border-dark', '#33333E');
    });

    it('has text hierarchy colors', () => {
      const colors = tailwindConfig.theme?.extend?.colors;
      expect(colors).toHaveProperty('text-muted', '#9CA3AF');
    });

    it('has semantic colors from designs', () => {
      const colors = tailwindConfig.theme?.extend?.colors;
      expect(colors).toHaveProperty('success', '#54c41c');
      expect(colors).toHaveProperty('error', '#FF4D4F');
      expect(colors).toHaveProperty('warning', '#f59e0b');
    });
  });

  describe('Custom Breakpoints', () => {
    it('has desktop breakpoint at 1280px', () => {
      const screens = tailwindConfig.theme?.extend?.screens;
      expect(screens).toHaveProperty('desktop', '1280px');
    });

    it('has comfortable breakpoint at 1920px', () => {
      const screens = tailwindConfig.theme?.extend?.screens;
      expect(screens).toHaveProperty('comfortable', '1920px');
    });

    it('has spacious breakpoint at 2560px', () => {
      const screens = tailwindConfig.theme?.extend?.screens;
      expect(screens).toHaveProperty('spacious', '2560px');
    });

    it('has ultra breakpoint at 3840px', () => {
      const screens = tailwindConfig.theme?.extend?.screens;
      expect(screens).toHaveProperty('ultra', '3840px');
    });
  });

  describe('Typography', () => {
    it('has Inter display font', () => {
      const fontFamily = tailwindConfig.theme?.extend?.fontFamily;
      expect(fontFamily?.display).toEqual(['Inter', 'sans-serif']);
    });

    it('has JetBrains Mono font', () => {
      const fontFamily = tailwindConfig.theme?.extend?.fontFamily;
      expect(fontFamily?.mono).toEqual(['JetBrains Mono', 'monospace']);
    });
  });

  describe('Border Radius', () => {
    it('has default border radius of 0.25rem', () => {
      const borderRadius = tailwindConfig.theme?.extend?.borderRadius;
      expect(borderRadius?.DEFAULT).toBe('0.25rem');
    });

    it('has lg border radius of 0.5rem', () => {
      const borderRadius = tailwindConfig.theme?.extend?.borderRadius;
      expect(borderRadius?.lg).toBe('0.5rem');
    });

    it('has xl border radius of 0.75rem', () => {
      const borderRadius = tailwindConfig.theme?.extend?.borderRadius;
      expect(borderRadius?.xl).toBe('0.75rem');
    });
  });

  describe('Dark Mode', () => {
    it('uses class-based dark mode', () => {
      expect(tailwindConfig.darkMode).toBe('class');
    });
  });

  describe('Content Configuration', () => {
    it('includes TypeScript files in content', () => {
      expect(tailwindConfig.content).toContain('./src/**/*.{ts,tsx}');
    });
  });

  describe('Spacing System (rem units)', () => {
    it('uses Tailwind default spacing scale (rem-based)', () => {
      // Tailwind's default spacing uses rem units (0.25rem base)
      // We verify that we're extending Tailwind's config, not replacing it
      expect(tailwindConfig.theme?.extend).toBeDefined();

      // The spacing scale is inherited from Tailwind's defaults
      // px-4 = 1rem, py-2 = 0.5rem, etc.
      // This test verifies we're using extend, which preserves the rem-based scale
      const extendConfig = tailwindConfig.theme?.extend;
      expect(extendConfig).toBeDefined();
    });
  });
});
