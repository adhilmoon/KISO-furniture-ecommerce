/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg1: '#0A0A0A',
          bg2: '#111111',
          light: '#F8F9FA',
          muted: '#A3A3A3',
          accent: '#D4AF37',
        },
        kiso: {
          bg: '#0A0A0A',
          brown: '#D4AF37',
          text: '#F8F9FA',
          primary: '#111111',
        }
      }
    }
  },
  plugins: [],
}
