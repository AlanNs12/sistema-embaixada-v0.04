import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env.local / .env
  const env = loadEnv(mode, process.cwd(), '')

  // Endereço do backend lido do .env — sem hardcode de IP
  const backendHost = env.VITE_BACKEND_HOST || 'localhost'
  const backendPort = env.VITE_BACKEND_PORT || '3001'
  const backendURL  = `http://${backendHost}:${backendPort}`

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Todas as chamadas /api são redirecionadas para o backend
        '/api': {
          target: backendURL,
          changeOrigin: true,
          secure: false,
        },
        // Imagens servidas pelo backend (legado — agora usamos DB)
        '/uploads': {
          target: backendURL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
