// keel-reborn/keel-web/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // The new v4 bridge

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Engines start here
  ],
  server: {
    port: 5173,
    host: true
  }
})