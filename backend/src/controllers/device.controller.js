import { supabase } from '../config/supabase.js'

// GET /api/devices
export const getDevices = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('devices')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('added_date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) return res.status(400).json({ error: error.message })

    return res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
}

// GET /api/devices/:id
export const getDeviceById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select(`*, sensors(*), actuators(*), device_settings(*)`)
      .eq('device_id', req.params.id)
      .is('deleted_at', null)
      .single()

    if (error) return res.status(404).json({ error: 'Device not found' })
    return res.json({ data })
  } catch (err) { next(err) }
}

// POST /api/devices
export const createDevice = async (req, res, next) => {
  try {
    const { device_id, name, type, location, gateway, firmware_version, ip_address, mac_address } = req.body
    if (!device_id || !name || !type || !location) {
      return res.status(400).json({ error: 'device_id, name, type and location are required' })
    }

    // Must resolve the auth.users ID to the public.users user_id for the foreign key
    const { data: dbUser, error: userErr } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', req.user.email)
      .single()

    if (userErr || !dbUser) {
      return res.status(400).json({ error: 'Authenticated user not found in public users table' })
    }

    const { data, error } = await supabase
      .from('devices')
      .insert([{
        device_id, name, type, location, gateway, firmware_version, ip_address, mac_address,
        owner_user_id: dbUser.user_id
      }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ data })
  } catch (err) { next(err) }
}

// PATCH /api/devices/:id
export const updateDevice = async (req, res, next) => {
  try {
    const allowed = ['name', 'type', 'location', 'gateway', 'firmware_version', 'ip_address', 'mac_address', 'status', 'last_seen']
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))

    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('device_id', req.params.id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// DELETE /api/devices/:id  (soft delete)
export const deleteDevice = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('devices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('device_id', req.params.id)

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
