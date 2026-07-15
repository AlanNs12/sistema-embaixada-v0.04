import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  LayoutDashboard, Users, Car, Truck, Package, ClipboardList,
  BarChart2, Info, LogOut, Menu, X, ChevronDown, ChevronRight,
  Shield, UserCog, Settings, ScrollText, Sun, Moon, UserCheck, KeyRound
} from 'lucide-react'
import logo from '../../public/images/logo-emblem.png';
import ChangePasswordModal from './ChangePasswordModal'

const navItems = [
  { to: '/',             icon: LayoutDashboard, labelKey: 'nav_dashboard',       exact: true },
  { to: '/funcionarios', icon: Users,           labelKey: 'nav_employees' },
  { to: '/terceirizados',icon: UserCog,         labelKey: 'nav_outsourced' },
  { to: '/veiculos',     icon: Car,             labelKey: 'nav_vehicles' },
  { to: '/prestadores',  icon: Truck,           labelKey: 'nav_providers' },
  { to: '/visitantes',   icon: UserCheck,       labelKey: 'nav_visitors' },
  { to: '/consular',     icon: ClipboardList,   labelKey: 'nav_consular' },
  { to: '/encomendas',   icon: Package,         labelKey: 'nav_packages' },
  { to: '/relatorios',   icon: BarChart2,       labelKey: 'nav_reports' },
  { to: '/informacoes',  icon: Info,            labelKey: 'nav_info' },
]

const adminItems = [
  { to: '/admin/funcionarios',  icon: Users,     labelKey: 'admin_employees' },
  { to: '/admin/usuarios',      icon: Shield,    labelKey: 'admin_users' },
  { to: '/admin/veiculos',      icon: Car,       labelKey: 'admin_vehicles' },
  { to: '/admin/terceirizados', icon: UserCog,   labelKey: 'admin_outsourced' },
  { to: '/admin/auditoria',     icon: ScrollText,labelKey: 'admin_audit' },
]

const ROLE_KEY = { super_admin: 'role_super_admin', admin: 'role_admin', porteiro: 'role_porteiro', viewer: 'role_viewer' }

function SidebarContent({ onClose, isMobile }) {
  const { t, i18n } = useTranslation('layout')
  const { t: ta } = useTranslation('auth')
  const { user, logout, isAdmin } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [adminOpen, setAdminOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const toggleLanguage = () => {
    const next = i18n.language === 'pt-BR' ? 'en-US' : 'pt-BR'
    i18n.changeLanguage(next)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className={`px-4 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between${isMobile ? ' pr-12' : ''}`}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-15 h-20 object-cover" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{t('title')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
          </div>
        </div>
        <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 shrink-0">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Language selector */}
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          <button
            onClick={() => i18n.changeLanguage('pt-BR')}
            aria-label="Mudar para Português"
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              i18n.language === 'pt-BR'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Português
          </button>
          <button
            onClick={() => i18n.changeLanguage('en-US')}
            aria-label="Switch to English"
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              i18n.language === 'en-US'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, labelKey, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
            onClick={onClose}>
            <Icon size={18} /><span>{t(labelKey)}</span>
          </NavLink>
        ))}
        {isAdmin && (
          <div className="pt-3">
            <button onClick={() => setAdminOpen(!adminOpen)} className="sidebar-link-inactive w-full justify-between">
              <span className="flex items-center gap-3"><Settings size={18} /><span>{t('nav_administration')}</span></span>
              {adminOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {adminOpen && (
              <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                {adminItems.map(({ to, icon: Icon, labelKey }) => (
                  <NavLink key={to} to={to}
                    className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
                    onClick={onClose}>
                    <Icon size={16} /><span>{t(labelKey)}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 dark:text-blue-300 font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t(ROLE_KEY[user?.role] || user?.role)}</p>
          </div>
          <button
            onClick={() => setPwOpen(true)}
            title={ta('change_password_tooltip')}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
          >
            <KeyRound size={15} />
          </button>
        </div>
        <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
        <button onClick={handleLogout} className="sidebar-link-inactive w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut size={16} /><span>{ta('logout')}</span>
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const { t } = useTranslation('layout')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.lang = navigator.language.startsWith('pt') ? 'pt-BR' : 'en'
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="hidden lg:flex w-60 flex-col">
        <SidebarContent onClose={() => {}} isMobile={false} />
      </aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full z-50 flex flex-col">
            <button className="absolute top-4 right-4 z-10 text-gray-500" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            <SidebarContent onClose={() => setSidebarOpen(false)} isMobile={true} />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}><Menu size={22} className="text-gray-700 dark:text-gray-300" /></button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-13 object-cover" />
            <span className="font-bold text-sm dark:text-white">{t('title')}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
