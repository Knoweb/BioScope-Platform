import { supabase } from '../config/supabase.js'

// GET /api/audit?user_id=&device_id=&days=7
export const getAuditLog = async (req, res, next) => {
  try {
    const { user_id, device_id, entity_type, days = 7, limit = 100, page = 1 } = req.query
    const offset = (page - 1) * limit
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .gte('timestamp', since)
      .order('timestamp', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (user_id)     query = query.eq('user_id', user_id)
    if (device_id)   query = query.eq('device_id', device_id)
    if (entity_type) query = query.eq('entity_type', entity_type)

    const { data, error, count } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
}

// GET /api/audit/device/:deviceId
export const getDeviceAuditLog = async (req, res, next) => {
  try {
    const { days = 7, limit = 50 } = req.query
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('device_id', req.params.deviceId)
      .gte('timestamp', since)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit))

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// POST /api/audit  — manual audit entry
export const createAuditEntry = async (req, res, next) => {
  try {
    const { device_id, action, entity_type, entity_id, changes, old_values, new_values } = req.body
    if (!action) return res.status(400).json({ error: 'action is required' })

    const { data, error } = await supabase
      .from('audit_log')
      .insert([{
        user_id: req.user.id,
        device_id: device_id || null,
        action,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        changes: changes || null,
        old_values: old_values || null,
        new_values: new_values || null
      }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ data })
  } catch (err) { next(err) }
}
