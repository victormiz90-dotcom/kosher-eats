/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // KosherEats — warm editorial palette: cream paper, navy ink, gold, kosher-green.
        brand: {
          50: '#f6f1e7', // warm paper (page background)
          100: '#e4dccb', // warm hairline borders
          500: '#5b6675', // muted ink (secondary text, placeholders)
          700: '#16263d', // navy ink (primary buttons, strong text)
          900: '#0f1d33' // deepest ink (headings, hover)
        },
        accent: {
          400: '#d8a24a',
          500: '#b9762a', // gold
          600: '#8f5a1f' // deep gold (text on light)
        },
        verify: {
          DEFAULT: '#2f7d54', // kosher green — verified hechsher
          soft: '#e2efe6'
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
};
