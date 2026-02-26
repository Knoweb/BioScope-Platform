// ─── Supabase Client ─────────────────────────────────────────────────────────
// Used ONLY for real-time subscriptions
// All auth and data operations go through the backend API (src/lib/api.js)

import { createClient } from '@supabase/supabase-js'
import { authAPI } from '../api/auth'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Check your .env file.')
}

// Internal base client
const _supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper to get a configured client with the current JWT token
// This guarantees we connect to Realtime with the proper RLS permissions
export const getRealtimeClient = () => {
  const token = authAPI.getStoredToken()
  if (token) {
    _supabase.realtime.setAuth(token)
  }
  return _supabase
}

// For backwards compatibility if any old code uses normal supabase export
export const supabase = _supabase

