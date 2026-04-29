import { useState, useEffect, useCallback } from 'react'
import {
  Bus, Disc, AlertTriangle, CheckCircle, Lock,
  ShieldCheck, Wrench, TrendingUp, DollarSign,
  Ticket, BarChart2, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import Header from '../components/layout/Header'
import KPICard from '../components/ui/KPICard'
import { KPISkeleton } from '../components/ui/LoadingSkeleton'
import { getDashboardKPIs, getRevisionByTerminal, getModelosVulnerabilidad } from '../services/dashboardService'
import { getEvolucionTemporal } from '../services/revisionService'
import { getConfig } from '../services/configService'
import { formatCurrency } from '../utils/formatters'
import { formatDate } from '../utils/dateUtils'

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#0891b2', '#7c3aed']

export default function Dashboard({ onMenuToggle }) {
  const [kpis, setKpis] = useState(null)
  const [terminales, setTerminales] = useState([])
  const [modelos, setModelos] = useState([])
  const [evolucion, setEvolucion] = useState([])
  const [valorDisco, setValorDisco] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [kData, tData, mData, eData, vDisco] = await Promise.all([
        getDashboardKPIs(),
        getRevisionByTerminal(),
        getModelosVulnerabilidad(),
        getEvolucionTemporal(30),
        getConfig('valor_unitario_disco')
      ])
      setKpis(kData)
      setTerminales(tData)
      setModelos(mData)
      setEvolucion(eData)
      setValorDisco(vDisco || '')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const discoData = kpis ? [
    { name: 'Con disco', value: kpis.conDisco, color: '#16a34a' },
    { name: 'Sin disco SRL', value: kpis.retiradoSRL, color: '#2563eb' },
    { name: 'Posible robo', value: kpis.posibleRobo, color: '#dc2626' },
    { name: 'Sin disco', value: kpis.sinDisco - kpis.retiradoSRL - kpis.posibleRobo, color: '#9ca3af' }
  ].filter(d => d.value > 0) : []

  const candadoData = kpis ? [
    { name: 'Con candado', value: kpis.conCandado },
    { name: 'Sin candado', value: kpis.sinCandado }
  ] : []

  const impactoEconomico = kpis && valorDisco
    ? kpis.posibleRobo * Number(valorDisco)
    : null

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Resumen operacional del sistema de revisión de racks"
        onMenuToggle={onMenuToggle}
        actions={
          <button onClick={load} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* KPIs Row 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 lg:gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <KPISkeleton key={i} />)
          ) : kpis ? (
            <>
              <KPICard title="Buses registrados"     value={kpis.totalBuses}      icon={Bus}         color="blue"  />
              <KPICard title="Total revisiones"       value={kpis.totalRevisiones} icon={BarChart2}   color="sky"   />
              <KPICard title="Revisiones esta semana" value={kpis.revSemana}       icon={CheckCircle} color="green" />
              <KPICard title="Con disco"              value={kpis.conDisco}        icon={Disc}        color="green" />
              <KPICard title="Sin disco"              value={kpis.sinDisco}        icon={Disc}        color="red"   subtitle={`${kpis.posibleRobo} posible robo · ${kpis.retiradoSRL} SRL`} />
              <KPICard title="Posible robo"           value={kpis.posibleRobo}     icon={AlertTriangle} color="red" />
              <KPICard title="Enviados a SRL"         value={kpis.retiradoSRL}     icon={Wrench}      color="sky"   />
              <KPICard title="Con candado"            value={kpis.conCandado}      icon={Lock}        color="green" subtitle={`${kpis.sinCandado} sin candado`} />
            </>
          ) : null}
        </div>

        {/* KPIs Row 2 */}
        {!loading && kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            <KPICard title="Seguridad extra"      value={kpis.conSegExtra}    icon={ShieldCheck}  color="green"  subtitle={`${kpis.sinSegExtra} sin seguridad extra`} />
            <KPICard title="Cerraduras malas"     value={kpis.cerrMalas}      icon={AlertTriangle} color="amber" />
            <KPICard title="Tickets abiertos"     value={kpis.ticketsAbiertos} icon={Ticket}      color="red"   subtitle={`${kpis.ticketsCerrados} cerrados`} />
            <KPICard
              title="Impacto económico estimado"
              value={impactoEconomico !== null ? formatCurrency(impactoEconomico) : (valorDisco ? formatCurrency(0) : 'Sin config.')}
              icon={DollarSign}
              color="violet"
              subtitle={valorDisco ? `${kpis.posibleRobo} disco(s) × ${formatCurrency(valorDisco)}` : 'Configure valor del disco'}
            />
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Evolución temporal */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Evolución últimos 30 días</h3>
            {evolucion.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolucion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={d => formatDate(d)} />
                  <Legend />
                  <Line type="monotone" dataKey="con_disco"    name="Con disco"    stroke="#16a34a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sin_disco"    name="Sin disco"    stroke="#dc2626" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="posible_robo" name="Posible robo" stroke="#d97706" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                Sin datos suficientes
              </div>
            )}
          </div>

          {/* Estado de discos */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Estado de discos</h3>
            {discoData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={discoData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {discoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {discoData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-gray-600">{d.name}: <span className="font-bold">{d.value}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400">Sin datos</div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revisiones por terminal */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Revisiones por terminal</h3>
            {terminales.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={terminales} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="terminal" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total"     name="Total"     fill="#2563eb" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="sin_disco" name="Sin disco" fill="#dc2626" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400">Sin datos</div>
            )}
          </div>

          {/* Candados */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Estado de candados</h3>
            {candadoData.some(d => d.value > 0) ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={candadoData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      <Cell fill="#16a34a" />
                      <Cell fill="#d97706" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <span className="text-xs text-gray-600">Con candado: <span className="font-bold">{kpis?.conCandado ?? 0}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs text-gray-600">Sin candado: <span className="font-bold">{kpis?.sinCandado ?? 0}</span></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400">Sin datos</div>
            )}
          </div>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Modelos con más vulnerabilidad */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Modelos con más incidentes</h3>
            {modelos.length > 0 ? (
              <div className="space-y-2">
                {modelos.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-800">{m.modelo}</span>
                        <span className="text-xs text-gray-500">{m.sin_disco} sin disco</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full transition-all"
                          style={{ width: m.total > 0 ? `${(m.sin_disco / m.total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{m.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-sm text-gray-400">Sin datos</div>
            )}
          </div>

          {/* Terminales con más incidentes */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Terminales con más incidentes</h3>
            {terminales.filter(t => t.sin_disco > 0).length > 0 ? (
              <div className="space-y-2">
                {terminales.filter(t => t.sin_disco > 0).slice(0, 6).map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-800">{t.terminal}</span>
                        <span className="text-xs text-gray-500">{t.sin_disco} sin disco</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: t.total > 0 ? `${(t.sin_disco / t.total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-sm text-gray-400">Sin incidentes registrados</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
