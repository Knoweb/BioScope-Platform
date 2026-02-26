import { supabase } from '../config/supabase.js'

// GET /api/actuators?device_id=C1
export const getActuators = async (req, res, next) => {
  try {
    const { device_id } = req.query

    let query = supabase
      .from('actuators')
      .select('*')
      .is('deleted_at', null)
      .order('added_date')

    if (device_id) query = query.eq('device_id', device_id)

    const { data, error } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// GET /api/actuators/:id
export const getActuatorById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('actuators')
      .select('*')
      .eq('actuator_id', req.params.id)
      .is('deleted_at', null)
      .single()

    if (error) return res.status(404).json({ error: 'Actuator not found' })
    return res.json({ data })
  } catch (err) { next(err) }
}

// POST /api/actuators
export const createActuator = async (req, res, next) => {
  try {
    const { device_id, name, type, description, min_value, max_value } = req.body
    if (!device_id || !name || !type) {
      return res.status(400).json({ error: 'device_id, name and type are required' })
    }

    const { data, error } = await supabase
      .from('actuators')
      .insert([{ device_id, name, type, description, min_value, max_value }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ data })
  } catch (err) { next(err) }
}

// PATCH /api/actuators/:id
export const updateActuator = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'status', 'current_value', 'is_active', 'auto_control_enabled', 'min_value', 'max_value']
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))

    // Track who changed it
    if ('status' in updates || 'current_value' in updates) {
      updates.last_changed = new Date().toISOString()
      updates.changed_by_user_id = req.user.id
    }

    const { data, error } = await supabase
      .from('actuators')
      .update(updates)
      .eq('actuator_id', req.params.id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// DELETE /api/actuators/:id (soft delete)
export const deleteActuator = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('actuators')
      .update({ deleted_at: new Date().toISOString() })
      .eq('actuator_id', req.params.id)

    if (error) return res.status(400).json({ error: error.message })
    return res.status(204).send()
  } catch (err) { next(err) }
}

// PATCH /api/actuators/:id/toggle
export const toggleActuator = async (req, res, next) => {
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('actuators')
      .select('status')
      .eq('actuator_id', req.params.id)
      .single()

    if (fetchErr) return res.status(404).json({ error: 'Actuator not found' })

    const { data, error } = await supabase
      .from('actuators')
      .update({
        status: !current.status,
        last_changed: new Date().toISOString(),
        changed_by_user_id: req.user.id
      })
      .eq('actuator_id', req.params.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}
