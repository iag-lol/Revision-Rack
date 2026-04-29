import { useEffect } from 'react'
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useGPS } from '../../hooks/useGPS'

export default function GPSTerminalDetector({ terminales, onDetected, detectedTerminal }) {
  const { position, loading, error, getPosition, detectarTerminal } = useGPS()

  // Auto-detect on mount
  useEffect(() => {
    getPosition()
  }, []) // eslint-disable-line

  useEffect(() => {
    if (position && terminales?.length) {
      const terminal = detectarTerminal(position, terminales)
      onDetected?.(terminal, position)
    }
  }, [position, terminales, detectarTerminal, onDetected])

  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3
      ${detectedTerminal ? 'bg-green-50 border-green-200' : error ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${detectedTerminal ? 'bg-green-100' : error ? 'bg-amber-100' : 'bg-blue-100'}`}>
        {loading
          ? <Loader2 size={16} className="text-blue-600 animate-spin" />
          : <MapPin size={16} className={detectedTerminal ? 'text-green-600' : error ? 'text-amber-600' : 'text-blue-600'} />
        }
      </div>
      <div className="flex-1 min-w-0">
        {loading ? (
          <p className="text-xs text-blue-700 font-medium">Detectando ubicación...</p>
        ) : detectedTerminal ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-700">Terminal detectado: {detectedTerminal.nombre}</p>
          </div>
        ) : error ? (
          <p className="text-xs text-amber-700">{error} — selecciona el terminal manualmente</p>
        ) : (
          <p className="text-xs text-gray-500">Sin terminal detectado — selecciona manualmente</p>
        )}
      </div>
    </div>
  )
}
