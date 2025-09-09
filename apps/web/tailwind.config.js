/** @type {import('tailwindcss').Config} */
const sharedPreset = require('@xad/styles/tailwind-preset')

module.exports = {
  presets: [sharedPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}", // Include UI components
  ],
  plugins: [require("tailwindcss-animate")],
}