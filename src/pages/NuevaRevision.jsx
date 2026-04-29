import { useState, useCallback, useEffect } from 'react'
import {
  Bus, Calendar, Lock, ShieldCheck, Disc,
  AlertTriangle, CheckCircle, Save, User, Plus, Wrench
} from 'lucide-react'
import Header from '../components/layout/Header'
import FormSection, { YesNoToggle } from '../components/ui/FormSection'
import BusAutocomplete from '../components/ui/BusAutocomplete'
import GPSTerminalDetector from '../components/ui/GPSTerminalDetector'
import Modal from '../components/ui/Modal'
import { createBus } from '../services/busService'
import { createRevision, checkWeeklyRevision, getLastRevision } from '../services/revisionService'
import { hasOpenCasoSRL } from '../services/srlService'
import { createTicket, hasOpenTicket } from '../services/ticketService'
import { getModelosBus, getCerradurasModelo, getTerminales, getConfig } from '../services/configService'
import { today, nowTime, formatDateTime } from '../utils/dateUtils'
import { calcularNivelRiesgo } from '../utils/riskCalculator'

const MOTIVOS_SIN_DISCO = [
  { value: 'POSIBLE_ROBO', label: 'Posible robo' },
  { value: 'RETIRADO_SRL', label: 'Retirado por SRL' },
  { value: 'SIN_INSTALAR', label: 'Nunca instalado' },
  { value: 'DESCONOCIDO', label: 'Desconocido' }
]

const USUARIO_KEY = 'rack_usuario'

