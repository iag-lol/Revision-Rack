import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, ClipboardList, AlertTriangle, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const mainItems = [
  { to: '/',               label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/nueva-revision', label: 'Revisar',   Icon: PlusCircle },
  { to: '/registros',      label: 'Registros', Icon: ClipboardList },
  { to: '/alertas',        label: 'Alertas',   Icon: AlertTriangle }
]

const moreItems = [
  { to: '/srl',           label: 'Asistencia SRL' },
  { to: '/buses',         label: 'Buses' },
  { to: '/configuracion', label: 'Configuración' }
]

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="fixed bottom-16 right-0 left-0 bg-white border-t border-gray-200 shadow-2xl z-50 pb-safe">
            {moreItems.map(item => (
              <button
                key={item.to}
                onClick={() => { navigate(item.to); setMoreOpen(false) }}
                className="w-full flex items-center px-6 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex lg:hidden pb-safe">
        {mainItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors
              ${isActive ? 'text-blue-600' : 'text-gray-500'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all
                  ${isActive ? 'bg-blue-100' : ''}`}>
                  <Icon size={20} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(v => !v)}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors
            ${moreOpen ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <div className={`w-7 h-7 flex items-center justify-center rounded-lg ${moreOpen ? 'bg-blue-100' : ''}`}>
            <MoreHorizontal size={20} />
          </div>
          <span>Más</span>
        </button>
      </nav>
    </>
  )
}
