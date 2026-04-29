import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Bus, Plus, Loader2 } from 'lucide-react'
import { searchBuses } from '../../services/busService'

export default function BusAutocomplete({ label, field = 'ppu', value, onChange, onBusSelect, placeholder, disabled }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q) => {
    if (!q || q.length < 1) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const data = await searchBuses(q, field)
      setResults(data)
      setOpen(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [field])

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase()
    setQuery(val)
    onChange?.(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 250)
  }

  const handleSelect = (bus) => {
    setQuery(bus[field] || '')
    onChange?.(bus[field] || '')
    onBusSelect?.(bus)
    setOpen(false)
    setResults([])
  }

  const handleNewBus = () => {
    onBusSelect?.({ [field]: query, _isNew: true })
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length > 0 && setOpen(true)}
          placeholder={placeholder || `Buscar por ${field.toUpperCase()}`}
          disabled={disabled}
          className="input pl-9"
        />
      </div>
      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          {results.length > 0 ? (
            <ul className="max-h-52 overflow-y-auto divide-y divide-gray-50">
              {results.map(bus => (
                <li
                  key={bus.id}
                  onClick={() => handleSelect(bus)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bus size={15} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{bus.ppu}</p>
                    <p className="text-xs text-gray-500">
                      N° {bus.numero_interno} · {bus.modelos_bus?.nombre || 'Sin modelo'} · {bus.terminales?.nombre || 'Sin terminal'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">No se encontraron buses con "{query}"</div>
          )}
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleNewBus}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors border-t border-gray-100"
            >
              <Plus size={16} />
              Crear bus "{query}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}
