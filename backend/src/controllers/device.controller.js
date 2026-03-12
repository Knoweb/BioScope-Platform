import { supabase } from '../config/supabase.js'

// GET /api/devices
export const getDevices = async (req, res, next) => {
  try {
    const { status } = req.query

    // Fetch parent units
    let parentQuery = supabase.from('parent_units').select('*')
    if (status) parentQuery = parentQuery.eq('status', status)
    const { data: parents, error: pError } = await parentQuery
    if (pError) return res.status(400).json({ error: pError.message })

    // Fetch child units
    let childQuery = supabase.from('child_units').select('*')
    if (status) childQuery = childQuery.eq('status', status)
    const { data: children, error: cError } = await childQuery
    if (cError) return res.status(400).json({ error: cError.message })

    // Combine them and rename `unit_id` to `device_id` so frontend doesn't break
    const formattedParents = parents.map(p => ({ ...p, device_id: p.unit_id, type: 'parent' }))
    const formattedChildren = children.map(c => ({ ...c, device_id: c.unit_id, type: 'child' }))
    const combined = [...formattedParents, ...formattedChildren].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return res.json({ data: combined, total: combined.length })
  } catch (err) { next(err) }
}

// Helper function to check if a device is a parent or child
const checkDeviceType = async (id) => {
  const { data: p } = await supabase.from('parent_units').select('unit_id').eq('unit_id', id).single()
  if (p) return { type: 'parent' }
  const { data: c } = await supabase.from('child_units').select('unit_id').eq('unit_id', id).single()
  if (c) return { type: 'child' }
  return null
}

// GET /api/devices/:id
export const getDeviceById = async (req, res, next) => {
  try {
    const id = req.params.id
    const typeInfo = await checkDeviceType(id)
    if (!typeInfo) return res.status(404).json({ error: 'Device not found' })

    const table = typeInfo.type === 'parent' ? 'parent_units' : 'child_units'
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('unit_id', id)
      .single()

    if (error) return res.status(400).json({ error: error.message })

    const formattedData = { ...data, device_id: data.unit_id, type: typeInfo.type }
    return res.json({ data: formattedData })
  } catch (err) { next(err) }
}

// POST /api/devices
export const createDevice = async (req, res, next) => {
  try {
    const { device_id, name, type, location, gateway, firmware, ip_type, parent_unit_id, priority, status } = req.body

    if (!device_id || !name || !type) {
      return res.status(400).json({ error: 'device_id, name, and type are required' })
    }

    let insertData, table
    if (type === 'parent') {
      table = 'parent_units'
      insertData = { unit_id: device_id, name, location, gateway, firmware, ip_type, status: status || 'online' }
    } else if (type === 'child') {
      if (!parent_unit_id) return res.status(400).json({ error: 'parent_unit_id is required for child units' })
      table = 'child_units'
      insertData = { unit_id: device_id, name, location, parent_unit_id, priority: priority || 1, status: status || 'online' }
    } else {
      return res.status(400).json({ error: 'type must be parent or child' })
    }

    const { data, error } = await supabase
      .from(table)
      .insert([insertData])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ data: { ...data, device_id: data.unit_id, type } })
  } catch (err) { next(err) }
}

// PATCH /api/devices/:id
export const updateDevice = async (req, res, next) => {
  try {
    const id = req.params.id
    const typeInfo = await checkDeviceType(id)
    if (!typeInfo) return res.status(404).json({ error: 'Device not found' })

    const table = typeInfo.type === 'parent' ? 'parent_units' : 'child_units'
    const allowed = typeInfo.type === 'parent'
      ? ['name', 'location', 'gateway', 'firmware', 'ip_type', 'status', 'control_mode']
      : ['name', 'location', 'parent_unit_id', 'priority', 'status']

    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))

    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('unit_id', id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data: { ...data, device_id: data.unit_id, type: typeInfo.type } })
  } catch (err) { next(err) }
}

// DELETE /api/devices/:id
export const deleteDevice = async (req, res, next) => {
  try {
    const id = req.params.id
    const typeInfo = await checkDeviceType(id)
    if (!typeInfo) return res.status(404).json({ error: 'Device not found' })

    const table = typeInfo.type === 'parent' ? 'parent_units' : 'child_units'

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('unit_id', id)

    if (error) return res.status(400).json({ error: error.message })
    return res.status(204).send()
  } catch (err) { next(err) }
}

// GET /api/devices/:id/summary
export const getDeviceSummary = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('vw_device_summary')
      .select('*')
      .eq('device_id', req.params.id)
      .single()

    if (error) return res.status(404).json({ error: 'Device not found' })
    return res.json({ data })
  } catch (err) { next(err) }
}

// GET /api/devices/:id/slots
export const getSlotAssignment = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('device_settings')
      .select('slot_1_device, slot_2_device')
      .eq('device_id', req.params.id)
      .maybeSingle()
    if (error || !data || !data.slot_1_device) {
      // Return defaults if no row yet or columns not yet migrated
      return res.json({ data: { slot_1_device: 'fan', slot_2_device: 'light' } })
    }
    return res.json({ data })
  } catch (err) { next(err) }
}

// PATCH /api/devices/:id/slots
export const updateSlotAssignment = async (req, res, next) => {
  try {
    const { slot_1_device, slot_2_device } = req.body
    if (!slot_1_device || !slot_2_device) {
      return res.status(400).json({ error: 'slot_1_device and slot_2_device are required' })
    }
    const valid = ['fan', 'heater', 'light']
    if (!valid.includes(slot_1_device) || !valid.includes(slot_2_device)) {
      return res.status(400).json({ error: 'Each slot must be fan, heater, or light' })
    }
    if (slot_1_device === slot_2_device) {
      return res.status(400).json({ error: 'Cannot assign the same device to both slots' })
    }
    const { data, error } = await supabase
      .from('device_settings')
      .upsert({ device_id: req.params.id, slot_1_device, slot_2_device }, { onConflict: 'device_id' })
      .select('slot_1_device, slot_2_device')
      .maybeSingle()
    // Silently ignore DB errors (e.g. FK or missing migration) — UI uses the validated values
    if (error) console.warn(`[slots] Could not persist for ${req.params.id}:`, error.message)
    return res.json({ data: data ?? { slot_1_device, slot_2_device } })
  } catch (err) { next(err) }
}

// GET /api/devices/:id/latest-state
export const getLatestControlState = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('control_actions')
      .select('fan_state, heater_state, light_state, triggered_by, timestamp')
      .eq('device_id', req.params.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
    if (error || !data) {
      return res.json({ data: { fan_state: 'off', heater_state: 'off', light_state: 'off', triggered_by: null } })
    }
    return res.json({ data })
  } catch (err) { next(err) }
}
