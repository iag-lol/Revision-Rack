import { useState, useEffect, useCallback } from 'react'
import { Bus, Plus, Search, Edit2, Power } from 'lucide-react'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { BoolBadge } from '../components/ui/StatusBadge'
import { getAllBuses, createBus, updateBus } from '../services/busService'
import { getModelosBus, getTerminales } from '../services/configService'
import { formatDate } from '../utils/dateUtils'

export default function Buses({ onMenuToggle, toast }) {
  const [buses, setBuses] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modelos, setModelos] = useState([])
  const [terminales, setTerminales] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editBus, setEditBus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterModelo, setFilterModelo] = useState('')
  const [filterTerminal, setFilterTerminal] = useState('')

  const [form, setForm] = useState({
    ppu: '', numero_interno: '', modelo_id: '', terminal_habitual_id: '', activo: true
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await getAllBuses({ search, modelo_id: filterModelo, terminal_id: filterTerminal })
      setBuses(data)
      setCount(count)
    } catch (e) {
      toast?.error('Error al cargar buses')
    } finally {
      setLoading(false)
    }
  }, [search, filterModelo, filterTerminal, toast])

  useEffect(() => { load() }, [filterModelo, filterTerminal])

  useEffect(() => {
    Promise.all([getModelosBus(), getTerminales()]).then(([m, t]) => {
      setModelos(m); setTerminales(t)
    }).catch(console.error)
  }, [])

  const openNew = () => {
    setEditBus(null)
    setForm({ ppu: '', numero_interno: '', modelo_id: '', terminal_habitual_id: '', activo: true })
    setShowForm(true)
  }

  const openEdit = (bus) => {
    setEditBus(bus)
    setForm({
      ppu: bus.ppu || '',
      numero_interno: bus.numero_interno || '',
      modelo_id: bus.modelo_id || '',
      terminal_habitual_id: bus.terminal_habitual_id || '',
      activo: bus.activo
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.ppu.trim() && !form.numero_interno.trim()) {
      toast?.error('Ingresa al menos PPU o número interno')
      return
    }
    setSaving(true)
    try {
      const data = {
        ppu: form.ppu.toUpperCase().trim(),
        numero_interno: form.numero_interno.toUpperCase().trim(),
        modelo_id: form.modelo_id || null,
        terminal_habitual_id: form.terminal_habitual_id || null,
        activo: form.activo
      }
      if (editBus) {
        await updateBus(editBus.id, data)
        toast?.success('Bus actualizado')
      } else {
        await createBus(data)
        toast?.success('Bus creado correctamente')
      }
      setShowForm(false)
      load()
    } catch (e) {
      toast?.error('Error: ' + (e.message || 'PPU o N° interno ya existe'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (bus) => {
    try {
      await updateBus(bus.id, { activo: !bus.activo })
      toast?.success(bus.activo ? 'Bus desactivado' : 'Bus activado')
      load()
    } catch (e) {
      toast?.error('Error al actualizar estado')
    }
  }

  return (
    <div>
      <Header
        title="Buses"
        subtitle="Administración del parque de buses"
        onMenuToggle={onMenuToggle}
        actions={
          <button onClick={openNew} className="btn-primary btn-sm">
            <Plus size={14} />
            <span className="hidden sm:inline">Nuevo bus</span>
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar por PPU o N° interno..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <select className="select w-36" value={filterModelo} onChange={e => setFilterModelo(e.target.value)}>
            <option value="">Todos modelos</option>
            {modelos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select className="select w-40" value={filterTerminal} onChange={e => setFilterTerminal(e.target.value)}>
            <option value="">Todos terminales</option>
            {terminales.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>

        <p className="text-sm text-gray-500">{count} bus(es) encontrado(s)</p>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">PPU</th>
                  <th className="table-header">N° Interno</th>
                  <th className="table-header hidden sm:table-cell">Modelo</th>
                  <th className="table-header hidden md:table-cell">Terminal habitual</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header hidden lg:table-cell">Creado</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <span className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        Cargando...
                      </div>
                    </td>
                  </tr>
                ) : buses.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon={Bus} title="Sin buses" description="No se encontraron buses" />
                    </td>
                  </tr>
                ) : (
                  buses.map(bus => (
                    <tr key={bus.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${!bus.activo ? 'opacity-50' : ''}`}>
                      <td className="table-cell font-bold text-gray-900">{bus.ppu}</td>
                      <td className="table-cell">{bus.numero_interno}</td>
                      <td className="table-cell hidden sm:table-cell text-gray-500">{bus.modelo?.nombre || '—'}</td>
                      <td className="table-cell hidden md:table-cell text-gray-500">{bus.terminal?.nombre || '—'}</td>
                      <td className="table-cell">
                        <BoolBadge value={bus.activo} trueLabel="Activo" falseLabel="Inactivo"
                          falseClass="bg-gray-100 text-gray-500 border border-gray-200" />
                      </td>
                      <td className="table-cell hidden lg:table-cell text-gray-400 text-xs">{formatDate(bus.created_at?.split('T')[0])}</td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(bus)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleActivo(bus)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                              ${bus.activo
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                          >
                            <Power size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editBus ? `Editar bus ${editBus.ppu}` : 'Nuevo bus'}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : editBus ? 'Actualizar' : 'Crear bus'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">PPU</label>
            <input
              className="input uppercase"
              value={form.ppu}
              onChange={e => setForm(f => ({ ...f, ppu: e.target.value.toUpperCase() }))}
              placeholder="Ej: BJRT45"
            />
          </div>
          <div>
            <label className="label">Número interno</label>
            <input
              className="input uppercase"
              value={form.numero_interno}
              onChange={e => setForm(f => ({ ...f, numero_interno: e.target.value.toUpperCase() }))}
              placeholder="Ej: 1042"
            />
          </div>
          <div>
            <label className="label">Modelo de bus</label>
            <select className="select" value={form.modelo_id} onChange={e => setForm(f => ({ ...f, modelo_id: e.target.value }))}>
              <option value="">Sin modelo</option>
              {modelos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Terminal habitual</label>
            <select className="select" value={form.terminal_habitual_id} onChange={e => setForm(f => ({ ...f, terminal_habitual_id: e.target.value }))}>
              <option value="">Sin terminal</option>
              {terminales.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="activo" className="text-sm text-gray-700 cursor-pointer">Bus activo</label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
