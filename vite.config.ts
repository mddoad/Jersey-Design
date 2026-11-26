import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Forward /api/* to the Express checkout server during development
      '/api': {
        target: 'http://localhost:4242',
        changeOrigin: true,
      },
    },
  },
})