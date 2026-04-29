export default function FormSection({ title, description, children, icon: Icon }) {
  return (
    <div className="card">
      <div className={`px-6 py-4 border-b border-gray-50 ${Icon ? 'flex items-center gap-3' : ''}`}>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-blue-600" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export function ToggleGroup({ label, value, onChange, options, required }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition-all duration-150
              ${value === opt.value
                ? opt.activeClass || 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function YesNoToggle({ label, value, onChange, required, yesLabel = 'Sí', noLabel = 'No' }) {
  return (
    <ToggleGroup
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      options={[
        { value: true,  label: yesLabel, activeClass: 'border-green-500 bg-green-500 text-white' },
        { value: false, label: noLabel,  activeClass: 'border-red-500 bg-red-500 text-white' }
      ]}
    />
  )
}
