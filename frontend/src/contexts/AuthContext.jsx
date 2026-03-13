// ─── Auth Context ─────────────────────────────────────────────────────────────
// Manages authentication state using your Express backend
// Token is stored in localStorage under 'bioscope_token'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authAPI } from '../api/auth'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ── On app start: check if token exists and fetch user ──────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = authAPI.getStoredToken()

      if (!token) {
        setLoading(false)
        return
      }

      // Token exists → verify it by fetching current user from backend
      const { user, error } = await authAPI.getMe()

      if (error || !user) {
        // Token is invalid or expired → try refresh
        const { error: refreshError } = await authAPI.refreshToken()
        if (refreshError) {
          // Refresh also failed → clear everything, force re-login
          authAPI.signOut()
          setUser(null)
        } else {
          // Refreshed successfully → fetch user again
          const { user: refreshedUser } = await authAPI.getMe()
          setUser(refreshedUser ?? null)
        }
      } else {
        setUser(user)
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  // ── Session expired (401 with failed refresh) — force logout ───────────────
  useEffect(() => {
    const handleSessionExpired = () => {
      authAPI.signOut()
      setUser(null)
    }
    window.addEventListener('bioscope:session-expired', handleSessionExpired)
    return () => window.removeEventListener('bioscope:session-expired', handleSessionExpired)
  }, [])

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data, error } = await authAPI.signIn(email, password)
    if (error) return { error }
    setUser(data.user)
    return { data, error: null }
  }, [])

  // ── Signup ──────────────────────────────────────────────────────────────────
  const signup = useCallback(async (email, password, name) => {
    const { data, error } = await authAPI.signUp(email, password, name)
    if (error) return { error }
    return { data, error: null }
  }, [])

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authAPI.signOut()
    setUser(null)
  }, [])

  // ── Update profile ──────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    const { data, error } = await authAPI.updateMe(updates)
    if (!error && data?.user) setUser(data.user)
    return { data, error }
  }, [])

  // ── Delete account ──────────────────────────────────────────────────────────
  const deleteAccount = useCallback(async () => {
    const { error } = await authAPI.deleteMe()
    if (error) return { error }
    authAPI.signOut()
    setUser(null)
    return { error: null }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, deleteAccount }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// Custom hook
export const useAuth = () => useContext(AuthContext)
