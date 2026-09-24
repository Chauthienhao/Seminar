/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF7EF',
        paper: '#F6F1E7',
        ink: '#1B2340',
        'ink-soft': '#3B4262',
        navy: {
          DEFAULT: '#16213E',
          800: '#1B2A4A',
          900: '#101830',
        },
        maroon: {
          DEFAULT: '#A6321E',
          600: '#B8401F',
          700: '#8C2818',
        },
        sand: '#E8DFC9',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', '"Noto Serif"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Noto Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1240px',
      },
    },
  },
  plugins: [],
}
