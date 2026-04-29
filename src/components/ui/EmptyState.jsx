export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
      )}
      <p className="text-base font-semibold text-gray-600">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
