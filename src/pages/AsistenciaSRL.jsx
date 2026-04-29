import { useState, useEffect, useCallback } from 'react'
import { Wrench, Plus, Search, Filter, ChevronDown, CheckCircle } from 'lucide-react'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { SRLBadge } from '../components/ui/StatusBadge'
import BusAutocomplete from '../components/ui/BusAutocomplete'
import { createCasoSRL, getCasosSRL, updateCasoSRL, cerrarCasoSRL } from '../services/srlService'
import { getTerminales, getModelosBus } from '../services/configService'
import { getBusByPPU } from '../services/busService'
import { formatDate, formatTime, today, nowTime } from '../utils/dateUtils'
import { estado_srl_label } from '../utils/formatters'

const MOTIVOS = [
  'Problema de disco', 'No se pueden extraer imágenes',
  'Disco dañado', 'Disco no detectado', 'Otro'
]

const ESTADOS_FLOW = [
  { value: 'PENDIENTE_ENVIO', label: 'Pendiente envío' },
  { value: 'ENVIADO_SRL', label: 'Enviado a SRL' },
  { value: 'EN_REPARACION', label: 'En reparación' },
  { value: 'RECIBIDO_SRL', label: 'Recibido desde SRL' },
  { value: 'REPUESTO_BUS', label: 'Repuesto en bus' },
  { value: 'CERRADO', label: 'Cerrado' }
]

const SRL_ESTADO_COLORS = {
  PENDIENTE_ENVIO: 'bg-gray-50 border-gray-200',
  ENVIADO_SRL: 'bg-blue-50 border-blue-200',
  EN_REPARACION: 'bg-amber-50 border-amber-200',
  RECIBIDO_SRL: 'bg-sky-50 border-sky-200',
  REPUESTO_BUS: 'bg-green-50 border-green-200',
  CERRADO: 'bg-gray-50 border-gray-200'
}

