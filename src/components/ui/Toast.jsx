import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const STYLES = {
  success: { bg: 'bg-green-50 border-green-200', icon: 'text-green-500', text: 'text-green-800', Icon: CheckCircle },
  error:   { bg: 'bg-red-50 border-red-200',     icon: 'text-red-500',   text: 'text-red-800',   Icon: XCircle },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-500', text: 'text-amber-800', Icon: AlertTriangle },
  info:    { bg: 'bg-blue-50 border-blue-200',   icon: 'text-blue-500',  text: 'text-blue-800',  Icon: Info }
}

function ToastItem({ id, message, type, onRemove }) {
  const s = STYLES[type] || STYLES.info
  const { Icon } = s
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${s.bg} min-w-72 max-w-sm`}>
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${s.icon}`} />
      <p className={`text-sm flex-1 font-medium ${s.text}`}>{message}</p>
      <button onClick={() => onRemove(id)} className={`flex-shrink-0 ${s.icon} hover:opacity-70 transition-opacity`}>
        <X size={16} />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts?.length) return null
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onRemove={onRemove} />
      ))}
    </div>
  )
}
