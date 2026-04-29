import { supabase } from '../lib/supabase'
import { getWeekBounds } from '../utils/dateUtils'

export const getDashboardKPIs = async () => {
  const { start: wStart, end: wEnd } = getWeekBounds()

  const [
    busesRes,
    revisionesRes,
    revSemanaRes,
    sinDiscoRes,
    robosRes,
    srlRes,
    candadoRes,
    segExtraRes,
    cerrMalasRes,
    ticketsRes
  ] = await Promise.all([
    supabase.from('buses').select('id', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('revisiones_rack').select('id', { count: 'exact', head: true }),
    supabase.from('revisiones_rack').select('id', { count: 'exact', head: true })
      .gte('fecha_revision', wStart).lte('fecha_revision', wEnd),
    supabase.from('revisiones_rack').select('id,motivo_sin_disco', { count: 'exact' }).eq('tiene_disco', false),
    supabase.from('revisiones_rack').select('id', { count: 'exact', head: true })
      .eq('tiene_disco', false).eq('motivo_sin_disco', 'POSIBLE_ROBO'),
    supabase.from('revisiones_rack').select('id', { count: 'exact', head: true })
      .eq('tiene_disco', false).eq('motivo_sin_disco', 'RETIRADO_SRL'),
    supabase.from('revisiones_rack').select('id', { count: 'exact', head: true }).eq('tiene_candado', true),
    supabase.from('revisiones_rack').select('id', { count: 'exact', head: true }).eq('tiene_seguridad_extra', true),
    supabase.from('revisiones_rack').select('id', { count: 'exact', head: true }).gt('cantidad_cerraduras_malas', 0),
    supabase.from('tickets_robo').select('id,estado,impacto_estimado')
  ])

  const totalRevisiones = revisionesRes.count || 0
  const totalBuses = busesRes.count || 0
  const revSemana = revSemanaRes.count || 0
  const sinDisco = sinDiscoRes.count || 0
  const conDisco = totalRevisiones > 0 ? totalRevisiones - sinDisco : 0
  const posibleRobo = robosRes.count || 0
  const retiradoSRL = srlRes.count || 0
  const conCandado = candadoRes.count || 0
  const sinCandado = totalRevisiones - conCandado
  const conSegExtra = segExtraRes.count || 0
  const sinSegExtra = totalRevisiones - conSegExtra
  const cerrMalas = cerrMalasRes.count || 0

  const tickets = ticketsRes.data || []
  const ticketsAbiertos = tickets.filter(t => t.estado === 'ABIERTO').length
  const ticketsCerrados = tickets.filter(t => t.estado === 'CERRADO').length
  const impactoTotal = tickets
    .filter(t => ['ABIERTO', 'EN_REVISION'].includes(t.estado))
    .reduce((s, t) => s + (Number(t.impacto_estimado) || 0), 0)

  return {
    totalBuses, totalRevisiones, revSemana,
    conDisco, sinDisco, posibleRobo, retiradoSRL,
    conCandado, sinCandado, conSegExtra, sinSegExtra,
    cerrMalas, ticketsAbiertos, ticketsCerrados, impactoTotal
  }
}

export const getRevisionByTerminal = async () => {
  const { data, error } = await supabase
    .from('revisiones_rack')
    .select('terminal_id, terminales(nombre), tiene_disco')
  if (error) throw error

  const map = {}
  for (const r of (data || [])) {
    const nombre = r.terminales?.nombre || 'Sin terminal'
    if (!map[nombre]) map[nombre] = { terminal: nombre, total: 0, sin_disco: 0 }
    map[nombre].total++
    if (!r.tiene_disco) map[nombre].sin_disco++
  }
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8)
}

export const getModelosVulnerabilidad = async () => {
  const { data, error } = await supabase
    .from('revisiones_rack')
    .select('modelo_id, modelos_bus(nombre), tiene_disco, cantidad_cerraduras_malas')
  if (error) throw error

  const map = {}
  for (const r of (data || [])) {
    const nombre = r.modelos_bus?.nombre || 'Sin modelo'
    if (!map[nombre]) map[nombre] = { modelo: nombre, sin_disco: 0, cerr_malas: 0, total: 0 }
    map[nombre].total++
    if (!r.tiene_disco) map[nombre].sin_disco++
    if (r.cantidad_cerraduras_malas > 0) map[nombre].cerr_malas++
  }
  return Object.values(map).sort((a, b) => b.sin_disco - a.sin_disco).slice(0, 6)
}
