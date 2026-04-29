import { supabase } from '../lib/supabase'
import { getWeekBounds } from '../utils/dateUtils'

export const createRevision = async (revisionData, cerraduras = []) => {
  const { data: revision, error } = await supabase
    .from('revisiones_rack')
    .insert([revisionData])
    .select()
    .single()
  if (error) throw error

  if (cerraduras.length > 0) {
    const items = cerraduras.map(c => ({
      revision_id: revision.id,
      cerradura_modelo_id: c.cerradura_modelo_id || null,
      nombre_cerradura: c.nombre_cerradura,
      estado: c.estado,
      observacion: c.observacion || null
    }))
    const { error: cErr } = await supabase.from('revision_cerraduras').insert(items)
    if (cErr) throw cErr
  }

  return revision
}

export const getRevisionById = async (id) => {
  const { data, error } = await supabase
    .from('revisiones_rack')
    .select(`
      *,
      buses(ppu, numero_interno),
      modelos_bus(nombre),
      terminales(nombre),
      revision_cerraduras(*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const getLastRevision = async (busId) => {
  const { data, error } = await supabase
    .from('revisiones_rack')
    .select(`*, terminales(nombre)`)
    .eq('bus_id', busId)
    .order('fecha_revision', { ascending: false })
    .order('hora_revision', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export const getRevisionesByBus = async (busId, limit = 10) => {
  const { data, error } = await supabase
    .from('revisiones_rack')
    .select(`*, terminales(nombre)`)
    .eq('bus_id', busId)
    .order('fecha_revision', { ascending: false })
    .order('hora_revision', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export const checkWeeklyRevision = async (busId) => {
  const { start, end } = getWeekBounds()
  const { data, error } = await supabase
    .from('revisiones_rack')
    .select(`*, terminales(nombre)`)
    .eq('bus_id', busId)
    .gte('fecha_revision', start)
    .lte('fecha_revision', end)
    .order('fecha_revision', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export const getRevisiones = async ({
  fecha_desde,
  fecha_hasta,
  terminal_id,
  modelo_id,
  tiene_disco,
  tiene_candado,
  tiene_seguridad_extra,
  cerraduras_malas,
  search,
  semana_actual,
  page = 0,
  limit = 50
} = {}) => {
  let query = supabase
    .from('revisiones_rack')
    .select(`
      *,
      buses(ppu, numero_interno),
      modelos_bus(nombre),
      terminales(nombre),
      revision_cerraduras(id, nombre_cerradura, estado)
    `, { count: 'exact' })
    .order('fecha_revision', { ascending: false })
    .order('hora_revision', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (semana_actual) {
    const { start, end } = getWeekBounds()
    query = query.gte('fecha_revision', start).lte('fecha_revision', end)
  } else {
    if (fecha_desde) query = query.gte('fecha_revision', fecha_desde)
    if (fecha_hasta) query = query.lte('fecha_revision', fecha_hasta)
  }
  if (terminal_id) query = query.eq('terminal_id', terminal_id)
  if (modelo_id) query = query.eq('modelo_id', modelo_id)
  if (tiene_disco !== undefined && tiene_disco !== '') query = query.eq('tiene_disco', tiene_disco === 'true' || tiene_disco === true)
  if (tiene_candado !== undefined && tiene_candado !== '') query = query.eq('tiene_candado', tiene_candado === 'true' || tiene_candado === true)
  if (tiene_seguridad_extra !== undefined && tiene_seguridad_extra !== '') query = query.eq('tiene_seguridad_extra', tiene_seguridad_extra === 'true' || tiene_seguridad_extra === true)
  if (cerraduras_malas === 'true') query = query.gt('cantidad_cerraduras_malas', 0)
  if (search) query = query.or(`ppu.ilike.%${search}%,numero_interno.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}

export const getRevisionesStats = async (filters = {}) => {
  const { data } = await getRevisiones({ ...filters, page: 0, limit: 9999 })
  const total = data.length
  const conDisco = data.filter(r => r.tiene_disco).length
  const sinDisco = data.filter(r => !r.tiene_disco).length
  const posibleRobo = data.filter(r => r.motivo_sin_disco === 'POSIBLE_ROBO').length
  const retiradasSRL = data.filter(r => r.motivo_sin_disco === 'RETIRADO_SRL').length
  const conCandado = data.filter(r => r.tiene_candado).length
  const sinCandado = data.filter(r => !r.tiene_candado).length
  const conSeguridadExtra = data.filter(r => r.tiene_seguridad_extra).length
  const cerrMalas = data.filter(r => r.cantidad_cerraduras_malas > 0).length
  return {
    total, conDisco, sinDisco, posibleRobo, retiradasSRL,
    conCandado, sinCandado, conSeguridadExtra, cerrMalas
  }
}

export const getEvolucionTemporal = async (dias = 30) => {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  const fechaDesde = desde.toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('revisiones_rack')
    .select('fecha_revision, tiene_disco, motivo_sin_disco')
    .gte('fecha_revision', fechaDesde)
    .order('fecha_revision')
  if (error) throw error
  const byDate = {}
  for (const r of (data || [])) {
    if (!byDate[r.fecha_revision]) byDate[r.fecha_revision] = { fecha: r.fecha_revision, con_disco: 0, sin_disco: 0, posible_robo: 0 }
    if (r.tiene_disco) byDate[r.fecha_revision].con_disco++
    else {
      byDate[r.fecha_revision].sin_disco++
      if (r.motivo_sin_disco === 'POSIBLE_ROBO') byDate[r.fecha_revision].posible_robo++
    }
  }
  return Object.values(byDate)
}
