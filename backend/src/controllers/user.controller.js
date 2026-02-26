import { supabase } from '../config/supabase.js'

// GET /api/users  (admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data: data.users })
  } catch (err) { next(err) }
}

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(req.params.id)
    if (error) return res.status(404).json({ error: 'User not found' })
    return res.json({ data: data.user })
  } catch (err) { next(err) }
}

// PATCH /api/users/:id (admin only)
export const updateUser = async (req, res, next) => {
  try {
    const { name, role, phone, is_active } = req.body
    const updates = {}
    if (name || role || phone) updates.user_metadata = { name, role, phone }
    if (is_active !== undefined) updates.ban_duration = is_active ? 'none' : '876600h'

    const { data, error } = await supabase.auth.admin.updateUserById(req.params.id, updates)
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data: data.user })
  } catch (err) { next(err) }
}

// DELETE /api/users/:id (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(204).send()
  } catch (err) { next(err) }
}

// GET /api/users/preferences
export const getUserPreferences = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (error) return res.status(400).json({ error: error.message })

    // Return default preferences if none exist yet for this user
    const prefs = data || {
      user_id: req.user.id,
      theme: 'system',
      notifications_enabled: true,
      email_alerts: true,
      sms_alerts: false,
      push_alerts: true
    }

    return res.json({ data: prefs })
  } catch (err) { next(err) }
}

// PATCH /api/users/preferences
export const updateUserPreferences = async (req, res, next) => {
  try {
    const allowed = ['theme', 'notifications_enabled', 'email_alerts', 'sms_alerts', 'push_alerts']
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert([{ user_id: req.user.id, ...updates }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}
