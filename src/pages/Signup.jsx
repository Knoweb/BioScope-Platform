import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Auth.module.css'

export default function Signup({ onSignup, addToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const { name, email, password, confirmPassword } = formData

    if (!name || !email || !password || !confirmPassword) {
      addToast?.('Please fill in all fields', 'warning')
      return
    }

    if (password !== confirmPassword) {
      addToast?.('Passwords do not match', 'error')
      return
    }

    if (password.length < 8) {
      addToast?.('Password must be at least 8 characters', 'warning')
      return
    }

    setLoading(true)
    try {
      // TODO: Replace with actual Supabase auth
      // Simulated signup for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Store auth token (replace with real implementation)
      localStorage.setItem('bioscope_auth', JSON.stringify({ 
        name, 
        email, 
        authenticated: true 
      }))
      
      addToast?.('Account created successfully!', 'success')
      if (onSignup) onSignup({ name, email })
      navigate('/')
    } catch (error) {
      addToast?.(error.message || 'Signup failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      {/* Left Side - Image Panel with Description */}
      <div className={styles.signupImagePanel}>
        <div className={styles.signupImageContent}>
          <h2 className={styles.signupTitle}>What Is BioScope?</h2>
          <p className={styles.signupDescription}>
            BioScope is an IoT-based environmental monitoring and control system. 
            It lets you remotely monitor and control the physical environment inside 
            an enclosure — like a terrarium for a gecko, a plant growing chamber, or 
            a small facility room — using your phone or web browser from anywhere in 
            the world.
            <br /><br />
            Think of it as a smart thermostat, but for a complete micro-environment: 
            temperature, humidity, and light — all monitored in real time, with 
            automated responses and remote manual control.
            <br /><br />
            Monitored.Controlled.Connected. BioScope gives you the power to create the perfect environment for your plants, pets, or projects, no matter where you are.
          </p>
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
            <h1 className={styles.authTitle}>Create Account</h1>
            <p className={styles.authSubtitle}>Join BioScope to monitor your environment</p>
          </div>

          {/* Form */}
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={styles.formInput}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={styles.formInput}
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                className={styles.formInput}
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={styles.formInput}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
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
                    Creating account...
                  </span>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className={styles.authFooter}>
            <span className={styles.footerText}>Already have an account?</span>
            <Link to="/login" className={styles.footerLink}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
