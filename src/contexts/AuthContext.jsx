import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth on mount
    const checkAuth = () => {
      try {
        const stored = localStorage.getItem('bioscope_auth')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.authenticated) {
            setUser(parsed)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('bioscope_auth', JSON.stringify({
      ...userData,
      authenticated: true
    }))
  }

  const signup = (userData) => {
    setUser(userData)
    localStorage.setItem('bioscope_auth', JSON.stringify({
      ...userData,
      authenticated: true
    }))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bioscope_auth')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
