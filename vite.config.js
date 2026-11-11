import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy dùng chung cho `npm run dev` và `npm run preview`.
// Trình duyệt chỉ cần gọi cùng origin (cổng 5173), Vite chuyển tiếp sang các service phía sau,
// nên khi public web qua Tailscale Funnel chỉ cần mở MỘT cổng 5173.
const proxy = {
  // Trỏ các request /api sang backend Python (FastAPI)
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
  // Ảnh hiện vật admin tải lên (backend phục vụ thư mục backend-thuyet-minh/uploads/)
  '/uploads': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
  // Giọng đọc TTS: /tts/synthesize?... -> http://localhost:8001/synthesize?...
  '/tts': {
    target: 'http://localhost:8001',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/tts/, ''),
  },
}

// Tên miền được phép mở web ngoài localhost. '.ts.net' = mọi địa chỉ Tailscale (Funnel/Serve).
const allowedHosts = ['.ts.net']

export default defineConfig({
  plugins: [react()],
  server: {
    // Lắng nghe IPv4 vì Tailscale Funnel chuyển tiếp vào 127.0.0.1:5173
    // (mặc định Vite trên Windows có thể chỉ nghe ::1 -> Funnel báo 502 Bad Gateway).
    host: '127.0.0.1',
    port: 5173,
    allowedHosts,
    proxy,
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
    allowedHosts,
    proxy,
  },
})
