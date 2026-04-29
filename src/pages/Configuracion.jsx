import { useState, useEffect } from 'react'
import { Settings, DollarSign, Bus, MapPin, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import {
  getConfig, setConfig, getModelosBus, createModeloBus, updateModeloBus,
  getTerminales, createTerminal, updateTerminal, deleteTerminal
} from '../services/configService'
import { formatCurrency } from '../utils/formatters'

const TABS = [
  { id: 'disco', label: 'Valor del disco', icon: DollarSign },
  { id: 'modelos', label: 'Modelos de bus', icon: Bus },
  { id: 'terminales', label: 'Terminales', icon: MapPin }
]

export default function Configuracion({ onMenuToggle, toast }) {
  const [tab, setTab] = useState('disco')
  const [valorDisco, setValorDisco] = useState('')
  const [savingDisco, setSavingDisco] = useState(false)

  const [modelos, setModelos] = useState([])
  const [terminales, setTerminales] = useState([])

  const [showModeloModal, setShowModeloModal] = useState(false)
  const [editModelo, setEditModelo] = useState(null)
  const [modeloForm, setModeloForm] = useState({ nombre: '', activo: true, cerraduras: [{ nombre: '' }] })

  const [showTerminalModal, setShowTerminalModal] = useState(false)
  const [editTerminal, setEditTerminal] = useState(null)
  const [terminalForm, setTerminalForm] = useState({ nombre: '', direccion: '', latitud: '', longitud: '', radio_metros: 300, activo: true })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [vd, mods, terms] = await Promise.all([
        getConfig('valor_unitario_disco'),
        getModelosBus(false),
        getTerminales(false)
      ])
      setValorDisco(vd || '')
      setModelos(mods)
      setTerminales(terms)
    } catch (e) {
      toast?.error('Error al cargar configuración')
    }
  }

  const handleSaveValorDisco = async () => {
    setSavingDisco(true)
    try {
      await setConfig('valor_unitario_disco', String(valorDisco))
      toast?.success('Valor del disco guardado: ' + formatCurrency(valorDisco))
    } catch (e) {
      toast?.error('Error al guardar valor del disco')
    } finally {
      setSavingDisco(false)
    }
  }

  const openNewModelo = () => {
    setEditModelo(null)
    setModeloForm({ nombre: '', activo: true, cerraduras: [{ nombre: '' }] })
    setShowModeloModal(true)
  }

  const openEditModelo = (modelo) => {
    setEditModelo(modelo)
    setModeloForm({
      nombre: modelo.nombre,
      activo: modelo.activo,
      cerraduras: (modelo.cerraduras_modelo || []).map(c => ({ nombre: c.nombre }))
    })
    setShowModeloModal(true)
  }

  const handleSaveModelo = async () => {
    if (!modeloForm.nombre.trim()) { toast?.error('Nombre del modelo es requerido'); return }
    const cerrs = modeloForm.cerraduras.filter(c => c.nombre.trim())
    setSaving(true)
    try {
      if (editModelo) {
        await updateModeloBus(editModelo.id, { nombre: modeloForm.nombre, activo: modeloForm.activo }, cerrs)
        toast?.success('Modelo actualizado')
      } else {
        await createModeloBus({ nombre: modeloForm.nombre, activo: modeloForm.activo }, cerrs)
        toast?.success('Modelo creado')
      }
      setShowModeloModal(false)
      await loadData()
    } catch (e) {
      toast?.error('Error al guardar modelo: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const addCerradura = () => setModeloForm(f => ({ ...f, cerraduras: [...f.cerraduras, { nombre: '' }] }))
  const removeCerradura = (i) => setModeloForm(f => ({ ...f, cerraduras: f.cerraduras.filter((_, idx) => idx !== i) }))
  const updateCerradura = (i, val) => setModeloForm(f => ({
    ...f, cerraduras: f.cerraduras.map((c, idx) => idx === i ? { nombre: val } : c)
  }))

  const openNewTerminal = () => {
    setEditTerminal(null)
    setTerminalForm({ nombre: '', direccion: '', latitud: '', longitud: '', radio_metros: 300, activo: true })
    setShowTerminalModal(true)
  }

  const openEditTerminal = (t) => {
    setEditTerminal(t)
    setTerminalForm({
      nombre: t.nombre, direccion: t.direccion || '',
      latitud: t.latitud || '', longitud: t.longitud || '',
      radio_metros: t.radio_metros || 300, activo: t.activo
    })
    setShowTerminalModal(true)
  }

  const handleSaveTerminal = async () => {
    if (!terminalForm.nombre.trim()) { toast?.error('Nombre del terminal requerido'); return }
    setSaving(true)
    try {
      const data = {
        nombre: terminalForm.nombre.trim(),
        direccion: terminalForm.direccion || null,
        latitud: terminalForm.latitud ? Number(terminalForm.latitud) : null,
        longitud: terminalForm.longitud ? Number(terminalForm.longitud) : null,
        radio_metros: Number(terminalForm.radio_metros) || 300,
        activo: terminalForm.activo
      }
      if (editTerminal) {
        await updateTerminal(editTerminal.id, data)
        toast?.success('Terminal actualizado')
      } else {
        await createTerminal(data)
        toast?.success('Terminal creado')
      }
      setShowTerminalModal(false)
      await loadData()
    } catch (e) {
      toast?.error('Error al guardar terminal: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTerminal = async (id) => {
    try {
      await deleteTerminal(id)
      toast?.success('Terminal desactivado')
      await loadData()
    } catch (e) {
      toast?.error('Error al eliminar terminal')
    }
  }

  return (
    <div>
      <Header
        title="Configuración"
        subtitle="Administración del sistema"
        onMenuToggle={onMenuToggle}
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150
                ${tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Valor del disco */}
        {tab === 'disco' && (
          <div className="card p-6 max-w-md">
            <h3 className="section-title mb-1">Valor unitario del disco</h3>
            <p className="text-sm text-gray-500 mb-5">
              Este valor se usa para calcular el impacto económico estimado por robo de discos.
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                <input
                  type="number"
                  className="input pl-7"
                  placeholder="Ej: 150000"
                  value={valorDisco}
                  onChange={e => setValorDisco(e.target.value)}
                />
              </div>
              <button
                onClick={handleSaveValorDisco}
                disabled={savingDisco}
                className="btn-primary"
              >
                <Save size={16} />
                {savingDisco ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            {valorDisco && (
              <p className="text-sm text-green-600 mt-3 font-medium">
                Valor actual: {formatCurrency(valorDisco)}
              </p>
            )}
          </div>
        )}

        {/* Modelos */}
        {tab === 'modelos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Modelos de bus</h3>
              <button onClick={openNewModelo} className="btn-primary btn-sm">
                <Plus size={14} /> Nuevo modelo
              </button>
            </div>
            <div className="space-y-3">
              {modelos.map(m => (
                <div key={m.id} className={`card p-5 ${!m.activo ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-gray-900">{m.nombre}</p>
                        <span className={`badge ${m.activo ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {m.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {(m.cerraduras_modelo || []).length} cerradura(s)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(m.cerraduras_modelo || []).map((c, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{c.nombre}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => openEditModelo(m)} className="btn btn-secondary btn-sm">
                      <Edit2 size={14} /> Editar
                    </button>
                  </div>
                </div>
              ))}
              {modelos.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No hay modelos configurados</p>
              )}
            </div>
          </div>
        )}

        {/* Terminales */}
        {tab === 'terminales' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Terminales</h3>
              <button onClick={openNewTerminal} className="btn-primary btn-sm">
                <Plus size={14} /> Nuevo terminal
              </button>
            </div>
            <div className="space-y-3">
              {terminales.map(t => (
                <div key={t.id} className={`card p-5 ${!t.activo ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900">{t.nombre}</p>
                        <span className={`badge ${t.activo ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {t.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {t.direccion && <p className="text-sm text-gray-500">{t.direccion}</p>}
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        {t.latitud && t.longitud && (
                          <span>GPS: {Number(t.latitud).toFixed(5)}, {Number(t.longitud).toFixed(5)}</span>
                        )}
                        <span>Radio: {t.radio_metros}m</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditTerminal(t)} className="btn btn-secondary btn-sm">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTerminal(t.id)}
                        className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {terminales.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No hay terminales configurados</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modelo modal */}
      <Modal
        open={showModeloModal}
        onClose={() => setShowModeloModal(false)}
        title={editModelo ? `Editar modelo ${editModelo.nombre}` : 'Nuevo modelo de bus'}
        size="md"
        footer={
          <>
            <button onClick={() => setShowModeloModal(false)} className="btn btn-secondary">Cancelar</button>
            <button onClick={handleSaveModelo} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : editModelo ? 'Actualizar' : 'Crear modelo'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nombre del modelo <span className="text-red-500">*</span></label>
            <input
              className="input"
              value={modeloForm.nombre}
              onChange={e => setModeloForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Volvo B8R"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="modeloActivo" checked={modeloForm.activo} onChange={e => setModeloForm(f => ({ ...f, activo: e.target.checked }))} className="rounded" />
            <label htmlFor="modeloActivo" className="text-sm text-gray-700 cursor-pointer">Modelo activo</label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Cerraduras</label>
              <button type="button" onClick={addCerradura} className="btn btn-secondary btn-sm">
                <Plus size={14} /> Agregar
              </button>
            </div>
            <div className="space-y-2">
              {modeloForm.cerraduras.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={c.nombre}
                    onChange={e => updateCerradura(i, e.target.value)}
                    placeholder={`Ej: Superior izquierda`}
                  />
                  <button
                    type="button"
                    onClick={() => removeCerradura(i)}
                    className="w-9 h-9 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Terminal modal */}
      <Modal
        open={showTerminalModal}
        onClose={() => setShowTerminalModal(false)}
        title={editTerminal ? `Editar terminal ${editTerminal.nombre}` : 'Nuevo terminal'}
        size="md"
        footer={
          <>
            <button onClick={() => setShowTerminalModal(false)} className="btn btn-secondary">Cancelar</button>
            <button onClick={handleSaveTerminal} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : editTerminal ? 'Actualizar' : 'Crear terminal'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nombre del terminal <span className="text-red-500">*</span></label>
            <input className="input" value={terminalForm.nombre} onChange={e => setTerminalForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Terminal San Bernardo" />
          </div>
          <div>
            <label className="label">Dirección (opcional)</label>
            <input className="input" value={terminalForm.direccion} onChange={e => setTerminalForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Ej: Av. Carlos Valdovinos 1234" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Latitud GPS</label>
              <input type="number" step="0.00001" className="input" value={terminalForm.latitud} onChange={e => setTerminalForm(f => ({ ...f, latitud: e.target.value }))} placeholder="-33.45694" />
            </div>
            <div>
              <label className="label">Longitud GPS</label>
              <input type="number" step="0.00001" className="input" value={terminalForm.longitud} onChange={e => setTerminalForm(f => ({ ...f, longitud: e.target.value }))} placeholder="-70.64827" />
            </div>
          </div>
          <div>
            <label className="label">Radio de detección (metros)</label>
            <input type="number" className="input" value={terminalForm.radio_metros} onChange={e => setTerminalForm(f => ({ ...f, radio_metros: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="termActivo" checked={terminalForm.activo} onChange={e => setTerminalForm(f => ({ ...f, activo: e.target.checked }))} className="rounded" />
            <label htmlFor="termActivo" className="text-sm text-gray-700 cursor-pointer">Terminal activo</label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
