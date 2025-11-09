/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./src/*.{html,js,jsx,ts,tsx}",
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
}