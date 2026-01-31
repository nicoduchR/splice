import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#10b981', // emerald-500
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
