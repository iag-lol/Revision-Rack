import { useState, useCallback } from 'react'

const toRad = (val) => (val * Math.PI) / 180

export const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const useGPS = () => {
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible en este dispositivo')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })
        setLoading(false)
      },
      (err) => {
        const messages = {
          1: 'Permiso de ubicación denegado',
          2: 'No se pudo obtener la ubicación',
          3: 'Tiempo de espera agotado para obtener ubicación'
        }
        setError(messages[err.code] || 'Error al obtener ubicación')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }, [])

  const detectarTerminal = useCallback((position, terminales) => {
    if (!position || !terminales?.length) return null
    let closest = null
    let minDistance = Infinity
    for (const terminal of terminales) {
      if (!terminal.latitud || !terminal.longitud || !terminal.activo) continue
      const dist = calcularDistancia(
        position.lat, position.lng,
        Number(terminal.latitud), Number(terminal.longitud)
      )
      if (dist <= (terminal.radio_metros || 300) && dist < minDistance) {
        minDistance = dist
        closest = terminal
      }
    }
    return closest
  }, [])

  return { position, loading, error, getPosition, detectarTerminal }
}
