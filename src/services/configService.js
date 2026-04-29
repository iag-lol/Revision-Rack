import { supabase } from '../lib/supabase'

export const getConfig = async (clave) => {
  const { data, error } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', clave)
    .maybeSingle()
  if (error) throw error
  return data?.valor ?? null
}

export const setConfig = async (clave, valor) => {
  const { error } = await supabase
    .from('configuracion')
    .upsert({ clave, valor, updated_at: new Date().toISOString() }, { onConflict: 'clave' })
  if (error) throw error
}

export const getAllConfig = async () => {
  const { data, error } = await supabase.from('configuracion').select('*')
  if (error) throw error
  return data || []
}

// Modelos de bus
export const getModelosBus = async (soloActivos = true) => {
  let query = supabase
    .from('modelos_bus')
    .select(`*, cerraduras_modelo(*)`)
    .order('nombre')
  if (soloActivos) query = query.eq('activo', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const createModeloBus = async (modeloData, cerraduras = []) => {
  const { data: modelo, error } = await supabase
    .from('modelos_bus')
    .insert([{ nombre: modeloData.nombre, activo: modeloData.activo ?? true }])
    .select()
    .single()
  if (error) throw error

  if (cerraduras.length > 0) {
    const cerrItems = cerraduras.map((c, i) => ({
      modelo_id: modelo.id,
      nombre: c.nombre,
      orden: i + 1,
      activo: true
    }))
    const { error: cerrErr } = await supabase.from('cerraduras_modelo').insert(cerrItems)
    if (cerrErr) throw cerrErr
  }
  return modelo
}

export const updateModeloBus = async (id, data, cerraduras) => {
  const { error } = await supabase.from('modelos_bus').update(data).eq('id', id)
  if (error) throw error
  if (cerraduras) {
    await supabase.from('cerraduras_modelo').delete().eq('modelo_id', id)
    if (cerraduras.length > 0) {
      const items = cerraduras.map((c, i) => ({
        modelo_id: id, nombre: c.nombre, orden: i + 1, activo: true
      }))
      const { error: e2 } = await supabase.from('cerraduras_modelo').insert(items)
      if (e2) throw e2
    }
  }
}

export const getCerradurasModelo = async (modeloId) => {
  const { data, error } = await supabase
    .from('cerraduras_modelo')
    .select('*')
    .eq('modelo_id', modeloId)
    .eq('activo', true)
    .order('orden')
  if (error) throw error
  return data || []
}

// Terminales
export const getTerminales = async (soloActivos = true) => {
  let query = supabase.from('terminales').select('*').order('nombre')
  if (soloActivos) query = query.eq('activo', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const createTerminal = async (data) => {
  const { data: t, error } = await supabase
    .from('terminales')
    .insert([data])
    .select()
    .single()
  if (error) throw error
  return t
}

export const updateTerminal = async (id, data) => {
  const { error } = await supabase.from('terminales').update(data).eq('id', id)
  if (error) throw error
}

export const deleteTerminal = async (id) => {
  const { error } = await supabase.from('terminales').update({ activo: false }).eq('id', id)
  if (error) throw error
}
