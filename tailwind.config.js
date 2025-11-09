/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.html",
    "./src/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5E7D7E',
        background: '#F4F0EB',
        text: '#2F3A3D',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}