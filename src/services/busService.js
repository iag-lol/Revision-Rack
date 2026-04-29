import { supabase } from '../lib/supabase'

export const searchBuses = async (query, field = 'ppu') => {
  if (!query || query.length < 1) return []
  const { data, error } = await supabase
    .from('buses')
    .select(`*, modelos_bus(id, nombre), terminales(id, nombre)`)
    .ilike(field, `%${query}%`)
    .eq('activo', true)
    .limit(8)
  if (error) throw error
  return data || []
}

export const getBusByPPU = async (ppu) => {
  const { data, error } = await supabase
    .from('buses')
    .select(`*, modelos_bus(id, nombre), terminales(id, nombre)`)
    .ilike('ppu', ppu.trim())
    .eq('activo', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export const getBusByNumeroInterno = async (numero) => {
  const { data, error } = await supabase
    .from('buses')
    .select(`*, modelos_bus(id, nombre), terminales(id, nombre)`)
    .ilike('numero_interno', numero.trim())
    .eq('activo', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export const getBusById = async (id) => {
  const { data, error } = await supabase
    .from('buses')
    .select(`*, modelos_bus(id, nombre), terminales(id, nombre)`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export const createBus = async (busData) => {
  const { data, error } = await supabase
    .from('buses')
    .insert([busData])
    .select(`*, modelos_bus(id, nombre), terminales(id, nombre)`)
    .single()
  if (error) throw error
  return data
}

export const updateBus = async (id, busData) => {
  const { data, error } = await supabase
    .from('buses')
    .update({ ...busData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`*, modelos_bus(id, nombre), terminales(id, nombre)`)
    .single()
  if (error) throw error
  return data
}

export const getAllBuses = async ({ search, modelo_id, terminal_id, activo, page = 0, limit = 50 } = {}) => {
  let query = supabase
    .from('buses')
    .select(`*, modelos_bus(id, nombre), terminales(id, nombre)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (activo !== undefined) query = query.eq('activo', activo)
  if (modelo_id) query = query.eq('modelo_id', modelo_id)
  if (terminal_id) query = query.eq('terminal_habitual_id', terminal_id)
  if (search) {
    query = query.or(`ppu.ilike.%${search}%,numero_interno.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}
