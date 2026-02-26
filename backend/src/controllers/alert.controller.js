import { supabase } from '../config/supabase.js'

// ── Alert Rules ───────────────────────────────────────────────────────────────

// GET /api/alerts/rules
export const getAlertRules = async (req, res, next) => {
  try {
    const { is_active, device_id } = req.query

    let query = supabase
      .from('alert_rules')
      .select('*')
      .is('deleted_at', null)
      .order('name')

    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true')
    if (device_id) query = query.or(`device_id.eq.${device_id},device_id.is.null`)

    const { data, error } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// POST /api/alerts/rules
export const createAlertRule = async (req, res, next) => {
  try {
    const { name, description, device_id, condition, severity, notification_channels, cooldown_minutes } = req.body
    if (!name || !condition || !severity) {
      return res.status(400).json({ error: 'name, condition and severity are required' })
    }

    const { data, error } = await supabase
      .from('alert_rules')
      .insert([{
        name, description, device_id: device_id || null,
        condition, severity,
        notification_channels: notification_channels || 'app',
        cooldown_minutes: cooldown_minutes || 15,
        is_active: true,
        created_by_user_id: req.user.id
      }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ data })
  } catch (err) { next(err) }
}

// PATCH /api/alerts/rules/:id
export const updateAlertRule = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'condition', 'severity', 'notification_channels', 'is_active', 'cooldown_minutes']
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))

    const { data, error } = await supabase
      .from('alert_rules')
      .update(updates)
      .eq('rule_id', req.params.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// DELETE /api/alerts/rules/:id (soft delete)
export const deleteAlertRule = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('alert_rules')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('rule_id', req.params.id)

    if (error) return res.status(400).json({ error: error.message })
    return res.status(204).send()
  } catch (err) { next(err) }
}

// ── Alert Instances ───────────────────────────────────────────────────────────

// GET /api/alerts?device_id=C1&is_resolved=false
export const getAlerts = async (req, res, next) => {
  try {
    const { device_id, is_resolved, severity, limit = 50, page = 1 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('alerts')
      .select('*, alert_rules(name, condition)', { count: 'exact' })
      .order('triggered_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (device_id) query = query.eq('device_id', device_id)
    if (is_resolved !== undefined) query = query.eq('is_resolved', is_resolved === 'true')
    if (severity) query = query.eq('severity', severity)

    const { data, error, count } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
}

// GET /api/alerts/active
export const getActiveAlerts = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*, alert_rules(name, condition)')
      .eq('is_resolved', false)
      .order('triggered_at', { ascending: false })

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// POST /api/alerts  — create alert instance (usually from device/automation)
export const createAlert = async (req, res, next) => {
  try {
    const { rule_id, device_id, severity, title, sensor_id, trigger_data } = req.body
    if (!device_id || !severity || !title) {
      return res.status(400).json({ error: 'device_id, severity and title are required' })
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert([{ rule_id, device_id, severity, title, sensor_id, trigger_data }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ data })
  } catch (err) { next(err) }
}

// PATCH /api/alerts/:id/acknowledge
export const acknowledgeAlert = async (req, res, next) => {
  try {
    const { note } = req.body

    const { data, error } = await supabase
      .from('alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by_user_id: req.user.id,
        acknowledgment_note: note || null
      })
      .eq('alert_id', req.params.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// PATCH /api/alerts/:id/resolve
export const resolveAlert = async (req, res, next) => {
  try {
    const { reason } = req.body

    const { data, error } = await supabase
      .from('alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_reason: reason || 'Manually resolved'
      })
      .eq('alert_id', req.params.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}
