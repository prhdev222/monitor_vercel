/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'thai': ['THSarabunNew', 'Inter', 'system-ui', 'sans-serif'],
        'sans': ['THSarabunNew', 'Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
      },
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        temple: {
          50: '#fefdf8',
          100: '#fef7e0',
          200: '#fdecc2',
          300: '#fbdd9a',
          400: '#f8c96b',
          500: '#f5b041',
          600: '#d4941a',
          700: '#a67515',
          800: '#8a5f12',
          900: '#6d4a0e',
        },
      },
    },
  },
  plugins: [],
}
