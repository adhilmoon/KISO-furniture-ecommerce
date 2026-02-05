/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        'kiso-bg': '#f5f0eb',
        'kiso-input': '#ebe4dc',
        'kiso-border': '#d4c9bf',
        'kiso-brown': '#8b7355',
        'kiso-brown-dark': '#75614a',
        'kiso-text': '#2c2c2c',
        'kiso-placeholder': '#9b8f82',
      }
    }
  },
  plugins: [],
}