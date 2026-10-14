import type { Config } from 'tailwindcss'

/**
 * Brand palette sourced from House & Sky logo
 * (landing-page/public/images/logo.png):
 * deep emerald green + metallic gold + cream.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    fontFamily: {
      playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
      serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      inter: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      cormorant: ['var(--font-playfair)', 'Georgia', 'serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
    extend: {
      colors: {
        bg: {
          primary:   '#FFFFFF',
          secondary: '#FFFFFF',
          surface:   '#FFFFFF',
          elevated:  '#F3F4F6',
          muted:     '#F3F4F6', // gray-100 section band
          dark:      '#063B2D',
        },
        brand: {
          green:       '#0B4F3C', // Logo emerald
          dark:        '#063B2D', // Deep forest
          soft:        '#E8F0EC', // Soft green tint
          warm:        '#FDFCF0', // Cream
          charcoal:    '#171A18',
          muted:       '#6D746F',
          gold:        '#C9A96E', // Metallic gold (logo &)
          'gold-light':'#F3E5AB',
          'gold-dark': '#A67C2D',
          // Legacy alias — sky accent remapped to gold (logo palette)
          sky:         '#C9A96E',
          'sky-light': '#F8F1DE',
        },
        charcoal: {
          100: '#171A18',
          200: '#2D332F',
          300: '#6D746F',
          400: '#949B95',
          500: '#D1D5D2',
        },
        gold: {
          50:  '#FDF8EC',
          100: '#F8F1DE',
          200: '#F3E5AB',
          300: '#D4AF37',
          400: '#C9A96E',
          500: '#B8860B',
          600: '#A67C2D',
          700: '#8B6914',
        },
      },
      fontSize: {
        'display-2xl': ['5.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-xl':  ['4.25rem', { lineHeight: '1.08', letterSpacing: '-0.01em' }],
        'display-lg':  ['3.25rem', { lineHeight: '1.1',  letterSpacing: '0em'    }],
        'heading-xl':  ['2.5rem',  { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'heading-lg':  ['2rem',    { lineHeight: '1.2',  letterSpacing: '0em'    }],
        'heading-md':  ['1.5rem',  { lineHeight: '1.3',  letterSpacing: '0em'    }],
        'body-lg':     ['1.125rem', { lineHeight: '1.6',  letterSpacing: '0em'   }],
        'body-md':     ['1rem',     { lineHeight: '1.65', letterSpacing: '0em'   }],
        'body-sm':     ['0.875rem', { lineHeight: '1.6',  letterSpacing: '0em'   }],
        'label':       ['0.6875rem', { lineHeight: '1.5', letterSpacing: '0.15em'}],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
      },
      animation: {
        'marquee-continuous': 'marquee-continuous 25s linear infinite',
      },
      keyframes: {
        'marquee-continuous': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
