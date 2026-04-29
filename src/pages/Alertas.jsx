import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, Search, Filter, Download, X,
  Copy, CheckCircle, Clock, XCircle, Eye
} from 'lucide-react'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { TicketBadge } from '../components/ui/StatusBadge'
import { getTickets, getTicketById, updateTicket, cerrarTicket } from '../services/ticketService'
import { getTerminales, getModelosBus } from '../services/configService'
import { exportTicketsToXLSX } from '../services/exportService'
import { formatDate, formatTime, formatRelative } from '../utils/dateUtils'
import { formatCurrency, estado_ticket_label } from '../utils/formatters'

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'ABIERTO', label: 'Abiertos' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'CERRADO', label: 'Cerrados' },
  { value: 'DESCARTADO', label: 'Descartados' }
]

const BORDER_COLORS = {
  ABIERTO: 'border-red-300',
  EN_REVISION: 'border-amber-300',
  CERRADO: 'border-green-300',
  DESCARTADO: 'border-gray-200'
}

const BG_COLORS = {
  ABIERTO: 'bg-red-50',
  EN_REVISION: 'bg-amber-50',
  CERRADO: 'bg-green-50',
  DESCARTADO: 'bg-gray-50'
}

export default function Alertas({ onMenuToggle, toast }) {
  const [tickets, setTickets] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [terminales, setTerminales] = useState([])
  const [modelos, setModelos] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [closeForm, setCloseForm] = useState({ observacion_cierre: '', usuario_cierra: 'supervisor' })
  const [saving, setSaving] = useState(false)

  const [filters, setFilters] = useState({ estado: 'ABIERTO', search: '', terminal_id: '', modelo_id: '', fecha_desde: '', fecha_hasta: '' })
  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await getTickets({ ...filters, limit: 100 })
      setTickets(data)
      setCount(count)
    } catch (e) {
      toast?.error('Error al cargar tickets')
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  useEffect(() => { load() }, [filters.estado])

  useEffect(() => {
    Promise.all([getTerminales(), getModelosBus()]).then(([t, m]) => {
      setTerminales(t); setModelos(m)
    }).catch(console.error)
  }, [])

  const handleOpenDetail = async (ticket) => {
    const detail = await getTicketById(ticket.id)
    setSelectedTicket(detail)
    setShowDetail(true)
  }

  const handleUpdateEstado = async (id, estado) => {
    setSaving(true)
    try {
      await updateTicket(id, { estado })
      toast?.success(`Ticket actualizado a: ${estado_ticket_label(estado)}`)
      load()
      setShowDetail(false)
    } catch (e) {
      toast?.error('Error al actualizar ticket')
    } finally {
      setSaving(false)
    }
  }

  const handleCerrar = async () => {
    if (!closeForm.observacion_cierre.trim()) {
      toast?.error('La observación de cierre es obligatoria')
      return
    }
    setSaving(true)
    try {
      await cerrarTicket(selectedTicket.id, closeForm)
      toast?.success('Ticket cerrado correctamente')
      load()
      setShowClose(false)
      setShowDetail(false)
    } catch (e) {
      toast?.error('Error al cerrar ticket')
    } finally {
      setSaving(false)
    }
  }

  const copyResumen = (ticket) => {
    const text = `ALERTA CRÍTICA - POSIBLE ROBO DE DISCO
Código: ${ticket.codigo}
Bus: ${ticket.ppu} (N° ${ticket.numero_interno})
Terminal: ${ticket.terminales?.nombre || '—'}
Modelo: ${ticket.modelos_bus?.nombre || '—'}
Fecha detección: ${formatDate(ticket.fecha_alerta)} ${formatTime(ticket.hora_alerta)}
Último con disco: ${formatDate(ticket.ultima_fecha_con_disco)}
Impacto estimado: ${formatCurrency(ticket.impacto_estimado)}
Observación: ${ticket.observacion}
Estado: ${estado_ticket_label(ticket.estado)}`
    navigator.clipboard.writeText(text).then(() => toast?.success('Resumen copiado al portapapeles'))
  }

  const handleExport = async () => {
    try {
      const { data } = await getTickets({ ...filters, limit: 9999 })
      exportTicketsToXLSX(data)
      toast?.success('Exportado correctamente')
    } catch (e) {
      toast?.error('Error al exportar')
    }
  }

  const abiertos = tickets.filter(t => t.estado === 'ABIERTO').length
  const en_revision = tickets.filter(t => t.estado === 'EN_REVISION').length
  const cerrados = tickets.filter(t => t.estado === 'CERRADO').length

  return (
    <div>
      <Header
        title="Alertas / Tickets de Robo"
        subtitle="Control de posibles robos de discos de grabación"
        onMenuToggle={onMenuToggle}
        actions={
          <button onClick={handleExport} className="btn btn-secondary btn-sm">
            <Download size={14} />
            <span className="hidden sm:inline">XLSX</span>
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Estado tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ESTADOS.map(e => (
            <button
              key={e.value}
              onClick={() => setF('estado', e.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${filters.estado === e.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Counters */}
        <div className="flex flex-wrap gap-2">
          <span className="badge bg-red-100 text-red-700 border border-red-200">Abiertos: {abiertos}</span>
          <span className="badge bg-amber-100 text-amber-700 border border-amber-200">En revisión: {en_revision}</span>
          <span className="badge bg-green-100 text-green-700 border border-green-200">Cerrados: {cerrados}</span>
          <span className="badge bg-gray-100 text-gray-600 border border-gray-200">Total: {count}</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por código, PPU o número interno..."
            value={filters.search}
            onChange={e => setF('search', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
        </div>

        {/* Tickets */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Sin tickets"
            description={filters.estado ? `No hay tickets con estado "${estado_ticket_label(filters.estado)}"` : 'No se encontraron tickets'}
          />
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className={`card border-l-4 ${BORDER_COLORS[ticket.estado] || 'border-gray-300'} p-5 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{ticket.codigo}</span>
                      <TicketBadge estado={ticket.estado} />
                    </div>

                    {ticket.estado === 'ABIERTO' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-red-700 uppercase tracking-wide">ALERTA CRÍTICA · POSIBLE ROBO DE DISCO</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm mt-1">
                      <div><span className="text-gray-500">Bus:</span> <span className="font-bold text-gray-900">{ticket.ppu}</span></div>
                      <div><span className="text-gray-500">N° interno:</span> <span className="font-semibold">{ticket.numero_interno}</span></div>
                      <div><span className="text-gray-500">Terminal:</span> <span className="font-medium">{ticket.terminales?.nombre || '—'}</span></div>
                      <div><span className="text-gray-500">Modelo:</span> <span>{ticket.modelos_bus?.nombre || '—'}</span></div>
                      <div><span className="text-gray-500">Detección:</span> <span>{formatDate(ticket.fecha_alerta)} {formatTime(ticket.hora_alerta)}</span></div>
                      <div><span className="text-gray-500">Último c/disco:</span> <span className="text-amber-700 font-medium">{formatDate(ticket.ultima_fecha_con_disco)}</span></div>
                    </div>

                    {ticket.impacto_estimado > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-red-700">Impacto estimado:</span>
                        <span className="text-sm font-bold text-red-700">{formatCurrency(ticket.impacto_estimado)}</span>
                      </div>
                    )}

                    {ticket.observacion && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{ticket.observacion}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleOpenDetail(ticket)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye size={14} />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                    <button
                      onClick={() => copyResumen(ticket)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Copy size={14} />
                      <span className="hidden sm:inline">Copiar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket detail modal */}
      {selectedTicket && (
        <Modal
          open={showDetail}
          onClose={() => setShowDetail(false)}
          title={`Ticket ${selectedTicket.codigo}`}
          size="lg"
          footer={
            <div className="flex flex-wrap gap-2 w-full justify-between">
              <div className="flex gap-2">
                {selectedTicket.estado === 'ABIERTO' && (
                  <button
                    onClick={() => handleUpdateEstado(selectedTicket.id, 'EN_REVISION')}
                    disabled={saving}
                    className="btn btn-warning btn-sm"
                  >
                    <Clock size={14} /> En revisión
                  </button>
                )}
                {['ABIERTO', 'EN_REVISION'].includes(selectedTicket.estado) && (
                  <>
                    <button
                      onClick={() => { setShowClose(true) }}
                      className="btn-success btn-sm"
                    >
                      <CheckCircle size={14} /> Cerrar ticket
                    </button>
                    <button
                      onClick={() => handleUpdateEstado(selectedTicket.id, 'DESCARTADO')}
                      disabled={saving}
                      className="btn btn-secondary btn-sm"
                    >
                      <XCircle size={14} /> Descartar
                    </button>
                  </>
                )}
              </div>
              <button onClick={() => copyResumen(selectedTicket)} className="btn btn-secondary btn-sm">
                <Copy size={14} /> Copiar resumen
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Header card */}
            <div className={`rounded-xl border-2 ${BORDER_COLORS[selectedTicket.estado]} ${BG_COLORS[selectedTicket.estado]} p-5`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Alerta crítica · Posible robo de disco</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedTicket.ppu}</p>
                  <p className="text-sm text-gray-600">N° Interno: {selectedTicket.numero_interno}</p>
                </div>
                <TicketBadge estado={selectedTicket.estado} />
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Terminal', value: selectedTicket.terminales?.nombre || '—' },
                { label: 'Modelo', value: selectedTicket.modelos_bus?.nombre || '—' },
                { label: 'Fecha detección', value: `${formatDate(selectedTicket.fecha_alerta)} ${formatTime(selectedTicket.hora_alerta)}` },
                { label: 'Último con disco', value: formatDate(selectedTicket.ultima_fecha_con_disco) },
                { label: 'Estado anterior', value: selectedTicket.estado_anterior || '—' },
                { label: 'Estado actual', value: selectedTicket.estado_actual || '—' }
              ].map((d, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{d.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{d.value}</p>
                </div>
              ))}
            </div>

            {selectedTicket.impacto_estimado > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                <p className="text-sm font-medium text-red-700">Impacto económico estimado</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(selectedTicket.impacto_estimado)}</p>
              </div>
            )}

            <div>
              <p className="label">Observación</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedTicket.observacion || '—'}</p>
            </div>

            {selectedTicket.observacion_cierre && (
              <div>
                <p className="label">Observación de cierre</p>
                <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3">{selectedTicket.observacion_cierre}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Close ticket modal */}
      <Modal
        open={showClose}
        onClose={() => setShowClose(false)}
        title="Cerrar ticket"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowClose(false)} className="btn btn-secondary">Cancelar</button>
            <button onClick={handleCerrar} disabled={saving} className="btn-success">
              <CheckCircle size={16} />
              {saving ? 'Cerrando...' : 'Confirmar cierre'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Observación de cierre <span className="text-red-500">*</span></label>
            <textarea
              className="textarea h-24"
              placeholder="Describe cómo se resolvió el caso..."
              value={closeForm.observacion_cierre}
              onChange={e => setCloseForm(f => ({ ...f, observacion_cierre: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Usuario que cierra</label>
            <input
              className="input"
              value={closeForm.usuario_cierra}
              onChange={e => setCloseForm(f => ({ ...f, usuario_cierra: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
