import { createContext, useContext, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const isAdmin     = user?.role === 'super_admin' || user?.role === 'admin'
  const isSuperAdmin= user?.role === 'super_admin'
  const isViewer    = user?.role === 'viewer'
  const canEdit     = !isViewer  // porteiro, admin, super_admin podem editar

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isSuperAdmin, isViewer, canEdit }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
