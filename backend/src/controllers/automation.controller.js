import { supabase } from '../config/supabase.js'

// GET /api/automation?device_id=C1
export const getAutomationRules = async (req, res, next) => {
  try {
    const { device_id } = req.query

    let query = supabase
      .from('automation_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (device_id) query = query.eq('device_id', device_id)

    const { data, error } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// GET /api/automation/:id
export const getAutomationRuleById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('rule_id', req.params.id)
      .single()

    if (error) return res.status(404).json({ error: 'Automation rule not found' })
    return res.json({ data })
  } catch (err) { next(err) }
}

// POST /api/automation
export const createAutomationRule = async (req, res, next) => {
  try {
    const { name, device_id, trigger_condition, action, is_active } = req.body
    if (!name || !trigger_condition || !action) {
      return res.status(400).json({ error: 'name, trigger_condition and action are required' })
    }

    const { data, error } = await supabase
      .from('automation_rules')
      .insert([{
        name,
        device_id: device_id || null,
        trigger_condition,
        action,
        is_active: is_active ?? true,
        created_by_user_id: req.user.id
      }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ data })
  } catch (err) { next(err) }
}

// PATCH /api/automation/:id
export const updateAutomationRule = async (req, res, next) => {
  try {
    const allowed = ['name', 'trigger_condition', 'action', 'is_active', 'device_id']
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))

    const { data, error } = await supabase
      .from('automation_rules')
      .update(updates)
      .eq('rule_id', req.params.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}

// DELETE /api/automation/:id
export const deleteAutomationRule = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('rule_id', req.params.id)

    if (error) return res.status(400).json({ error: error.message })
    return res.status(204).send()
  } catch (err) { next(err) }
}
