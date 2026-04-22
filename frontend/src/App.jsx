import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EmployeeAttendance from './pages/EmployeeAttendance'
import OutsourcedAttendance from './pages/OutsourcedAttendance'
import Vehicles from './pages/Vehicles'
import ServiceProviders from './pages/ServiceProviders'
import Consular from './pages/Consular'
import Packages from './pages/Packages'
import Reports from './pages/Reports'
import EmbassyInfo from './pages/EmbassyInfo'
import AdminEmployees from './pages/admin/AdminEmployees'
import AdminUsers from './pages/admin/AdminUsers'
import AdminVehicles from './pages/admin/AdminVehicles'
import AdminOutsourced from './pages/admin/AdminOutsourced'
import AuditLogs from './pages/admin/AuditLogs'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="funcionarios" element={<EmployeeAttendance />} />
        <Route path="terceirizados" element={<OutsourcedAttendance />} />
        <Route path="veiculos" element={<Vehicles />} />
        <Route path="prestadores" element={<ServiceProviders />} />
        <Route path="consular" element={<Consular />} />
        <Route path="encomendas" element={<Packages />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="informacoes" element={<EmbassyInfo />} />
        <Route path="admin/funcionarios" element={<PrivateRoute adminOnly><AdminEmployees /></PrivateRoute>} />
        <Route path="admin/usuarios" element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />
        <Route path="admin/veiculos" element={<PrivateRoute adminOnly><AdminVehicles /></PrivateRoute>} />
        <Route path="admin/terceirizados" element={<PrivateRoute adminOnly><AdminOutsourced /></PrivateRoute>} />
        <Route path="admin/auditoria" element={<PrivateRoute adminOnly><AuditLogs /></PrivateRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
