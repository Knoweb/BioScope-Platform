import { supabase } from '../config/supabase.js'

// Verify Supabase JWT and attach user to request
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = user
    req.accessToken = token
    next()
  } catch (err) {
    return res.status(500).json({ error: 'Authentication error' })
  }
}

// Require specific roles: e.g. requireRole('admin', 'operator')
export const requireRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.user_metadata?.role || 'user'
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Requires one of: ${roles.join(', ')}`
      })
    }
    next()
  }
}