export default function NuevaRevision({ onMenuToggle, toast }) {
  // Bus state
  const [bus, setBus] = useState(null)
  const [ppuInput, setPpuInput] = useState('')
  const [niInput, setNiInput] = useState('')
  const [busLoading, setBusLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    terminal_id: '',
    fecha_revision: today(),
    hora_revision: nowTime(),
    tiene_disco: null,
    motivo_sin_disco: '',
    tiene_candado: null,
    tiene_seguridad_extra: null,
    observacion: '',
    usuario_id: ''
  })

  // GPS / terminales
  const [terminales, setTerminales] = useState([])
  const [detectedTerminal, setDetectedTerminal] = useState(null)
  const [gpsPosition, setGpsPosition] = useState(null)

  // Models / locks
  const [modelos, setModelos] = useState([])
  const [cerraduras, setCerraduras] = useState([])
  // null = sin responder | true = todas buenas | false = mostrar detalle
  const [todasCerradurasOk, setTodasCerradurasOk] = useState(null)
  const [cerradurasEstado, setCerradurasEstado] = useState({})
  // Fallback cuando no hay modelo cargado con cerraduras
  const [cerradurasManualMalas, setCerradurasManualMalas] = useState(0)
  const [cerradurasManualObs, setCerradurasManualObs] = useState('')

  // Alerts
  const [weeklyAlert, setWeeklyAlert] = useState(null)
  const [srlCaso, setSrlCaso] = useState(null)
  const [lastRevision, setLastRevision] = useState(null)
  const [confirmWeekly, setConfirmWeekly] = useState(false)
  const [showCreateBus, setShowCreateBus] = useState(false)
  const [newBusData, setNewBusData] = useState({ ppu: '', numero_interno: '', modelo_id: '', terminal_habitual_id: '' })

  // Submit
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [valorDisco, setValorDisco] = useState(0)

  // Load initial data + usuario from localStorage
  useEffect(() => {
    const savedUsuario = localStorage.getItem(USUARIO_KEY) || ''
    setForm(f => ({ ...f, usuario_id: savedUsuario }))

    const loadInit = async () => {
      const [mods, terms, vd] = await Promise.all([
        getModelosBus(),
        getTerminales(),
        getConfig('valor_unitario_disco')
      ])
      setModelos(mods)
      setTerminales(terms)
      setValorDisco(Number(vd) || 0)
    }
    loadInit().catch(console.error)
  }, [])

  const handleUsuarioChange = (value) => {
    setForm(f => ({ ...f, usuario_id: value }))
    localStorage.setItem(USUARIO_KEY, value)
  }

  const loadCerraduras = useCallback(async (modeloId) => {
    if (!modeloId) { setCerraduras([]); setCerradurasEstado({}); setTodasCerradurasOk(null); return }
    try {
      const data = await getCerradurasModelo(modeloId)
      setCerraduras(data)
      const inicial = {}
      data.forEach(c => { inicial[c.id] = { estado: 'BUENA', observacion: '' } })
      setCerradurasEstado(inicial)
      setTodasCerradurasOk(null)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleBusSelect = useCallback(async (selectedBus) => {
    if (selectedBus._isNew) {
      setNewBusData({ ppu: ppuInput, numero_interno: niInput, modelo_id: '', terminal_habitual_id: '' })
      setShowCreateBus(true)
      return
    }
    setBus(selectedBus)
    setPpuInput(selectedBus.ppu || '')
    setNiInput(selectedBus.numero_interno || '')
    if (selectedBus.modelo_id) loadCerraduras(selectedBus.modelo_id)
    if (selectedBus.terminal_habitual_id && !detectedTerminal) {
      setForm(f => ({ ...f, terminal_id: selectedBus.terminal_habitual_id }))
    }
    setBusLoading(true)
    try {
      const [weekly, srl, last] = await Promise.all([
        checkWeeklyRevision(selectedBus.id),
        hasOpenCasoSRL(selectedBus.id),
        getLastRevision(selectedBus.id)
      ])
      setWeeklyAlert(weekly)
      setSrlCaso(srl)
      setLastRevision(last)
    } catch (e) {
      console.error(e)
    } finally {
      setBusLoading(false)
    }
  }, [ppuInput, niInput, loadCerraduras, detectedTerminal])

  const handleGPSDetected = useCallback((terminal, position) => {
    setGpsPosition(position)
    if (terminal) {
      setDetectedTerminal(terminal)
      setForm(f => ({ ...f, terminal_id: terminal.id }))
    }
  }, [])

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleDiscoChange = (value) => {
    setField('tiene_disco', value)
    if (value) {
      setField('motivo_sin_disco', '')
    } else if (srlCaso) {
      setField('motivo_sin_disco', 'RETIRADO_SRL')
    }
  }

  // Handle hora input — allow free text, validate HH:MM
  const handleHoraChange = (e) => {
    let val = e.target.value.replace(/[^0-9:]/g, '')
    // auto-insert colon after 2 digits
    if (val.length === 2 && !val.includes(':')) val = val + ':'
    if (val.length > 5) val = val.slice(0, 5)
    setField('hora_revision', val)
  }

  const handleTodasCerradurasOk = (value) => {
    setTodasCerradurasOk(value)
    if (value) {
      // Mark all BUENA
      const updated = {}
      cerraduras.forEach(c => { updated[c.id] = { estado: 'BUENA', observacion: '' } })
      setCerradurasEstado(updated)
    }
  }

  // Si hay cerraduras de modelo → contarlas. Si no → usar el número manual
  const cantCerrMalas = cerraduras.length > 0
    ? Object.values(cerradurasEstado).filter(c => c.estado === 'MALA').length
    : (todasCerradurasOk === false ? cerradurasManualMalas : 0)

  const nivelRiesgo = form.tiene_disco !== null
    ? calcularNivelRiesgo({
        tiene_disco: form.tiene_disco,
        tiene_candado: form.tiene_candado ?? true,
        tiene_seguridad_extra: form.tiene_seguridad_extra ?? true,
        cantidad_cerraduras_malas: cantCerrMalas
      })
    : null

  const handleCreateBus = async () => {
    if (!newBusData.ppu && !newBusData.numero_interno) {
      toast?.error('Ingresa al menos PPU o número interno')
      return
    }
    try {
      const created = await createBus({
        ppu: newBusData.ppu.toUpperCase(),
        numero_interno: newBusData.numero_interno.toUpperCase(),
        modelo_id: newBusData.modelo_id || null,
        terminal_habitual_id: newBusData.terminal_habitual_id || null,
        activo: true
      })
      setShowCreateBus(false)
      handleBusSelect(created)
      toast?.success(`Bus ${created.ppu} creado correctamente`)
    } catch (e) {
      toast?.error('Error al crear bus: ' + e.message)
    }
  }

  const validateHora = (hora) => /^\d{2}:\d{2}$/.test(hora)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!bus) { toast?.error('Debes seleccionar un bus'); return }
    if (!form.terminal_id) { toast?.error('Debes indicar el terminal'); return }
    if (!validateHora(form.hora_revision)) { toast?.error('Hora inválida — usa formato HH:MM (ej: 14:30)'); return }
    if (form.tiene_disco === null) { toast?.error('Indica si el bus tiene disco'); return }
    if (form.tiene_candado === null) { toast?.error('Indica si tiene candado instalado'); return }
    if (form.tiene_seguridad_extra === null) { toast?.error('Indica si tiene seguridad extra'); return }
    if (!form.tiene_disco && !form.motivo_sin_disco) { toast?.error('Indica el motivo de falta de disco'); return }
    if (todasCerradurasOk === null) { toast?.error('Indica el estado de las cerraduras'); return }

    if (weeklyAlert && !confirmWeekly) {
      setConfirmWeekly(true)
      return
    }

    setSaving(true)
    try {
      const revData = {
        bus_id: bus.id,
        ppu: bus.ppu,
        numero_interno: bus.numero_interno,
        modelo_id: bus.modelo_id,
        terminal_id: form.terminal_id,
        fecha_revision: form.fecha_revision,
        hora_revision: form.hora_revision + ':00',
        gps_latitud: gpsPosition?.lat || null,
        gps_longitud: gpsPosition?.lng || null,
        tiene_disco: form.tiene_disco,
        motivo_sin_disco: form.tiene_disco ? null : form.motivo_sin_disco,
        tiene_candado: form.tiene_candado,
        tiene_seguridad_extra: form.tiene_seguridad_extra,
        cantidad_cerraduras_malas: cantCerrMalas,
        observacion: [
          form.observacion,
          (cerraduras.length === 0 && todasCerradurasOk === false && cerradurasManualObs)
            ? `Cerraduras malas: ${cerradurasManualObs}`
            : null
        ].filter(Boolean).join(' | ') || null,
        usuario_id: form.usuario_id || null
      }

      const cerrItems = cerraduras.map(c => ({
        cerradura_modelo_id: c.id,
        nombre_cerradura: c.nombre,
        estado: cerradurasEstado[c.id]?.estado || 'BUENA',
        observacion: cerradurasEstado[c.id]?.observacion || null
      }))

      const revision = await createRevision(revData, cerrItems)

      // Lógica de posible robo
      if (!form.tiene_disco && form.motivo_sin_disco !== 'RETIRADO_SRL' && !srlCaso) {
        if (lastRevision?.tiene_disco === true) {
          const existeTicket = await hasOpenTicket(bus.id)
          if (!existeTicket) {
            await createTicket({
              bus_id: bus.id,
              revision_id: revision.id,
              ppu: bus.ppu,
              numero_interno: bus.numero_interno,
              modelo_id: bus.modelo_id,
              terminal_id: form.terminal_id,
              fecha_alerta: form.fecha_revision,
              hora_alerta: form.hora_revision + ':00',
              ultima_fecha_con_disco: lastRevision.fecha_revision,
              estado_anterior: 'CON_DISCO',
              estado_actual: 'SIN_DISCO',
              impacto_estimado: valorDisco || null,
              observacion: form.observacion || 'Generado automáticamente al detectar falta de disco',
              usuario_detecta: form.usuario_id || null
            })
            toast?.warning('⚠️ Se generó un ticket de posible robo de disco')
          }
        }
      }

      setSaved(true)
      toast?.success('Revisión guardada correctamente')
      setTimeout(() => {
        setSaved(false)
        setBus(null)
        setPpuInput('')
        setNiInput('')
        setWeeklyAlert(null)
        setSrlCaso(null)
        setLastRevision(null)
        setConfirmWeekly(false)
        setCerraduras([])
        setCerradurasEstado({})
        setTodasCerradurasOk(null)
        setCerradurasManualMalas(0)
        setCerradurasManualObs('')
        setForm(f => ({
          terminal_id: form.terminal_id, // keep terminal
          fecha_revision: today(),
          hora_revision: nowTime(),
          tiene_disco: null,
          motivo_sin_disco: '',
          tiene_candado: null,
          tiene_seguridad_extra: null,
          observacion: '',
          usuario_id: f.usuario_id  // keep user
        }))
      }, 1500)
    } catch (e) {
      toast?.error('Error al guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const riesgoColors = {
    BAJO: 'text-green-700 bg-green-50 border border-green-200',
    MEDIO: 'text-amber-700 bg-amber-50 border border-amber-200',
    ALTO: 'text-orange-700 bg-orange-50 border border-orange-200',
    CRITICO: 'text-red-700 bg-red-50 border border-red-200 animate-pulse'
  }

  return (
    <div>
      <Header
        title="Nueva Revisión de Rack"
        subtitle="Registra la revisión de un bus en terreno"
        onMenuToggle={onMenuToggle}
      />

      <form onSubmit={handleSubmit} className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">

        {saved && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-green-700 font-medium">Revisión guardada exitosamente</p>
          </div>
        )}

        {/* Bus search */}
        <FormSection title="Identificación del bus" icon={Bus}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BusAutocomplete
              label="PPU *"
              field="ppu"
              value={ppuInput}
              onChange={setPpuInput}
              onBusSelect={handleBusSelect}
              placeholder="Ej: BJRT45"
            />
            <BusAutocomplete
              label="Número interno *"
              field="numero_interno"
              value={niInput}
              onChange={setNiInput}
              onBusSelect={handleBusSelect}
              placeholder="Ej: 1042"
            />
          </div>

          {busLoading && (
            <p className="text-sm text-blue-600 mt-3 flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Verificando estado del bus...
            </p>
          )}

          {bus && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bus size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{bus.ppu} — N° {bus.numero_interno}</p>
                  <p className="text-sm text-gray-600">
                    {bus.modelo?.nombre || 'Sin modelo'} · {bus.terminal?.nombre || 'Sin terminal habitual'}
                  </p>
                </div>
                {nivelRiesgo && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riesgoColors[nivelRiesgo]}`}>
                    Riesgo {nivelRiesgo}
                  </span>
                )}
              </div>
            </div>
          )}
        </FormSection>

        {/* Weekly alert */}
        {weeklyAlert && !confirmWeekly && (
          <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-amber-800">Bus ya revisado esta semana</p>
                <p className="text-sm text-amber-700 mt-1">
                  Última revisión: {formatDateTime(weeklyAlert.fecha_revision, weeklyAlert.hora_revision)}
                  {weeklyAlert.terminales?.nombre ? ` · ${weeklyAlert.terminales.nombre}` : ''}
                  · Disco: {weeklyAlert.tiene_disco ? 'SÍ' : 'NO'}
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmWeekly(true)}
                  className="mt-3 btn btn-warning btn-sm"
                >
                  Registrar de todas formas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SRL alert */}
        {srlCaso && (
          <div className="border-2 border-blue-300 bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Wrench size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-800">Bus con caso SRL activo</p>
                <p className="text-sm text-blue-700 mt-1">
                  Motivo: {srlCaso.motivo} · Estado: {srlCaso.estado} · Fecha retiro: {srlCaso.fecha_retiro}
                </p>
                <p className="text-xs text-blue-600 mt-1">El disco faltante NO se registrará como posible robo.</p>
              </div>
            </div>
          </div>
        )}

        {/* Datos de la revisión */}
        <FormSection title="Datos de la revisión" icon={Calendar}>
          <GPSTerminalDetector
            terminales={terminales}
            onDetected={handleGPSDetected}
            detectedTerminal={detectedTerminal}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="label">Terminal *</label>
              <select
                className="select"
                value={form.terminal_id}
                onChange={e => setField('terminal_id', e.target.value)}
                required
              >
                <option value="">Seleccionar terminal</option>
                {terminales.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fecha *</label>
              <input
                type="date"
                className="input"
                value={form.fecha_revision}
                onChange={e => setField('fecha_revision', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Hora * (HH:MM)</label>
              <input
                type="text"
                inputMode="numeric"
                className="input"
                placeholder="14:30"
                value={form.hora_revision}
                onChange={handleHoraChange}
                maxLength={5}
                required
              />
            </div>
          </div>

          {/* Usuario — persiste en localStorage */}
          <div className="mt-4">
            <label className="label flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              Nombre y apellido del técnico
              {localStorage.getItem(USUARIO_KEY) && form.usuario_id && (
                <span className="text-xs text-green-600 font-normal ml-1">recordado</span>
              )}
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Juan Pérez"
              value={form.usuario_id}
              onChange={e => handleUsuarioChange(e.target.value)}
            />
          </div>
        </FormSection>

        {/* Disco */}
        <FormSection title="Estado del disco de grabación" icon={Disc}>
          <YesNoToggle
            label="¿El bus tiene disco de grabación? *"
            value={form.tiene_disco}
            onChange={handleDiscoChange}
            required
          />
          {form.tiene_disco === false && (
            <div className="mt-4">
              <label className="label">Motivo de falta de disco *</label>
              <select
                className="select"
                value={form.motivo_sin_disco}
                onChange={e => setField('motivo_sin_disco', e.target.value)}
                required
              >
                <option value="">Seleccionar motivo</option>
                {MOTIVOS_SIN_DISCO.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {form.motivo_sin_disco === 'POSIBLE_ROBO' && !srlCaso && lastRevision?.tiene_disco && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">
                    <strong>Alerta:</strong> El bus tenía disco en la revisión anterior ({formatDateTime(lastRevision.fecha_revision, lastRevision.hora_revision)}).
                    Se generará un ticket de posible robo al guardar.
                  </p>
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* Candado */}
        <FormSection title="Candado de seguridad" icon={Lock}>
          <YesNoToggle
            label="¿Tiene candado instalado? *"
            value={form.tiene_candado}
            onChange={v => setField('tiene_candado', v)}
            required
          />
        </FormSection>

        {/* Seguridad extra */}
        <FormSection title="Seguridad adicional" icon={ShieldCheck}>
          <YesNoToggle
            label="¿Tiene seguridad extra (amarre/envolvente del disco)? *"
            value={form.tiene_seguridad_extra}
            onChange={v => setField('tiene_seguridad_extra', v)}
            required
          />
        </FormSection>

        {/* Cerraduras — SIEMPRE visible */}
        <FormSection
          title="Estado de cerraduras"
          description={cerraduras.length > 0
            ? `${cerraduras.length} cerradura(s) — ${bus?.modelo?.nombre || ''}`
            : 'Indica si hay cerraduras en mal estado'}
          icon={Lock}
        >
          {/* Pregunta general */}
          <YesNoToggle
            label="¿Todas las cerraduras están en buen estado? *"
            value={todasCerradurasOk}
            onChange={handleTodasCerradurasOk}
            yesLabel="Todas buenas"
            noLabel="Hay problemas"
            required
          />

          {/* Todas buenas */}
          {todasCerradurasOk === true && (
            <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle size={16} className="text-green-500" />
              <p className="text-sm text-green-700 font-medium">
                {cerraduras.length > 0
                  ? `${cerraduras.length} cerradura(s) marcada(s) como buenas`
                  : 'Todas las cerraduras en buen estado'}
              </p>
            </div>
          )}

          {/* Hay problemas */}
          {todasCerradurasOk === false && (
            <div className="mt-4 space-y-3">

              {/* CASO A: hay cerraduras del modelo cargadas → preguntar por cada una */}
              {cerraduras.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Indica el estado de cada cerradura:
                  </p>
                  {cerraduras.map(c => (
                    <div key={c.id} className={`border rounded-xl p-4 transition-colors
                      ${cerradurasEstado[c.id]?.estado === 'MALA'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-100 bg-white'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-800">{c.nombre}</p>
                        {cerradurasEstado[c.id]?.estado === 'MALA' && (
                          <span className="badge bg-red-100 text-red-700 border border-red-200">Mala</span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {['BUENA', 'MALA'].map(est => (
                          <button
                            key={est}
                            type="button"
                            onClick={() => setCerradurasEstado(prev => ({
                              ...prev, [c.id]: { ...prev[c.id], estado: est }
                            }))}
                            className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-150
                              ${cerradurasEstado[c.id]?.estado === est
                                ? est === 'BUENA'
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : 'border-red-500 bg-red-500 text-white'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                              }`}
                          >
                            {est === 'BUENA' ? 'Buena' : 'Mala'}
                          </button>
                        ))}
                      </div>
                      {cerradurasEstado[c.id]?.estado === 'MALA' && (
                        <textarea
                          className="textarea text-sm mt-3 h-16"
                          placeholder="Describe el problema con esta cerradura..."
                          value={cerradurasEstado[c.id]?.observacion || ''}
                          onChange={e => setCerradurasEstado(prev => ({
                            ...prev, [c.id]: { ...prev[c.id], observacion: e.target.value }
                          }))}
                        />
                      )}
                    </div>
                  ))}
                </>
              ) : (
                /* CASO B: no hay modelo/cerraduras cargadas → número manual + observación */
                <div className="space-y-3">
                  <div>
                    <label className="label">¿Cuántas cerraduras están en mal estado?</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      className="input w-28"
                      value={cerradurasManualMalas}
                      onChange={e => setCerradurasManualMalas(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                  <div>
                    <label className="label">Observación de cerraduras en mal estado</label>
                    <textarea
                      className="textarea h-20"
                      placeholder="Describe cuáles cerraduras están malas y qué les pasa..."
                      value={cerradurasManualObs}
                      onChange={e => setCerradurasManualObs(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Contador de malas */}
              {cantCerrMalas > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <AlertTriangle size={16} className="text-orange-600" />
                  <p className="text-sm text-orange-700 font-semibold">
                    {cantCerrMalas} cerradura(s) en mal estado
                  </p>
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* Observación */}
        <FormSection title="Observaciones">
          <textarea
            className="textarea h-24"
            placeholder="Observaciones adicionales sobre la revisión..."
            value={form.observacion}
            onChange={e => setField('observacion', e.target.value)}
          />
        </FormSection>

        {/* Submit */}
        <div className="flex gap-3 pb-4">
          <button
            type="submit"
            disabled={saving || !bus}
            className="btn-primary btn-lg flex-1 justify-center"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar revisión
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal crear bus */}
      <Modal
        open={showCreateBus}
        onClose={() => setShowCreateBus(false)}
        title="Crear nuevo bus"
        footer={
          <>
            <button type="button" onClick={() => setShowCreateBus(false)} className="btn btn-secondary">Cancelar</button>
            <button type="button" onClick={handleCreateBus} className="btn-primary">Crear bus</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">PPU</label>
            <input className="input uppercase" value={newBusData.ppu} onChange={e => setNewBusData(d => ({ ...d, ppu: e.target.value.toUpperCase() }))} placeholder="Ej: BJRT45" />
          </div>
          <div>
            <label className="label">Número interno</label>
            <input className="input uppercase" value={newBusData.numero_interno} onChange={e => setNewBusData(d => ({ ...d, numero_interno: e.target.value.toUpperCase() }))} placeholder="Ej: 1042" />
          </div>
          <div>
            <label className="label">Modelo de bus</label>
            <select className="select" value={newBusData.modelo_id} onChange={e => setNewBusData(d => ({ ...d, modelo_id: e.target.value }))}>
              <option value="">Sin modelo</option>
              {modelos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Terminal habitual</label>
            <select className="select" value={newBusData.terminal_habitual_id} onChange={e => setNewBusData(d => ({ ...d, terminal_habitual_id: e.target.value }))}>
              <option value="">Sin terminal</option>
              {terminales.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
