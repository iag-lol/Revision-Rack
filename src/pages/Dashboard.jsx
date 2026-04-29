import { useState, useEffect, useCallback } from 'react'
import {
  Bus, Disc, AlertTriangle, CheckCircle, Lock,
  ShieldCheck, DollarSign, Ticket, RefreshCw,
  Activity, TrendingUp, Wrench, AlertCircle, MinusCircle
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import Header from '../components/layout/Header'
import {
  getDashboardKPIs,
  getRevisionByTerminal,
  getModelosVulnerabilidad,
  getRecentOpenTickets,
  getFleetStatus
} from '../services/dashboardService'
import { getEvolucionTemporal } from '../services/revisionService'
import { getConfig } from '../services/configService'
import { formatCurrency } from '../utils/formatters'
import { formatDate } from '../utils/dateUtils'

function calcHealthScore(fleet) {
  if (!fleet || fleet.total === 0) return 0
  const revisados = fleet.total - fleet.sinRevision
  if (revisados === 0) return 0
  return Math.round((fleet.conDisco / fleet.total) * 100)
}

function healthMeta(score) {
  if (score >= 80) return { label: 'Óptimo',    color: '#10b981', text: 'text-emerald-400' }
  if (score >= 60) return { label: 'Aceptable', color: '#f59e0b', text: 'text-amber-400'   }
  if (score >= 40) return { label: 'Degradado', color: '#f97316', text: 'text-orange-400'  }
  return               { label: 'Crítico',    color: '#ef4444', text: 'text-red-400'     }
}

function pct(n, d) { return d > 0 ? Math.round((n / d) * 100) : 0 }

function CircularGauge({ score, color }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="flex-shrink-0">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 55 55)" style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="55" y="51" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="system-ui">{score}</text>
      <text x="55" y="67" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="system-ui">/100</text>
    </svg>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 text-white rounded-lg p-3 shadow-xl text-xs border border-slate-700">
      <p className="font-semibold mb-1.5 text-slate-300">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function BusStatusBadge({ rev }) {
  if (!rev)                                   return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400">Sin revisión</span>
  if (rev.tiene_disco)                        return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Con disco</span>
  if (rev.motivo_sin_disco === 'POSIBLE_ROBO') return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Posible robo</span>
  if (rev.motivo_sin_disco === 'RETIRADO_SRL') return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">En SRL</span>
  return                                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">Sin disco</span>
}

export default function Dashboard({ onMenuToggle }) {
  const [kpis, setKpis]             = useState(null)
  const [fleet, setFleet]           = useState(null)
  const [terminales, setTerminales] = useState([])
  const [modelos, setModelos]       = useState([])
  const [evolucion, setEvolucion]   = useState([])
  const [tickets, setTickets]       = useState([])
  const [valorDisco, setValorDisco] = useState('')
  const [loading, setLoading]       = useState(true)

  const load = useCallback(async () => {
    const EMPTY_FLEET = { fleet: [], total: 0, conDisco: 0, sinDisco: 0, posibleRobo: 0, enSRL: 0, sinRevision: 0 }
    setLoading(true)
    // Each query fails independently — one error never blocks the others
    const safe = (fn, fallback) => Promise.resolve().then(fn).catch(e => { console.error(e); return fallback })

    const [kData, fData, tData, mData, eData, tkData, vDisco] = await Promise.all([
      safe(getDashboardKPIs,           null),
      safe(getFleetStatus,             EMPTY_FLEET),
      safe(getRevisionByTerminal,      []),
      safe(getModelosVulnerabilidad,   []),
      safe(() => getEvolucionTemporal(30),    []),
      safe(() => getRecentOpenTickets(5),     []),
      safe(() => getConfig('valor_unitario_disco'), '')
    ])

    setKpis(kData)
    setFleet(fData)
    setTerminales(tData)
    setModelos(mData)
    setEvolucion(eData)
    setTickets(tkData)
    setValorDisco(vDisco || '')
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const healthScore = fleet ? calcHealthScore(fleet) : 0
  const meta        = healthMeta(healthScore)
  const impacto     = kpis && valorDisco ? kpis.posibleRobo * Number(valorDisco) : null

  const discoData = fleet ? [
    { name: 'Con disco',    value: fleet.conDisco,    color: '#10b981' },
    { name: 'En SRL',       value: fleet.enSRL,       color: '#3b82f6' },
    { name: 'Posible robo', value: fleet.posibleRobo, color: '#ef4444' },
    { name: 'Sin revisión', value: fleet.sinRevision, color: '#e2e8f0' },
    { name: 'Sin disco',    value: Math.max(0, fleet.sinDisco - fleet.posibleRobo - fleet.enSRL), color: '#f59e0b' }
  ].filter(d => d.value > 0) : []

  const discoPct   = fleet ? pct(fleet.conDisco,    fleet.total) : 0
  const sinDiscoPct = fleet ? pct(fleet.sinDisco,   fleet.total) : 0
  const sinRevPct  = fleet ? pct(fleet.sinRevision, fleet.total) : 0

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Centro de control operacional" onMenuToggle={onMenuToggle} />
        <div className="p-6 space-y-4">
          <div className="h-40 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Centro de control operacional"
        onMenuToggle={onMenuToggle}
        actions={
          <button onClick={load} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        }
      />

      {/* Critical alert banner */}
      {kpis?.ticketsAbiertos > 0 && (
        <div className="bg-red-600 text-white px-4 py-2.5 flex items-center gap-3">
          <AlertCircle size={18} className="animate-pulse flex-shrink-0" />
          <span className="text-sm font-medium">
            <span className="font-bold">
              {kpis.ticketsAbiertos} ticket{kpis.ticketsAbiertos > 1 ? 's' : ''} de robo abierto{kpis.ticketsAbiertos > 1 ? 's' : ''}
            </span>
            {impacto ? ` — Impacto estimado: ${formatCurrency(impacto)}` : ''}
          </span>
        </div>
      )}

      {/* ── Hero section ── */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">

            {/* Fleet Health Score — basado en buses reales */}
            <div className="flex items-center gap-5">
              <CircularGauge score={healthScore} color={meta.color} />
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-0.5">Salud de la Flota</p>
                <p className={`text-5xl font-black leading-none ${meta.text}`}>{healthScore}</p>
                <p className="text-white font-semibold text-sm mt-1">{meta.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">% buses con disco (última revisión)</p>
              </div>
            </div>

            {/* Fleet counters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-slate-400 text-xs">Buses activos</p>
                <p className="text-2xl font-black text-white">{fleet?.total ?? 0}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-slate-400 text-xs">Con disco</p>
                <p className="text-2xl font-black text-emerald-400">{fleet?.conDisco ?? 0}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-slate-400 text-xs">Sin disco</p>
                <p className="text-2xl font-black text-red-400">{fleet?.sinDisco ?? 0}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-slate-400 text-xs">Sin revisión</p>
                <p className="text-2xl font-black text-slate-400">{fleet?.sinRevision ?? 0}</p>
              </div>
            </div>

            {/* Economic impact + tickets */}
            <div className="space-y-3">
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={15} className="text-red-400" />
                  <span className="text-xs text-red-300 font-semibold uppercase tracking-wide">Impacto económico estimado</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {impacto !== null ? formatCurrency(impacto) : valorDisco ? formatCurrency(0) : '— Sin configurar'}
                </p>
                <p className="text-xs text-red-300 mt-0.5">
                  {fleet?.posibleRobo ?? 0} posible{fleet?.posibleRobo !== 1 ? 's' : ''} robo
                  {valorDisco ? ` × ${formatCurrency(valorDisco)}` : ''}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2.5">
                  <p className="text-xs text-red-300">Tickets</p>
                  <p className="text-xl font-black text-white">{kpis?.ticketsAbiertos ?? 0}</p>
                </div>
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-2.5">
                  <p className="text-xs text-amber-300">Robos</p>
                  <p className="text-xl font-black text-white">{fleet?.posibleRobo ?? 0}</p>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2.5">
                  <p className="text-xs text-blue-300">En SRL</p>
                  <p className="text-xl font-black text-white">{fleet?.enSRL ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="p-4 lg:p-6 space-y-5">

        {/* ── ESTADO ACTUAL DE LA FLOTA ── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Estado actual de la flota</h3>
              <p className="text-xs text-gray-400">Última revisión registrada por cada bus</p>
            </div>
            <Bus size={18} className="text-gray-300" />
          </div>

          {/* Fleet summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-blue-700">{fleet?.total ?? 0}</p>
              <p className="text-xs text-blue-500 mt-0.5 font-medium">Activos</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-emerald-700">{fleet?.conDisco ?? 0}</p>
              <p className="text-xs text-emerald-500 mt-0.5 font-medium">Con disco</p>
              <p className="text-xs text-emerald-400">{discoPct}%</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-red-700">{fleet?.sinDisco ?? 0}</p>
              <p className="text-xs text-red-500 mt-0.5 font-medium">Sin disco</p>
              <p className="text-xs text-red-400">{sinDiscoPct}%</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-700">{fleet?.posibleRobo ?? 0}</p>
              <p className="text-xs text-amber-500 mt-0.5 font-medium">Posible robo</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-dashed border-gray-200">
              <p className="text-2xl font-black text-gray-400">{fleet?.sinRevision ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Sin revisión</p>
              <p className="text-xs text-gray-300">{sinRevPct}%</p>
            </div>
          </div>

          {/* Fleet progress bar */}
          {fleet && fleet.total > 0 && (
            <div className="mb-5">
              <div className="flex h-3 rounded-full overflow-hidden gap-px bg-gray-100">
                {fleet.conDisco > 0 && (
                  <div className="bg-emerald-500 transition-all" style={{ width: `${pct(fleet.conDisco, fleet.total)}%` }} title={`Con disco: ${fleet.conDisco}`} />
                )}
                {fleet.enSRL > 0 && (
                  <div className="bg-blue-400 transition-all" style={{ width: `${pct(fleet.enSRL, fleet.total)}%` }} title={`En SRL: ${fleet.enSRL}`} />
                )}
                {fleet.posibleRobo > 0 && (
                  <div className="bg-red-500 transition-all" style={{ width: `${pct(fleet.posibleRobo, fleet.total)}%` }} title={`Posible robo: ${fleet.posibleRobo}`} />
                )}
                {(fleet.sinDisco - fleet.posibleRobo - fleet.enSRL) > 0 && (
                  <div className="bg-amber-400 transition-all" style={{ width: `${pct(Math.max(0, fleet.sinDisco - fleet.posibleRobo - fleet.enSRL), fleet.total)}%` }} />
                )}
                {fleet.sinRevision > 0 && (
                  <div className="bg-gray-200 transition-all" style={{ width: `${pct(fleet.sinRevision, fleet.total)}%` }} />
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {[
                  { color: 'bg-emerald-500', label: 'Con disco' },
                  { color: 'bg-blue-400',    label: 'En SRL' },
                  { color: 'bg-red-500',     label: 'Posible robo' },
                  { color: 'bg-amber-400',   label: 'Sin disco' },
                  { color: 'bg-gray-200 border border-gray-300', label: 'Sin revisión' },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                    <span className="text-xs text-gray-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fleet table */}
          {fleet && fleet.fleet.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-100">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">PPU</th>
                      <th className="py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">N° Int.</th>
                      <th className="py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Modelo</th>
                      <th className="py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Terminal</th>
                      <th className="py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado disco</th>
                      <th className="py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Última revisión</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {fleet.fleet.map(bus => (
                      <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-gray-900">{bus.ppu}</td>
                        <td className="py-2.5 px-3 text-gray-500 hidden sm:table-cell">{bus.numero_interno}</td>
                        <td className="py-2.5 px-3 text-gray-400 text-xs hidden md:table-cell">{bus.modelo}</td>
                        <td className="py-2.5 px-3 text-gray-400 text-xs hidden lg:table-cell">{bus.terminal}</td>
                        <td className="py-2.5 px-3"><BusStatusBadge rev={bus.ultima_revision} /></td>
                        <td className="py-2.5 px-3 text-gray-400 text-xs hidden md:table-cell">
                          {bus.ultima_revision ? formatDate(bus.ultima_revision.fecha_revision) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-gray-300">
              <Bus size={28} className="mb-1" />
              <span className="text-sm text-gray-400">No hay buses registrados</span>
            </div>
          )}
        </div>

        {/* ── Compliance progress bars ── */}
        <div className="card p-4 lg:p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Cobertura en revisiones históricas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: 'Revisiones con disco',        value: pct(kpis?.conDisco,    kpis?.totalRevisiones), count: kpis?.conDisco,    Icon: Disc        },
              { label: 'Revisiones con candado',       value: pct(kpis?.conCandado,  kpis?.totalRevisiones), count: kpis?.conCandado,  Icon: Lock        },
              { label: 'Revisiones con seg. extra',    value: pct(kpis?.conSegExtra, kpis?.totalRevisiones), count: kpis?.conSegExtra, Icon: ShieldCheck }
            ].map(({ label, value, count, Icon }, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{value ?? 0}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      (value ?? 0) >= 80 ? 'bg-emerald-500' : (value ?? 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${value ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{count ?? 0} de {kpis?.totalRevisiones ?? 0} revisiones totales</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trend chart + donut ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          <div className="lg:col-span-3 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Evolución últimos 30 días</h3>
                <p className="text-xs text-gray-400">Tendencia diaria de revisiones</p>
              </div>
              <Activity size={18} className="text-gray-300" />
            </div>
            {evolucion.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={evolucion} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                  <defs>
                    <linearGradient id="gradCon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRobo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} labelFormatter={d => formatDate(d)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="con_disco"    name="Con disco"    stroke="#10b981" strokeWidth={2} fill="url(#gradCon)"  dot={false} />
                  <Area type="monotone" dataKey="sin_disco"    name="Sin disco"    stroke="#64748b" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} />
                  <Area type="monotone" dataKey="posible_robo" name="Posible robo" stroke="#ef4444" strokeWidth={2} fill="url(#gradRobo)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                <TrendingUp size={32} className="mb-2" />
                <span className="text-sm">Sin datos suficientes</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Distribución de la flota</h3>
                <p className="text-xs text-gray-400">Estado actual por bus</p>
              </div>
              <Disc size={18} className="text-gray-300" />
            </div>
            {discoData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={discoData} cx="50%" cy="50%" innerRadius={52} outerRadius={75} paddingAngle={3} dataKey="value">
                      {discoData.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [`${v} bus${v !== 1 ? 'es' : ''}`, name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 mt-1">
                  {discoData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-gray-500">{d.name}</span>
                      <span className="text-xs font-bold text-gray-800 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                <Disc size={32} className="mb-2" />
                <span className="text-sm">Sin datos</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Terminal performance + recent tickets ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Rendimiento por terminal</h3>
              <span className="text-xs text-gray-400">Total · sin disco</span>
            </div>
            {terminales.length > 0 ? (
              <div className="space-y-3">
                {terminales.map((t, i) => {
                  const incPct = pct(t.sin_disco, t.total)
                  const barW = terminales[0].total > 0 ? `${(t.total / terminales[0].total) * 100}%` : '0%'
                  const [barColor, badge, badgeLabel] =
                    incPct < 10
                      ? ['bg-emerald-500', 'bg-emerald-100 text-emerald-700', 'Óptimo']
                      : incPct < 25
                        ? ['bg-amber-500',  'bg-amber-100 text-amber-700',   'Alerta']
                        : ['bg-red-500',    'bg-red-100 text-red-700',       'Crítico']
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                          <span className="text-sm font-medium text-gray-800">{t.terminal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${badge}`}>{badgeLabel}</span>
                          <span className="text-xs text-gray-400">{t.total} · {t.sin_disco}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: barW }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Sin datos</div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Tickets abiertos recientes</h3>
              {kpis?.ticketsAbiertos > 0 && (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                  <AlertCircle size={11} />
                  {kpis.ticketsAbiertos} activo{kpis.ticketsAbiertos > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {tickets.length > 0 ? (
              <div className="space-y-2">
                {tickets.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-red-50 border border-red-100">
                    <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={13} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gray-800">{t.codigo}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          t.estado === 'ABIERTO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {t.estado === 'ABIERTO' ? 'Abierto' : 'En revisión'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {t.buses?.ppu || '—'}
                        {t.buses?.numero_interno ? ` · NI ${t.buses.numero_interno}` : ''}
                        {t.terminales?.nombre ? ` · ${t.terminales.nombre}` : ''}
                      </p>
                    </div>
                    {t.impacto_estimado ? (
                      <span className="text-xs font-black text-red-600 flex-shrink-0">{formatCurrency(t.impacto_estimado)}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                <CheckCircle size={32} className="mb-2 text-emerald-400" />
                <span className="text-sm text-gray-500">Sin tickets abiertos</span>
                <span className="text-xs text-gray-300 mt-0.5">La flota está en orden</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Model vulnerability + other indicators ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Vulnerabilidad por modelo</h3>
              <span className="text-xs text-gray-400">% revisiones sin disco</span>
            </div>
            {modelos.length > 0 ? (
              <div className="space-y-3">
                {modelos.map((m, i) => {
                  const p = pct(m.sin_disco, m.total)
                  const barColor = p > 30 ? '#ef4444' : p > 15 ? '#f97316' : '#f59e0b'
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                          <span className="text-sm font-medium text-gray-800">{m.modelo}</span>
                        </div>
                        <div>
                          <span className="text-xs font-black text-gray-800">{p}%</span>
                          <span className="text-xs text-gray-400 ml-1">({m.sin_disco}/{m.total})</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, background: barColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-gray-300 text-sm">Sin datos</div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Otros indicadores</h3>
            <div className="space-y-3">
              {[
                { label: 'Cerraduras malas',    value: kpis?.cerrMalas   ?? 0, Icon: AlertTriangle, bg: 'bg-amber-50',  iconBg: 'bg-amber-500',  textColor: 'text-amber-600',  desc: 'revisiones con cerraduras en mal estado' },
                { label: 'Sin seguridad extra', value: kpis?.sinSegExtra ?? 0, Icon: MinusCircle,   bg: 'bg-slate-50',  iconBg: 'bg-slate-400',  textColor: 'text-slate-600',  desc: 'revisiones sin seguridad extra'          },
                { label: 'Sin candado',         value: kpis?.sinCandado  ?? 0, Icon: Lock,          bg: 'bg-orange-50', iconBg: 'bg-orange-500', textColor: 'text-orange-600', desc: 'revisiones sin candado instalado'        },
                { label: 'Enviados a SRL',      value: fleet?.enSRL      ?? 0, Icon: Wrench,        bg: 'bg-blue-50',   iconBg: 'bg-blue-500',   textColor: 'text-blue-600',   desc: 'buses con disco en servicio técnico'    }
              ].map(({ label, value, Icon, bg, iconBg, textColor, desc }, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${bg}`}>
                  <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <span className={`text-2xl font-black ${textColor}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
