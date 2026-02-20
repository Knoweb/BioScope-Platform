// ─── Supabase Client Configuration ─────────────────────────────────────────
// 
// This file sets up the Supabase client for authentication and database operations.
// To use real Supabase integration:
//
// 1. Install Supabase client:
//    npm install @supabase/supabase-js
//
// 2. Create a .env file in the root directory with:
//    VITE_SUPABASE_URL=your_supabase_project_url
//    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
//
// 3. Uncomment the code below and remove the mock implementation
//
// ────────────────────────────────────────────────────────────────────────────

// REAL SUPABASE IMPLEMENTATION (Uncomment when ready):
/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helpers
export const authHelpers = {
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}
*/

// ────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATION (for development without Supabase)
// Remove this when implementing real Supabase integration
// ────────────────────────────────────────────────────────────────────────────

export const supabase = {
  auth: {
    signUp: async ({ email, password, options }) => {
      // Mock signup - stores in localStorage
      await new Promise(resolve => setTimeout(resolve, 500))
      const user = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        user_metadata: options?.data || {}
      }
      return { data: { user }, error: null }
    },

    signInWithPassword: async ({ email, password }) => {
      // Mock login - checks localStorage
      await new Promise(resolve => setTimeout(resolve, 500))
      const stored = localStorage.getItem('bioscope_auth')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.email === email) {
          return {
            data: {
              user: {
                id: parsed.id || '1',
                email: parsed.email,
                user_metadata: { name: parsed.name }
              }
            },
            error: null
          }
        }
      }
      return { data: null, error: { message: 'Invalid credentials' } }
    },

    signOut: async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return { error: null }
    },

    getUser: async () => {
      const stored = localStorage.getItem('bioscope_auth')
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          data: {
            user: {
              id: parsed.id || '1',
              email: parsed.email,
              user_metadata: { name: parsed.name }
            }
          }
        }
      }
      return { data: { user: null } }
    },

    onAuthStateChange: (callback) => {
      // Mock implementation - just return unsubscribe function
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
  }
}

export const authHelpers = {
  signUp: async (email, password, metadata = {}) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
  },

  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}
