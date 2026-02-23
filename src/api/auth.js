import { supabase } from '../lib/supabase'

// Sign Up
export const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  })
  if (error) throw error
  return data
}

// Sign In
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

// Sign Out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current logged-in user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Listen to auth state changes (login/logout)
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}

// Password reset email
export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}