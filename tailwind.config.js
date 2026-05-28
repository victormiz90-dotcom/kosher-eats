/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // KosherEats brand palette — deep navy/gold, evokes trust + tradition
        brand: {
          50: '#f5f7fa',
          100: '#e4e9f2',
          500: '#3b5998',
          700: '#1e3a5f',
          900: '#0f1e35'
        },
        accent: {
          // gold for hechsher badges, premium feel
          400: '#d4a44c',
          500: '#b88a2e',
          600: '#9a7222'
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};
