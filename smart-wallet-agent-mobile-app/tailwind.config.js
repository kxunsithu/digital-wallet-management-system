// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#BDF40B',
        secondary: '#10110E',
        background: '#0A0B09',
        surface: '#161814',
        text: '#FFFFFF',
        textSecondary: '#C7C7C7',
        border: '#2F332B',
        error: '#FF4D4F',
        success: '#52C41A',
      }
    },
  },
  plugins: [],
}