// ─── Auth API ────────────────────────────────────────────────────────────────
// Calls your Express backend for all authentication operations

import { api, saveToken, clearToken } from '../lib/api'

export const authAPI = {

  // Sign in → saves token to localStorage
  signIn: async (email, password) => {

    try {
      const data = await api.post('/auth/signin', { email, password })
      if (data.session?.access_token) {
        saveToken(data.session.access_token)
        // Also save refresh token
        localStorage.setItem('bioscope_refresh_token', data.session.refresh_token)
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Sign up
  signUp: async (email, password, name) => {
    try {
      const data = await api.post('/auth/signup', { email, password, name })
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Sign out → clears token
  signOut: async () => {
    const token = localStorage.getItem('bioscope_token')
    // Only call the backend if we have a token that isn't already expired.
    // Skipping a known-expired token avoids a visible 401 in the console.
    const isExpired = !token || (() => {
      try {
        const { exp } = JSON.parse(atob(token.split('.')[1]))
        return Date.now() >= exp * 1000
      } catch { return true }
    })()

    if (!isExpired) {
      try { await api.post('/auth/signout') } catch { /* ignore — just clear locally */ }
    }
    clearToken()
    localStorage.removeItem('bioscope_refresh_token')
    return { error: null }
  },

  // Get current logged-in user
  getMe: async () => {
    try {
      const data = await api.get('/auth/me')
      return { user: data.user, error: null }
    } catch (error) {
      // 401 on startup is expected (stale/expired token) — not a real error
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return { user: null, error: null }
      }
      return { user: null, error }
    }
  },

  // Update profile (name, email, password)
  updateMe: async (updates) => {
    try {
      const data = await api.put('/auth/me', updates)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete own account permanently
  deleteMe: async () => {
    try {
      await api.delete('/auth/me')
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  // Send password reset email
  resetPassword: async (email) => {
    try {
      const data = await api.post('/auth/reset-password', { email })
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Refresh access token
  refreshToken: async () => {
    try {
      const refresh_token = localStorage.getItem('bioscope_refresh_token')
      if (!refresh_token) throw new Error('No refresh token')
      const data = await api.post('/auth/refresh', { refresh_token })
      if (data.access_token) {
        saveToken(data.access_token)
        localStorage.setItem('bioscope_refresh_token', data.refresh_token)
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Check if token exists in localStorage
  getStoredToken: () => localStorage.getItem('bioscope_token'),

  // Check if user is logged in (has token)
  isLoggedIn: () => !!localStorage.getItem('bioscope_token')
}
