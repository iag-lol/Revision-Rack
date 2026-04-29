import { supabase } from '../lib/supabase'

export const createCasoSRL = async (data) => {
  const { data: caso, error } = await supabase
    .from('casos_srl')
    .insert([{ ...data, estado: data.estado || 'PENDIENTE_ENVIO' }])
    .select()
    .single()
  if (error) throw error
  return caso
}

export const hasOpenCasoSRL = async (busId) => {
  const { data, error } = await supabase
    .from('casos_srl')
    .select('id, estado, motivo, fecha_retiro')
    .eq('bus_id', busId)
    .not('estado', 'in', '(REPUESTO_BUS,CERRADO)')
    .maybeSingle()
  if (error) throw error
  return data
}

export const getCasosSRL = async ({
  estado,
  terminal_id,
  search,
  fecha_desde,
  fecha_hasta,
  page = 0,
  limit = 50
} = {}) => {
  let query = supabase
    .from('casos_srl')
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
  if (fecha_desde) query = query.gte('fecha_retiro', fecha_desde)
  if (fecha_hasta) query = query.lte('fecha_retiro', fecha_hasta)
  if (search) query = query.or(`ppu.ilike.%${search}%,numero_interno.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}

export const getCasoSRLById = async (id) => {
  const { data, error } = await supabase
    .from('casos_srl')
    .select(`*, buses(ppu, numero_interno), modelos_bus(nombre), terminales(nombre)`)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const updateCasoSRL = async (id, updates) => {
  const { data, error } = await supabase
    .from('casos_srl')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const cerrarCasoSRL = async (id, { fecha_recepcion, hora_recepcion, fecha_reposicion, hora_reposicion, usuario_repone, observacion_final }) => {
  return updateCasoSRL(id, {
    estado: 'CERRADO',
    fecha_recepcion,
    hora_recepcion,
    fecha_reposicion,
    hora_reposicion,
    usuario_repone,
    observacion_final
  })
}

export const getCasosSRLStats = async () => {
  const { data, error } = await supabase.from('casos_srl').select('estado')
  if (error) throw error
  const byEstado = {}
  for (const c of (data || [])) {
    byEstado[c.estado] = (byEstado[c.estado] || 0) + 1
  }
  const activos = (data || []).filter(c => !['REPUESTO_BUS', 'CERRADO'].includes(c.estado)).length
  return { ...byEstado, activos }
}
