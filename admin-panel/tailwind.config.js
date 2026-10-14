/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green:    '#0B4F3C', // Logo emerald
          dark:     '#063B2D', // Forest green
          soft:     '#E8F0EC',
          warm:     '#FDFCF0', // Logo cream
          charcoal: '#171A18',
          gold:     '#C9A96E', // Metallic gold
          'gold-light': '#F3E5AB',
          'gold-dark':  '#A67C2D',
          // Legacy alias → gold
          sky:      '#C9A96E',
        },
        bgDark: '#0A1612',
        cardDark: '#111827',
        cardBorder: '#1F2937',
        primaryBlue: '#0B4F3C',
        accentOrange: '#C9A96E', // Gold accent (was sky blue)
        successGreen: '#22C55E',
        bookedBlue: '#3B82F6',
        warningYellow: '#FACC15',
        dangerRed: '#EF4444',
        textMain: '#F8FAFC',
        textMuted: '#94A3B8'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
