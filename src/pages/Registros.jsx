import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Download, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Header from '../components/layout/Header'
import EmptyState from '../components/ui/EmptyState'
import { DiscoBadge, CandadoBadge, BoolBadge } from '../components/ui/StatusBadge'
import { TableSkeleton } from '../components/ui/LoadingSkeleton'
import { getRevisiones } from '../services/revisionService'
import { getModelosBus, getTerminales } from '../services/configService'
import { exportRevisionesToXLSX } from '../services/exportService'
import { formatDate, formatTime } from '../utils/dateUtils'
import { ClipboardList } from 'lucide-react'

const LIMIT = 30

export default function Registros({ onMenuToggle, toast }) {
  const [registros, setRegistros] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [modelos, setModelos] = useState([])
  const [terminales, setTerminales] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [filters, setFilters] = useState({
    search: '', fecha_desde: '', fecha_hasta: '',
    terminal_id: '', modelo_id: '', tiene_disco: '',
    tiene_candado: '', tiene_seguridad_extra: '', cerraduras_malas: '',
    semana_actual: false
  })
  const [appliedFilters, setAppliedFilters] = useState({ ...filters })

  useEffect(() => {
    Promise.all([getModelosBus(), getTerminales()]).then(([m, t]) => {
      setModelos(m); setTerminales(t)
    }).catch(console.error)
  }, [])

  const load = useCallback(async (f = appliedFilters, p = page) => {
    setLoading(true)
    try {
      const { data, count } = await getRevisiones({ ...f, page: p, limit: LIMIT })
      setRegistros(data)
      setCount(count)
    } catch (e) {
      toast?.error('Error al cargar registros: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page, toast])

  useEffect(() => { load() }, [page])

  const handleApplyFilters = () => {
    setPage(0)
    setAppliedFilters({ ...filters })
    load(filters, 0)
    setShowFilters(false)
  }

  const handleClearFilters = () => {
    const cleared = { search: '', fecha_desde: '', fecha_hasta: '', terminal_id: '', modelo_id: '', tiene_disco: '', tiene_candado: '', tiene_seguridad_extra: '', cerraduras_malas: '', semana_actual: false }
    setFilters(cleared)
    setAppliedFilters(cleared)
    setPage(0)
    load(cleared, 0)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data } = await getRevisiones({ ...appliedFilters, page: 0, limit: 9999 })
      exportRevisionesToXLSX(data, 'revision_rack')
      toast?.success('Archivo XLSX exportado')
    } catch (e) {
      toast?.error('Error al exportar: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  const setF = (key, value) => setFilters(f => ({ ...f, [key]: value }))

  const conDisco = registros.filter(r => r.tiene_disco).length
  const sinDisco = registros.filter(r => !r.tiene_disco).length
  const posibleRobo = registros.filter(r => r.motivo_sin_disco === 'POSIBLE_ROBO').length
  const srl = registros.filter(r => r.motivo_sin_disco === 'RETIRADO_SRL').length
  const conCandado = registros.filter(r => r.tiene_candado).length

  const totalPages = Math.ceil(count / LIMIT)

  return (
    <div>
      <Header
        title="Registros"
        subtitle="Historial completo de revisiones de rack"
        onMenuToggle={onMenuToggle}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`btn btn-secondary btn-sm ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
            >
              <Filter size={14} />
              <span className="hidden sm:inline">Filtros</span>
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="btn btn-secondary btn-sm"
            >
              <Download size={14} />
              <span className="hidden sm:inline">{exporting ? 'Exportando...' : 'XLSX'}</span>
            </button>
          </div>
        }
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Buscar por PPU o número interno..."
            value={filters.search}
            onChange={e => {
              setF('search', e.target.value)
              if (!e.target.value) {
                const newF = { ...filters, search: '' }
                setAppliedFilters(newF)
                load(newF, 0)
              }
            }}
            onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
          />
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="label">Fecha desde</label>
                <input type="date" className="input" value={filters.fecha_desde} onChange={e => setF('fecha_desde', e.target.value)} />
              </div>
              <div>
                <label className="label">Fecha hasta</label>
                <input type="date" className="input" value={filters.fecha_hasta} onChange={e => setF('fecha_hasta', e.target.value)} />
              </div>
              <div>
                <label className="label">Terminal</label>
                <select className="select" value={filters.terminal_id} onChange={e => setF('terminal_id', e.target.value)}>
                  <option value="">Todos</option>
                  {terminales.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Modelo</label>
                <select className="select" value={filters.modelo_id} onChange={e => setF('modelo_id', e.target.value)}>
                  <option value="">Todos</option>
                  {modelos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Disco</label>
                <select className="select" value={filters.tiene_disco} onChange={e => setF('tiene_disco', e.target.value)}>
                  <option value="">Todos</option>
                  <option value="true">Con disco</option>
                  <option value="false">Sin disco</option>
                </select>
              </div>
              <div>
                <label className="label">Candado</label>
                <select className="select" value={filters.tiene_candado} onChange={e => setF('tiene_candado', e.target.value)}>
                  <option value="">Todos</option>
                  <option value="true">Con candado</option>
                  <option value="false">Sin candado</option>
                </select>
              </div>
              <div>
                <label className="label">Seguridad extra</label>
                <select className="select" value={filters.tiene_seguridad_extra} onChange={e => setF('tiene_seguridad_extra', e.target.value)}>
                  <option value="">Todos</option>
                  <option value="true">Con seguridad</option>
                  <option value="false">Sin seguridad</option>
                </select>
              </div>
              <div>
                <label className="label">Cerraduras</label>
                <select className="select" value={filters.cerraduras_malas} onChange={e => setF('cerraduras_malas', e.target.value)}>
                  <option value="">Todas</option>
                  <option value="true">Con cerraduras malas</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded" checked={filters.semana_actual} onChange={e => setF('semana_actual', e.target.checked)} />
                Solo semana actual
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleApplyFilters} className="btn-primary btn-sm">Aplicar filtros</button>
              <button type="button" onClick={handleClearFilters} className="btn btn-secondary btn-sm">
                <X size={14} /> Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Counters */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Total', value: count, className: 'bg-gray-100 text-gray-700' },
            { label: 'Con disco', value: conDisco, className: 'bg-green-100 text-green-700' },
            { label: 'Sin disco', value: sinDisco, className: 'bg-red-100 text-red-700' },
            { label: 'Posible robo', value: posibleRobo, className: 'bg-red-100 text-red-700' },
            { label: 'SRL', value: srl, className: 'bg-blue-100 text-blue-700' },
            { label: 'Con candado', value: conCandado, className: 'bg-green-100 text-green-700' }
          ].map((c, i) => (
            <span key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${c.className}`}>
              {c.label}: {c.value}
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Fecha / Hora</th>
                  <th className="table-header">PPU</th>
                  <th className="table-header">N° Interno</th>
                  <th className="table-header hidden sm:table-cell">Modelo</th>
                  <th className="table-header hidden md:table-cell">Terminal</th>
                  <th className="table-header">Disco</th>
                  <th className="table-header hidden lg:table-cell">Candado</th>
                  <th className="table-header hidden xl:table-cell">Seg. extra</th>
                  <th className="table-header hidden xl:table-cell">Cerr. malas</th>
                  <th className="table-header hidden lg:table-cell">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-6">
                      <TableSkeleton rows={8} cols={8} />
                    </td>
                  </tr>
                ) : registros.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <EmptyState
                        icon={ClipboardList}
                        title="Sin registros"
                        description="No se encontraron revisiones con los filtros aplicados"
                      />
                    </td>
                  </tr>
                ) : (
                  registros.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                      <td className="table-cell whitespace-nowrap">
                        <p className="font-medium">{formatDate(r.fecha_revision)}</p>
                        <p className="text-xs text-gray-400">{formatTime(r.hora_revision)}</p>
                      </td>
                      <td className="table-cell font-semibold text-gray-900">{r.ppu || r.buses?.ppu}</td>
                      <td className="table-cell">{r.numero_interno || r.buses?.numero_interno}</td>
                      <td className="table-cell hidden sm:table-cell text-gray-500">{r.modelos_bus?.nombre || '—'}</td>
                      <td className="table-cell hidden md:table-cell text-gray-500">{r.terminales?.nombre || '—'}</td>
                      <td className="table-cell">
                        <DiscoBadge tieneDisco={r.tiene_disco} motivo={r.motivo_sin_disco} />
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        <CandadoBadge tieneCandado={r.tiene_candado} />
                      </td>
                      <td className="table-cell hidden xl:table-cell">
                        <BoolBadge value={r.tiene_seguridad_extra} trueLabel="Sí" falseLabel="No" />
                      </td>
                      <td className="table-cell hidden xl:table-cell">
                        {r.cantidad_cerraduras_malas > 0 ? (
                          <span className="badge bg-red-100 text-red-700 border border-red-200">{r.cantidad_cerraduras_malas} mala(s)</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="table-cell hidden lg:table-cell text-gray-500 text-xs">{r.usuario_id || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Mostrando {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, count)} de {count}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-600 px-2 py-1.5">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
