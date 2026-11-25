import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // API_URL lets a second instance point to another API (default: the local server).
      '/api': process.env.API_URL ?? 'http://localhost:3001',
    },
  },
})
