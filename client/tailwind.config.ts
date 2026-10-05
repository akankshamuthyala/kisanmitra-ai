import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#fdfbf7',
          100: '#f7f2ea',
          200: '#ede1d1',
          300: '#decaaf',
          400: '#cbb08c',
          500: '#ba986e',
          600: '#ab8459',
          700: '#8e6b47',
          800: '#73573c',
          900: '#5e4833',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Noto Sans Devanagari',
          'Noto Sans Telugu',
          'Noto Sans Tamil',
          'Noto Sans Kannada',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;
