/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B037F8',
          dark: '#7D2BD6',
          light: '#CF91F6',
        },
        lilac: '#CF91F6',
        deep: '#432171',
        pink: {
          DEFAULT: '#FF79A8',
          hover: '#FF6096',
        },
        baby: '#DEEEFC',
        gold: '#FEDA70',
        bg: '#F8F5FC',
        danger: '#E5487A',
        success: '#10B981',
        textSec: '#7D6A9C',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'card': '22px',
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(176, 55, 248, 0.08)',
        'button': '0 4px 14px rgba(125, 43, 214, 0.28)',
        'card': '0 4px 20px rgba(67, 33, 113, 0.05)',
      }
    },
  },
  plugins: [],
}
