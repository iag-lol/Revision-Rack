import * as XLSX from 'xlsx'
import { formatDate, formatTime } from '../utils/dateUtils'
import { motivo_sin_disco_label } from '../utils/formatters'

export const exportRevisionesToXLSX = (revisiones, filename) => {
  const rows = revisiones.map(r => ({
    'Fecha Revisión': formatDate(r.fecha_revision),
    'Hora': formatTime(r.hora_revision),
    'PPU': r.ppu || r.buses?.ppu || '',
    'N° Interno': r.numero_interno || r.buses?.numero_interno || '',
    'Modelo': r.modelos_bus?.nombre || '',
    'Terminal': r.terminales?.nombre || '',
    'Tiene Disco': r.tiene_disco ? 'Sí' : 'No',
    'Motivo Sin Disco': r.tiene_disco ? '' : motivo_sin_disco_label(r.motivo_sin_disco),
    'Tiene Candado': r.tiene_candado ? 'Sí' : 'No',
    'Seguridad Extra': r.tiene_seguridad_extra ? 'Sí' : 'No',
    'Cerraduras Malas': r.cantidad_cerraduras_malas || 0,
    'Detalle Cerraduras': (r.revision_cerraduras || [])
      .filter(c => c.estado === 'MALA')
      .map(c => c.nombre_cerradura)
      .join(', ') || '',
    'Observación': r.observacion || '',
    'Usuario': r.usuario_id || ''
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Revisiones')

  const colWidths = [
    { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 30 }, { wch: 40 }, { wch: 20 }
  ]
  ws['!cols'] = colWidths

  const ts = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `${filename || 'revision_rack'}_${ts}.xlsx`)
}

export const exportTicketsToXLSX = (tickets) => {
  const rows = tickets.map(t => ({
    'Código': t.codigo,
    'PPU': t.ppu,
    'N° Interno': t.numero_interno,
    'Modelo': t.modelos_bus?.nombre || '',
    'Terminal': t.terminales?.nombre || '',
    'Fecha Alerta': formatDate(t.fecha_alerta),
    'Hora': formatTime(t.hora_alerta),
    'Último con Disco': formatDate(t.ultima_fecha_con_disco),
    'Estado': t.estado,
    'Impacto Estimado': t.impacto_estimado || 0,
    'Observación': t.observacion || '',
    'Fecha Cierre': t.fecha_cierre ? formatDate(t.fecha_cierre.split('T')[0]) : ''
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tickets')
  const ts = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `tickets_robo_${ts}.xlsx`)
}
