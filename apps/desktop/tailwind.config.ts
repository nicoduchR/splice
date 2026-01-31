import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // PRIMARY: Bleu utilisé dans designs réels
        primary: '#1580f9',

        // BACKGROUNDS: Dark mode par défaut
        'background-light': '#f5f7f8',
        'background-dark': '#1A1A1F',
        'panel-dark': '#27272D',
        'card-dark': '#27272F',

        // BORDERS: Subtils
        'border-dark': '#33333E',

        // TEXT: Hiérarchie
        'text-muted': '#9CA3AF',

        // SEMANTIC (designs réels)
        success: '#54c41c',   // Vert pour success states
        error: '#FF4D4F',     // Rouge pour errors
        warning: '#f59e0b',   // Orange pour warnings

        // Shadcn/ui CSS variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      screens: {
        'desktop': '1280px',
        'comfortable': '1920px',
        'spacious': '2560px',
        'ultra': '3840px',
      },
    },
  },
} satisfies Config
