import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Auth.module.css'
import { useAuth } from '../contexts/AuthContext'

export default function Login({ addToast }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuth()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      addToast?.('Please enter email and password', 'warning')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await login(email, password)

      if (error) {
        addToast?.(error.message || 'Login failed', 'error')
        return
      }

      addToast?.('Login successful!', 'success')
      navigate('/')
    } catch (err) {
      addToast?.(err.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      {/* Left Side - Image Panel */}
      <div className={styles.authImagePanel}>
        <div className={styles.authImageContent}>
          <svg width="80" height="80" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="7" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="14" cy="14" r="3" fill="#ffffff" />
            <line x1="14" y1="2" x2="14" y2="6" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="14" y1="22" x2="14" y2="26" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="2" y1="14" x2="6" y2="14" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="22" y1="14" x2="26" y2="14" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
          <h1 className={styles.authImageTitle}>BioScope</h1>
          <p className={styles.authImageSubtitle}>Environmental Monitoring System</p>
        </div>
      </div>

      {/* Right Side - Form Panel */}
      <div className={styles.authFormPanel}>
        <div className={styles.authCard}>
          {/* Logo */}
          <div className={styles.authLogo}>
            <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="#4caf50" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="7" stroke="#4caf50" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="14" cy="14" r="3" fill="#4caf50" />
              <line x1="14" y1="2" x2="14" y2="6" stroke="#4caf50" strokeWidth="1.5" />
              <line x1="14" y1="22" x2="14" y2="26" stroke="#4caf50" strokeWidth="1.5" />
              <line x1="2" y1="14" x2="6" y2="14" stroke="#4caf50" strokeWidth="1.5" />
              <line x1="22" y1="14" x2="26" y2="14" stroke="#4caf50" strokeWidth="1.5" />
            </svg>
            <h1 className={styles.authTitle}>BioScope</h1>
            <p className={styles.authSubtitle}>Environmental Monitoring System</p>
          </div>

          {/* Form */}
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className={styles.formInput}
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={styles.formInput}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.btnLoading}>
                    <span className={styles.spinner} />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            <div className={styles.formFooter}>
              <Link to="/forgot-password" className={styles.link}>
                Forgot password?
              </Link>
            </div>
          </form>

          {/* Signup Link */}
          <div className={styles.authFooter}>
            <span className={styles.footerText}>Don't have an account?</span>
            <Link to="/signup" className={styles.footerLink}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
