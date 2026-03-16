/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#0a0c10',
        charcoal: '#13161d',
        smoke: '#1e222d',
        slate: {
          850: '#161b26',
        },
        bone: '#d1c7b7',
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e8d48b',
          dark: '#8a6d2b',
        },
        blood: '#8b2500',
        ice: {
          DEFAULT: '#a8c8d8',
          glow: '#d4eef8',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