export default function AsistenciaSRL({ onMenuToggle, toast }) {
  const [casos, setCasos] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [terminales, setTerminales] = useState([])
  const [modelos, setModelos] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [selectedCaso, setSelectedCaso] = useState(null)

  const [filters, setFilters] = useState({ estado: '', search: '', terminal_id: '' })
  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const [newForm, setNewForm] = useState({
    ppu: '', numero_interno: '', bus_id: null, modelo_id: '', terminal_id: '',
    fecha_retiro: today(), hora_retiro: nowTime(), motivo: '', observacion: '', usuario_registra: 'técnico'
  })
  const setNF = (k, v) => setNewForm(f => ({ ...f, [k]: v }))

  const [closeForm, setCloseForm] = useState({
    fecha_recepcion: today(), hora_recepcion: nowTime(),
    fecha_reposicion: today(), hora_reposicion: nowTime(),
    usuario_repone: 'técnico', observacion_final: ''
  })

  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await getCasosSRL({ ...filters, limit: 100 })
      setCasos(data)
      setCount(count)
    } catch (e) {
      toast?.error('Error al cargar casos SRL')
    } finally {
      setLoading(false)
    }
  }, [filters.estado, filters.search, filters.terminal_id, toast])

  useEffect(() => { load() }, [filters.estado])

  useEffect(() => {
    Promise.all([getTerminales(), getModelosBus()]).then(([t, m]) => {
      setTerminales(t); setModelos(m)
    }).catch(console.error)
  }, [])

  const handleBusSelect = (bus) => {
    if (bus._isNew) return
    setNewForm(f => ({
      ...f,
      bus_id: bus.id,
      ppu: bus.ppu || f.ppu,
      numero_interno: bus.numero_interno || f.numero_interno,
      modelo_id: bus.modelo_id || f.modelo_id,
      terminal_id: bus.terminal_habitual_id || f.terminal_id
    }))
  }

  const handleCreateCaso = async () => {
    if (!newForm.ppu && !newForm.numero_interno) {
      toast?.error('Ingresa PPU o número interno')
      return
    }
    if (!newForm.motivo) {
      toast?.error('Selecciona el motivo')
      return
    }
    setSaving(true)
    try {
      await createCasoSRL({
        bus_id: newForm.bus_id || null,
        ppu: newForm.ppu.toUpperCase(),
        numero_interno: newForm.numero_interno.toUpperCase(),
        modelo_id: newForm.modelo_id || null,
        terminal_id: newForm.terminal_id || null,
        fecha_retiro: newForm.fecha_retiro,
        hora_retiro: newForm.hora_retiro + ':00',
        motivo: newForm.motivo,
        estado: 'PENDIENTE_ENVIO',
        usuario_registra: newForm.usuario_registra || null,
        observacion: newForm.observacion || null
      })
      toast?.success('Caso SRL creado correctamente')
      setShowNew(false)
      setNewForm({ ppu: '', numero_interno: '', bus_id: null, modelo_id: '', terminal_id: '', fecha_retiro: today(), hora_retiro: nowTime(), motivo: '', observacion: '', usuario_registra: 'técnico' })
      load()
    } catch (e) {
      toast?.error('Error al crear caso: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateEstado = async (id, estado) => {
    setSaving(true)
    try {
      await updateCasoSRL(id, { estado })
      toast?.success(`Estado actualizado: ${estado_srl_label(estado)}`)
      load()
    } catch (e) {
      toast?.error('Error al actualizar estado')
    } finally {
      setSaving(false)
    }
  }

  const handleCerrar = async () => {
    if (!closeForm.observacion_final.trim()) {
      toast?.error('La observación final es obligatoria')
      return
    }
    setSaving(true)
    try {
      await cerrarCasoSRL(selectedCaso.id, closeForm)
      toast?.success('Caso SRL cerrado. Disco repuesto en bus.')
      setShowClose(false)
      load()
    } catch (e) {
      toast?.error('Error al cerrar caso')
    } finally {
      setSaving(false)
    }
  }

  const nextEstado = (current) => {
    const idx = ESTADOS_FLOW.findIndex(e => e.value === current)
    return idx < ESTADOS_FLOW.length - 2 ? ESTADOS_FLOW[idx + 1].value : null
  }

  const activos = casos.filter(c => !['REPUESTO_BUS', 'CERRADO'].includes(c.estado)).length

  return (
    <div>
      <Header
        title="Asistencia Técnica SRL"
        subtitle="Control de discos retirados por asistencia técnica"
        onMenuToggle={onMenuToggle}
        actions={
          <button onClick={() => setShowNew(true)} className="btn-primary btn-sm">
            <Plus size={14} />
            <span className="hidden sm:inline">Nuevo caso</span>
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Counters */}
        <div className="flex flex-wrap gap-2">
          <span className="badge bg-red-100 text-red-700 border border-red-200">Activos: {activos}</span>
          <span className="badge bg-gray-100 text-gray-600 border border-gray-200">Total: {count}</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar por PPU o número interno..."
              value={filters.search}
              onChange={e => setF('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <select className="select w-40 flex-shrink-0" value={filters.estado} onChange={e => setF('estado', e.target.value)}>
            <option value="">Todos estados</option>
            {ESTADOS_FLOW.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        {/* Cases list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : casos.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Sin casos SRL"
            description="No hay casos de asistencia técnica registrados"
            action={<button onClick={() => setShowNew(true)} className="btn-primary btn-sm">Crear primer caso</button>}
          />
        ) : (
          <div className="space-y-3">
            {casos.map(caso => (
              <div key={caso.id} className={`card border-l-4 p-5 ${SRL_ESTADO_COLORS[caso.estado] || 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-bold text-gray-900 text-base">{caso.ppu}</span>
                      <span className="text-gray-500">—</span>
                      <span className="text-gray-700">N° {caso.numero_interno}</span>
                      <SRLBadge estado={caso.estado} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                      <div><span className="text-gray-500">Modelo:</span> <span className="font-medium">{caso.modelos_bus?.nombre || '—'}</span></div>
                      <div><span className="text-gray-500">Terminal:</span> <span className="font-medium">{caso.terminales?.nombre || '—'}</span></div>
                      <div><span className="text-gray-500">Retiro:</span> <span>{formatDate(caso.fecha_retiro)} {formatTime(caso.hora_retiro)}</span></div>
                      <div><span className="text-gray-500">Motivo:</span> <span>{caso.motivo}</span></div>
                    </div>
                    {caso.observacion && (
                      <p className="text-xs text-gray-500 mt-2">{caso.observacion}</p>
                    )}

                    {/* Estado flow stepper */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {ESTADOS_FLOW.slice(0, -1).map((e, i) => {
                        const currentIdx = ESTADOS_FLOW.findIndex(s => s.value === caso.estado)
                        const eIdx = ESTADOS_FLOW.findIndex(s => s.value === e.value)
                        const isPast = eIdx < currentIdx
                        const isCurrent = eIdx === currentIdx
                        return (
                          <div key={e.value} className="flex items-center gap-1">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                              ${isCurrent ? 'bg-blue-600 text-white font-semibold' : isPast ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              {isPast && <CheckCircle size={10} />}
                              {e.label}
                            </div>
                            {i < ESTADOS_FLOW.length - 2 && (
                              <div className={`w-3 h-0.5 ${isPast ? 'bg-green-400' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {nextEstado(caso.estado) && (
                      <button
                        onClick={() => handleUpdateEstado(caso.id, nextEstado(caso.estado))}
                        disabled={saving}
                        className="btn btn-secondary btn-sm text-xs"
                      >
                        <ChevronDown size={14} />
                        {estado_srl_label(nextEstado(caso.estado))}
                      </button>
                    )}
                    {caso.estado === 'REPUESTO_BUS' && (
                      <button
                        onClick={() => { setSelectedCaso(caso); setShowClose(true) }}
                        className="btn-success btn-sm"
                      >
                        <CheckCircle size={14} /> Cerrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New case modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Nuevo caso SRL"
        size="md"
        footer={
          <>
            <button onClick={() => setShowNew(false)} className="btn btn-secondary">Cancelar</button>
            <button onClick={handleCreateCaso} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Crear caso'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <BusAutocomplete
              label="PPU"
              field="ppu"
              value={newForm.ppu}
              onChange={v => setNF('ppu', v)}
              onBusSelect={handleBusSelect}
            />
            <BusAutocomplete
              label="N° Interno"
              field="numero_interno"
              value={newForm.numero_interno}
              onChange={v => setNF('numero_interno', v)}
              onBusSelect={handleBusSelect}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Modelo</label>
              <select className="select" value={newForm.modelo_id} onChange={e => setNF('modelo_id', e.target.value)}>
                <option value="">Seleccionar</option>
                {modelos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Terminal</label>
              <select className="select" value={newForm.terminal_id} onChange={e => setNF('terminal_id', e.target.value)}>
                <option value="">Seleccionar</option>
                {terminales.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha de retiro</label>
              <input type="date" className="input" value={newForm.fecha_retiro} onChange={e => setNF('fecha_retiro', e.target.value)} />
            </div>
            <div>
              <label className="label">Hora de retiro</label>
              <input type="time" className="input" value={newForm.hora_retiro} onChange={e => setNF('hora_retiro', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Motivo <span className="text-red-500">*</span></label>
            <select className="select" value={newForm.motivo} onChange={e => setNF('motivo', e.target.value)}>
              <option value="">Seleccionar motivo</option>
              {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Usuario que registra</label>
            <input className="input" value={newForm.usuario_registra} onChange={e => setNF('usuario_registra', e.target.value)} />
          </div>
          <div>
            <label className="label">Observación</label>
            <textarea className="textarea h-20" value={newForm.observacion} onChange={e => setNF('observacion', e.target.value)} placeholder="Detalles adicionales..." />
          </div>
        </div>
      </Modal>

      {/* Close modal */}
      <Modal
        open={showClose}
        onClose={() => setShowClose(false)}
        title="Cerrar caso SRL"
        size="md"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha de recepción</label>
              <input type="date" className="input" value={closeForm.fecha_recepcion} onChange={e => setCloseForm(f => ({ ...f, fecha_recepcion: e.target.value }))} />
            </div>
            <div>
              <label className="label">Hora de recepción</label>
              <input type="time" className="input" value={closeForm.hora_recepcion} onChange={e => setCloseForm(f => ({ ...f, hora_recepcion: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fecha de reposición</label>
              <input type="date" className="input" value={closeForm.fecha_reposicion} onChange={e => setCloseForm(f => ({ ...f, fecha_reposicion: e.target.value }))} />
            </div>
            <div>
              <label className="label">Hora de reposición</label>
              <input type="time" className="input" value={closeForm.hora_reposicion} onChange={e => setCloseForm(f => ({ ...f, hora_reposicion: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Usuario que repone</label>
            <input className="input" value={closeForm.usuario_repone} onChange={e => setCloseForm(f => ({ ...f, usuario_repone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Observación final <span className="text-red-500">*</span></label>
            <textarea className="textarea h-20" value={closeForm.observacion_final} onChange={e => setCloseForm(f => ({ ...f, observacion_final: e.target.value }))} placeholder="Describe el resultado de la reparación..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
