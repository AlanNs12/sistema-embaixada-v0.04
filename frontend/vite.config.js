import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: [
      'embassyphilippines.duckdns.org'
    ],
    proxy: {
      '/api': {
        target: `http://${process.env.IP}:3001`,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: `http://${process.env.IP}:3001`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
