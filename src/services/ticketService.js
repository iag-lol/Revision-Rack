import { supabase } from '../lib/supabase'
import { generateTicketCode } from '../utils/formatters'

export const createTicket = async (ticketData) => {
  const codigo = generateTicketCode()
  const { data, error } = await supabase
    .from('tickets_robo')
    .insert([{ ...ticketData, codigo, estado: 'ABIERTO' }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const hasOpenTicket = async (busId) => {
  const { data, error } = await supabase
    .from('tickets_robo')
    .select('id, codigo, estado')
    .eq('bus_id', busId)
    .in('estado', ['ABIERTO', 'EN_REVISION'])
    .maybeSingle()
  if (error) throw error
  return data
}

export const getTickets = async ({
  estado,
  terminal_id,
  modelo_id,
  search,
  fecha_desde,
  fecha_hasta,
  page = 0,
  limit = 50
} = {}) => {
  let query = supabase
    .from('tickets_robo')
    .select(`
      *,
      buses(ppu, numero_interno),
      modelos_bus(nombre),
      terminales(nombre)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (estado) query = query.eq('estado', estado)
  if (terminal_id) query = query.eq('terminal_id', terminal_id)
  if (modelo_id) query = query.eq('modelo_id', modelo_id)
  if (fecha_desde) query = query.gte('fecha_alerta', fecha_desde)
  if (fecha_hasta) query = query.lte('fecha_alerta', fecha_hasta)
  if (search) query = query.or(`ppu.ilike.%${search}%,numero_interno.ilike.%${search}%,codigo.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}

export const getTicketById = async (id) => {
  const { data, error } = await supabase
    .from('tickets_robo')
    .select(`
      *,
      buses(ppu, numero_interno, modelo_id),
      modelos_bus(nombre),
      terminales(nombre)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const updateTicket = async (id, updates) => {
  const { data, error } = await supabase
    .from('tickets_robo')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const cerrarTicket = async (id, { observacion_cierre, usuario_cierra }) => {
  return updateTicket(id, {
    estado: 'CERRADO',
    fecha_cierre: new Date().toISOString(),
    observacion_cierre,
    usuario_cierra
  })
}

export const getTicketsStats = async () => {
  const { data, error } = await supabase
    .from('tickets_robo')
    .select('estado, impacto_estimado')
  if (error) throw error
  const abiertos = (data || []).filter(t => t.estado === 'ABIERTO').length
  const en_revision = (data || []).filter(t => t.estado === 'EN_REVISION').length
  const cerrados = (data || []).filter(t => t.estado === 'CERRADO').length
  const total_impacto = (data || [])
    .filter(t => ['ABIERTO', 'EN_REVISION'].includes(t.estado))
    .reduce((sum, t) => sum + (Number(t.impacto_estimado) || 0), 0)
  return { abiertos, en_revision, cerrados, total_impacto }
}
