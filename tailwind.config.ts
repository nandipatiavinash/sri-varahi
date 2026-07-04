import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef6ee',
          100: '#fce9d4',
          200: '#f8cea3',
          300: '#f3ac68',
          400: '#ee8534',
          500: '#e2661a',
          600: '#c44f13',
          700: '#9d3b14',
          800: '#7f3116',
          900: '#682b15',
        },
        ink: {
          50: '#f6f7f8',
          100: '#eceef1',
          200: '#d5d9e0',
          300: '#b1b9c6',
          400: '#8691a4',
          500: '#677389',
          600: '#525c70',
          700: '#434b5c',
          800: '#39404d',
          900: '#1a1e26',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
