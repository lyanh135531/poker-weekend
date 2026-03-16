/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,tsx,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          green: '#1a472a',
          'green-dark': '#0d2415',
          felt: '#2d5a27',
          gold: '#d4af37'
        }
      },
      backgroundImage: {
        'poker-felt': "radial-gradient(circle, #2d5a27 0%, #1a472a 100%)",
      }
    },
  },
  plugins: [],
}
