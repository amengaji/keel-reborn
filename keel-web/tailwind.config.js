// keel-reborn/keel-web/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // UX Note: This tells Tailwind to look at all our files to apply the company colors
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Maritime Expert Note: 'class' strategy is best for manual toggle between 
  // Day (Light) and Night (Dark) mode on the bridge.
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        // YOUR PRIMARY COMPANY COLOUR
        primary: {
          DEFAULT: '#3194A0',
          dark: '#26737D', // Slightly darker shade for hover states
          light: '#4CBAC6', // Slightly lighter for subtle UI elements
        },
        // Professional maritime slate palette for background and text
        secondary: '#1E293B', 
      },
    },
  },
  plugins: [],
}