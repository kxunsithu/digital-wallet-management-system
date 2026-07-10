import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://smart-wallet-api-vm58.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
