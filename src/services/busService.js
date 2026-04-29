import { supabase } from '../lib/supabase'

const BUS_SELECT = `
  id,
  ppu,
  numero_interno,
  modelo_id,
  terminal_habitual_id,
  activo,
  created_at,
  updated_at,
  modelo:modelos_bus (
    id,
    nombre
  ),
  terminal:terminales (
    id,
    nombre
  )
`

const normalizeBusqueda = (value = '') => value.toString().trim().toUpperCase()

export const searchBuses = async (query) => {
  const busqueda = normalizeBusqueda(query)
  if (!busqueda) return []

  const { data, error } = await supabase
    .from('buses')
    .select(BUS_SELECT)
    .or(`ppu.ilike.%${busqueda}%,numero_interno.ilike.%${busqueda}%`)
    .eq('activo', true)
    .limit(8)

  if (error) throw error
  return data || []
}

export const getActiveBusByBusqueda = async (query) => {
  const busqueda = normalizeBusqueda(query)
  if (!busqueda) return null

  const { data, error } = await supabase
    .from('buses')
    .select(BUS_SELECT)
    .or(`ppu.eq.${busqueda},numero_interno.eq.${busqueda}`)
    .eq('activo', true)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getBusByPPU = async (ppu) => {
  return getActiveBusByBusqueda(ppu)
}

export const getBusByNumeroInterno = async (numero) => {
  return getActiveBusByBusqueda(numero)
}

export const getBusById = async (id) => {
  const { data, error } = await supabase
    .from('buses')
    .select(BUS_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export const createBus = async (busData) => {
  const { data, error } = await supabase
    .from('buses')
    .insert([busData])
    .select(BUS_SELECT)
    .single()
  if (error) throw error
  return data
}

export const updateBus = async (id, busData) => {
  const { data, error } = await supabase
    .from('buses')
    .update({ ...busData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(BUS_SELECT)
    .single()
  if (error) throw error
  return data
}

export const getAllBuses = async ({ search, modelo_id, terminal_id, terminal_habitual_id, activo, page = 0, limit = 50 } = {}) => {
  const busqueda = normalizeBusqueda(search)
  const terminalFilter = terminal_habitual_id || terminal_id

  let query = supabase
    .from('buses')
    .select(BUS_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (activo !== undefined) query = query.eq('activo', activo)
  if (modelo_id) query = query.eq('modelo_id', modelo_id)
  if (terminalFilter) query = query.eq('terminal_habitual_id', terminalFilter)
  if (busqueda) {
    query = query.or(`ppu.ilike.%${busqueda}%,numero_interno.ilike.%${busqueda}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}
