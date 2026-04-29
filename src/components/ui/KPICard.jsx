import { TrendingUp, TrendingDown } from 'lucide-react'

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   value: 'text-blue-700'  },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', value: 'text-green-700' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     value: 'text-red-700'   },
  amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600', value: 'text-amber-700' },
  sky:    { bg: 'bg-sky-50',    icon: 'bg-sky-100 text-sky-600',     value: 'text-sky-700'   },
  violet: { bg: 'bg-violet-50', icon: 'bg-violet-100 text-violet-600', value: 'text-violet-700' },
  gray:   { bg: 'bg-gray-50',   icon: 'bg-gray-100 text-gray-600',   value: 'text-gray-700'  }
}

export default function KPICard({ title, value, subtitle, icon: Icon, color = 'blue', trend, onClick }) {
  const styles = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <div
      className={`card p-5 transition-all duration-150 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{title}</p>
          <p className={`text-3xl font-bold mt-1.5 ${styles.value}`}>{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(trend)}% vs semana anterior</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${styles.icon}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}
