import { supabase } from '../config/supabase.js'

// POST /api/controls  — trigger a control action
export const triggerControl = async (req, res, next) => {
  try {
    const { device_id, actuator_id, action_type, new_status, new_value, reason } = req.body
    if (!device_id || !actuator_id || !action_type) {
      return res.status(400).json({ error: 'device_id, actuator_id and action_type are required' })
    }

    // Fetch current actuator state for audit
    const { data: actuator, error: aErr } = await supabase
      .from('actuators')
      .select('name, status, current_value')
      .eq('actuator_id', actuator_id)
      .single()

    if (aErr) return res.status(404).json({ error: 'Actuator not found' })

    // Find the corresponding public.users record for this auth user
    // (Auth UUID might not directly match a record in public.users if it wasn't synced)
    let localUserId = null;
    if (req.user && req.user.id) {
      const { data: localUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', req.user.id)
        .single();

      if (localUser) {
        localUserId = localUser.user_id;
      }
    }

    // Insert control action record
    const { data: action, error: actionErr } = await supabase
      .from('control_actions')
      .insert([{
        device_id,
        actuator_id,
        action_type,
        new_status: new_status ?? null,
        new_value: new_value ?? null,
        previous_status: actuator.status,
        previous_value: actuator.current_value,
        reason: reason || 'Manual trigger',
        initiated_by_user_id: localUserId, // Use validated local user ID or null
        status: 'pending'
      }])
      .select()
      .single()

    if (actionErr) return res.status(400).json({ error: actionErr.message })

    // Apply the change to the actuator
    // Only set changed_by_user_id if a valid local user exists to satisfy foreign key constraint
    const actuatorUpdates = { last_changed: new Date().toISOString() }
    if (localUserId) {
      actuatorUpdates.changed_by_user_id = localUserId
    }
    if (action_type === 'activate') actuatorUpdates.status = true
    if (action_type === 'deactivate') actuatorUpdates.status = false
    if (action_type === 'set_value') actuatorUpdates.current_value = new_value

    const { error: updateErr } = await supabase
      .from('actuators')
      .update(actuatorUpdates)
      .eq('actuator_id', actuator_id)

    // Update control action status
    const finalStatus = updateErr ? 'failed' : 'success'
    await supabase
      .from('control_actions')
      .update({ status: finalStatus, error_message: updateErr?.message || null })
      .eq('action_id', action.action_id)

    // Log to new control_history table
    await supabase.from('control_history').insert([{
      device_id,
      actuator: actuator.name || actuator_id,
      command: action_type === 'activate' ? 'ON' : 'OFF',
      triggered_by: 'Manual',
      status: finalStatus
    }]);

    if (updateErr) return res.status(500).json({ error: 'Failed to apply control', detail: updateErr.message })

    return res.status(201).json({ data: { ...action, status: finalStatus } })
  } catch (err) { next(err) }
}

// GET /api/controls?device_id=C1&limit=50
export const getControlHistory = async (req, res, next) => {
  try {
    const { device_id, actuator_id, limit = 50, page = 1 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('control_history')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (device_id) query = query.eq('device_id', device_id)
    if (actuator_id) query = query.eq('actuator_id', actuator_id)

    const { data, error, count } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
}

// GET /api/controls/:id
export const getControlById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('control_actions')
      .select('*, actuators(name, type)')
      .eq('action_id', req.params.id)
      .single()

    if (error) return res.status(404).json({ error: 'Control action not found' })
    return res.json({ data })
  } catch (err) { next(err) }
}
