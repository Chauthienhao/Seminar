import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'leaflet', 'react-leaflet', '@react-leaflet/core'],
  },
  server: {
    port: 5173,
    proxy: {
      // Trỏ các request /api sang backend Python (FastAPI/Flask) khi phát triển cục bộ
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
