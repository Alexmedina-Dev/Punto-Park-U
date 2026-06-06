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
        bg: '#10131a',
        surface: '#10131a',
        'surface-low': '#191b23',
        'surface-container': '#1d1f27',
        'surface-high': '#272a32',
        'surface-highest': '#32353d',
        'surface-variant': '#32353d',
        primary: '#a7c8ff',
        'primary-fixed': '#d5e3ff',
        'primary-fixed-dim': '#a7c8ff',
        'primary-container': '#0074d9',
        'on-primary': '#003060',
        'on-primary-container': '#fdfbff',
        secondary: '#afc8f0',
        'secondary-container': '#2f486a',
        'on-bg': '#e1e2ec',
        'on-surface': '#e1e2ec',
        'on-surface-var': '#c1c6d5',
        outline: '#8b919e',
        'outline-var': '#414753',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        brutal: '0 20px 40px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(167, 200, 255, 0.3)',
      },
      keyframes: {
        'pulse-red': {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '70%': { transform: 'scale(1)', boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-red': 'pulse-red 2s infinite',
        'spin-custom': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
