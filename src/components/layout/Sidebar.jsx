import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, ClipboardList,
  AlertTriangle, Wrench, Bus, Settings, X
} from 'lucide-react'

const navItems = [
  { to: '/',                label: 'Dashboard',           Icon: LayoutDashboard },
  { to: '/nueva-revision',  label: 'Nueva revisión',      Icon: PlusCircle },
  { to: '/registros',       label: 'Registros',           Icon: ClipboardList },
  { to: '/alertas',         label: 'Alertas / Tickets',   Icon: AlertTriangle },
  { to: '/srl',             label: 'Asistencia SRL',      Icon: Wrench },
  { to: '/buses',           label: 'Buses',               Icon: Bus },
  { to: '/configuracion',   label: 'Configuración',       Icon: Settings }
]

function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-64 bg-white border-r border-gray-100 shadow-xl
        flex flex-col transition-transform duration-300
        lg:translate-x-0 lg:shadow-none lg:z-auto
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bus size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">Revisión de Rack</p>
              <p className="text-xs text-gray-400">Control operacional</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">v1.0.0 · Sistema de Control de Racks</p>
        </div>
      </aside>
    </>
  )
}
