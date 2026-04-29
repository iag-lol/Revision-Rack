import { Menu, Bell, RefreshCw } from 'lucide-react'

export default function Header({ title, subtitle, onMenuToggle, actions }) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-3">
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-base lg:text-lg font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 truncate hidden sm:block">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </header>
  )
}
