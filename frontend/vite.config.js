import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
  server: {
    // Let the target return its real status for OPTIONS, including retired URLs.
    cors: { preflightContinue: true },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/update_chart': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/get_date_data': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Retired URLs must reach Django's 404 instead of Vite's SPA fallback.
      '^/chatbot(?:/|$|[?])': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
