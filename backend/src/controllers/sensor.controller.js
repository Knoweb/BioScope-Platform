import { supabase } from '../config/supabase.js'

// GET /api/sensors?device_id=C1
export const getSensors = async (req, res, next) => {
  try {
    const { device_id } = req.query

    let query = supabase
      .from('sensors')
      .select('*, sensor_types(*)')
      .is('deleted_at', null)
      .order('added_date')

    if (device_id) query = query.eq('device_id', device_id)

    const { data, error } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// GET /api/sensors/:id
export const getSensorById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('sensors')
      .select('*, sensor_types(*)')
      .eq('sensor_id', req.params.id)
      .is('deleted_at', null)
      .single()

    if (error) return res.status(404).json({ error: 'Sensor not found' })
    return res.json({ data })
  } catch (err) { next(err) }
}

// POST /api/sensors
export const createSensor = async (req, res, next) => {
  try {
    const { device_id, sensor_type_id, name, location, calibration_offset } = req.body
    if (!device_id || !sensor_type_id || !name) {
      return res.status(400).json({ error: 'device_id, sensor_type_id and name are required' })
    }

    const { data, error } = await supabase
      .from('sensors')
      .insert([{ device_id, sensor_type_id, name, location, calibration_offset }])
      .select('*, sensor_types(*)')
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ data })
  } catch (err) { next(err) }
}

// PATCH /api/sensors/:id
export const updateSensor = async (req, res, next) => {
  try {
    const allowed = ['name', 'location', 'is_active', 'calibration_offset']
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))

    const { data, error } = await supabase
      .from('sensors')
      .update(updates)
      .eq('sensor_id', req.params.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// DELETE /api/sensors/:id (soft delete)
export const deleteSensor = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('sensors')
      .update({ deleted_at: new Date().toISOString() })
      .eq('sensor_id', req.params.id)

    if (error) return res.status(400).json({ error: error.message })
    return res.status(204).send()
  } catch (err) { next(err) }
}

// GET /api/sensors/types
export const getSensorTypes = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('sensor_types')
      .select('*')
      .order('name')

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}
