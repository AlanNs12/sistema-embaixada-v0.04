import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Users, Car, Truck, Package, ClipboardList,
  BarChart2, Info, LogOut, Menu, X, ChevronDown, ChevronRight,
  Shield, UserCog, Settings, BookOpen, ScrollText
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/funcionarios', icon: Users, label: 'Funcionários' },
  { to: '/terceirizados', icon: UserCog, label: 'Terceirizados' },
  { to: '/veiculos', icon: Car, label: 'Veículos' },
  { to: '/prestadores', icon: Truck, label: 'Prestadores' },
  { to: '/consular', icon: ClipboardList, label: 'Atend. Consular' },
  { to: '/encomendas', icon: Package, label: 'Encomendas' },
  { to: '/relatorios', icon: BarChart2, label: 'Relatórios' },
  { to: '/informacoes', icon: Info, label: 'Informações' },
]

const adminItems = [
  { to: '/admin/funcionarios', icon: Users, label: 'Funcionários' },
  { to: '/admin/usuarios', icon: Shield, label: 'Usuários' },
  { to: '/admin/veiculos', icon: Car, label: 'Veículos' },
  { to: '/admin/terceirizados', icon: UserCog, label: 'Terceirizados' },
  { to: '/admin/auditoria', icon: ScrollText, label: 'Auditoria' },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Sistema</p>
            <p className="text-xs text-gray-500">Embaixada</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <div className="pt-3">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="sidebar-link-inactive w-full justify-between"
            >
              <span className="flex items-center gap-3">
                <Settings size={18} />
                <span>Administração</span>
              </span>
              {adminOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {adminOpen && (
              <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-gray-200 pl-3">
                {adminItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link-inactive w-full text-red-600 hover:bg-red-50">
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-gray-200 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white h-full z-50 flex flex-col">
            <button className="absolute top-4 right-4" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-600" />
            <span className="font-bold text-sm">Sistema Embaixada</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
