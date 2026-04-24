import axios from 'axios'

/**
 * URL base da API — lida exclusivamente do .env.local (nunca hardcoded)
 *
 * Desenvolvimento:  VITE_API_URL=http://localhost:3001/api  no .env.local
 * Produção (Nginx): VITE_API_URL=/api                       no .env.local do servidor
 * Produção (outro): VITE_API_URL=http://IP_SERVIDOR/api     no .env.local do servidor
 */
const BASE_URL = import.meta.env.VITE_API_URL

if (!BASE_URL) {
  console.warn(
    '[Embassy] VITE_API_URL não definida no .env.local — ' +
    'crie o arquivo frontend/.env.local com VITE_API_URL=http://localhost:3001/api'
  )
}

const api = axios.create({
  baseURL: BASE_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
