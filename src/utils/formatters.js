export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(num)
}

export const formatNumber = (value) => {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-CL').format(value)
}

export const generateTicketCode = () => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `TKT-${year}${month}${day}-${rand}`
}

export const motivo_sin_disco_label = (motivo) => {
  const map = {
    RETIRADO_SRL: 'Retirado por SRL',
    POSIBLE_ROBO: 'Posible robo',
    DESCONOCIDO: 'Desconocido',
    SIN_INSTALAR: 'Sin instalar'
  }
  return map[motivo] || motivo || '—'
}

export const estado_srl_label = (estado) => {
  const map = {
    PENDIENTE_ENVIO: 'Pendiente envío',
    ENVIADO_SRL: 'Enviado a SRL',
    EN_REPARACION: 'En reparación',
    RECIBIDO_SRL: 'Recibido desde SRL',
    REPUESTO_BUS: 'Repuesto en bus',
    CERRADO: 'Cerrado'
  }
  return map[estado] || estado || '—'
}

export const estado_ticket_label = (estado) => {
  const map = {
    ABIERTO: 'Abierto',
    EN_REVISION: 'En revisión',
    CERRADO: 'Cerrado',
    DESCARTADO: 'Descartado'
  }
  return map[estado] || estado || '—'
}

export const nivel_riesgo_label = (nivel) => {
  const map = {
    BAJO: 'Bajo',
    MEDIO: 'Medio',
    ALTO: 'Alto',
    CRITICO: 'Crítico'
  }
  return map[nivel] || nivel || '—'
}
