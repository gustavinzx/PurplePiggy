/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Canônico design/tokens.md
        bg: '#F8F5FC',
        'bg-app': '#F8F5FC',
        'bg-app-top': '#F6EEFF',
        'bg-app-bottom': '#E9D8FF',
        'bg-blob-lilac': '#EEDEFB',
        'bg-blob-baby': '#DEEEFC',
        
        'card-white': '#FFFFFF',
        'card-baby': '#DEEEFC',
        'card-lilac': '#F8E9FE',
        'card-glass-bg': 'rgba(255, 255, 255, 0.85)',
        'card-glass-border': 'rgba(216, 194, 255, 0.5)',
        'card-saldo-start': '#8E32D8',
        'card-saldo-end': '#521D83',

        primary: {
          DEFAULT: '#B037F8',
          dark: '#7D2BD6',
          light: '#CF91F6',
        },
        'primary-dark': '#7D2BD6',
        'primary-light': '#CF91F6',
        
        // Botão Primário
        'btn-primary-start': '#7D2BD6',
        'btn-primary-end': '#B037F8',
        'btn-primary-start-user': '#5B21B6',
        'btn-primary-end-user': '#7E3AD9',

        // Botão Secundário / Outline
        'btn-secondary-border': '#6D28C9',
        'btn-secondary-text': '#5B21B6',
        
        // Wordmark
        'brand-purple': '#432171',
        'brand-purple-user': '#4A1D96',
        'brand-piggy-start': '#8E2DE2',
        'brand-piggy-end': '#C026D3',

        lilac: '#CF91F6',
        deep: '#432171',
        'deep-user': '#3B1A78',
        textSec: '#7D6A9C',
        'textSec-user': '#6B5A8E',

        pink: {
          DEFAULT: '#FF79A8',
          hover: '#FF6096',
        },
        baby: '#DEEEFC',
        gold: {
          DEFAULT: '#FEDA70',
          star: '#FBBF24',
          coin: '#F5B83D',
        },
        'gold-star': '#FBBF24',
        'gold-coin': '#F5B83D',

        positive: {
          DEFAULT: '#15803D',
          bg: '#DCFCE7',
          user: '#2FBF71',
          'bg-user': '#DDF7E8',
        },
        'positive-text': '#15803D',
        'positive-bg': '#DCFCE7',

        negative: {
          DEFAULT: '#E5487A',
          bg: '#FCE7F3',
          text: '#BE185D',
        },
        'negative-text': '#BE185D',
        'negative-bg': '#FCE7F3',

        danger: '#E5487A',
        'danger-bg': '#FCE7F3',
        'danger-text': '#BE185D',

        success: '#15803D',
        'success-bg': '#DCFCE7',

        border: {
          input: '#E8DEFB',
          card: '#F0EBF8',
          divider: '#F3EBF9',
          glass: 'rgba(216, 194, 255, 0.5)',
        },
        'border-input': '#E8DEFB',
        'border-card': '#F0EBF8',
        'border-divider': '#F3EBF9',

        nav: {
          active: '#7D2BD6',
          inactive: '#9CA3AF',
          border: '#F0E8F8',
        },
        'nav-active': '#7D2BD6',
        'nav-inactive': '#9CA3AF',
        'nav-border': '#F0E8F8',

        progress: {
          track: '#F0E7FA',
          fill: '#7D2BD6',
        },
        'progress-track': '#F0E7FA',
        'progress-fill': '#7D2BD6',

        'ring-track': '#EADFFB',
        'ring-track-light': '#F0E7FA',
        'ring-goal-start': '#F5B83D',
        'ring-goal-end': '#F08A3C',

        cat: {
          housing: '#7D2BD6',
          food: '#FF79A8',
          transport: '#60A5FA',
          leisure: '#FEDA70',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'card': '24px',
        'card-sm': '20px',
        'input': '16px',
        'pill': '9999px',
        'nav': '28px',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(67, 33, 113, 0.05)',
        'card-saldo': '0 10px 25px -5px rgba(125, 43, 214, 0.28)',
        'button': '0 4px 14px 0 rgba(176, 55, 248, 0.35)',
        'nav': '0 -2px 10px rgba(67, 33, 113, 0.04)',
        'glass': '0 8px 32px 0 rgba(109, 40, 201, 0.08)',
        'soft': '0 8px 30px rgba(176, 55, 248, 0.08)',
      }
    },
  },
  plugins: [],
}
