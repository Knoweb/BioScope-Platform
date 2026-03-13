import { supabase } from '../config/supabase.js'

// POST /api/auth/signup
export const signUp = async (req, res, next) => {
  try {
    const { email, password, name, role = 'user' } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password and name are required' })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json({ message: 'User created successfully', user: data.user })
  } catch (err) { next(err) }
}

// POST /api/auth/signin
export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return res.status(401).json({ error: error.message })

    return res.json({
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    })
  } catch (err) { next(err) }
}

// POST /api/auth/signout
export const signOut = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(204).send()
  } catch (err) { next(err) }
}

// POST /api/auth/refresh
export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body
    if (!refresh_token) return res.status(400).json({ error: 'refresh_token is required' })

    const { data, error } = await supabase.auth.refreshSession({ refresh_token })
    if (error) return res.status(401).json({ error: error.message })

    return res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    })
  } catch (err) { next(err) }
}

// POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail) return res.status(400).json({ error: 'email is required' })

    // Explicitly verify email exists before sending reset link.
    let userExists = false
    let page = 1
    const perPage = 1000

    while (!userExists) {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page, perPage })
      if (usersError) return res.status(400).json({ error: usersError.message })

      const users = usersData?.users || []
      userExists = users.some((user) => (user.email || '').toLowerCase() === normalizedEmail)

      if (userExists || users.length < perPage) break
      page += 1
    }

    if (!userExists) {
      return res.status(404).json({ error: 'Not existing email, enter correct email address.' })
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    })
    if (error) return res.status(400).json({ error: error.message })

    return res.json({ message: 'Password reset email sent' })
  } catch (err) { next(err) }
}

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    return res.json({ user: req.user })
  } catch (err) { next(err) }
}

// PUT /api/auth/me
export const updateMe = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body

    const updates = {}
    if (email) updates.email = email
    if (password) updates.password = password
    if (name || phone) updates.data = { ...req.user.user_metadata, name, phone }

    const { data, error } = await supabase.auth.admin.updateUserById(req.user.id, updates)
    if (error) return res.status(400).json({ error: error.message })

    return res.json({ user: data.user })
  } catch (err) { next(err) }
}

// DELETE /api/auth/me  (self-delete)
export const deleteMe = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.user.id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(204).send()
  } catch (err) { next(err) }
}
