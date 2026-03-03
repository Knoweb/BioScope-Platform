import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Auth.module.css'
import { useAuth } from '../contexts/AuthContext'

export default function Signup({ onSignup, addToast }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { name, email, password, confirmPassword } = formData

    if (!name || !email || !password || !confirmPassword) {
      addToast?.(t('auth.signup.emptyFields'), 'warning')
      return
    }

    if (password !== confirmPassword) {
      addToast?.(t('auth.signup.passwordMismatch'), 'error')
      return
    }

    if (password.length < 8) {
      addToast?.(t('auth.signup.passwordLength'), 'warning')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await signup(email, password, name)

      if (error) {
        addToast?.(error.message || t('auth.signup.failed'), 'error')
        return
      }

      // If email confirmation is disabled in Supabase, user is immediately active
      // If enabled, they'll need to confirm their email first
      if (data?.user?.identities?.length === 0) {
        addToast?.(t('auth.signup.emailExists'), 'error')
        return
      }

      addToast?.(t('auth.signup.success'), 'success')
      if (onSignup) onSignup(data.user)
      navigate('/login')
    } catch (error) {
      addToast?.(error.message || t('auth.signup.failed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      {/* Left Side - Image Panel with Description */}
      <div className={styles.signupImagePanel}>
        <div className={styles.signupImageContent}>
          <h2 className={styles.signupTitle}>{t('auth.signup.whatIsTitle')}</h2>
          <p className={styles.signupDescription}>
            {t('auth.signup.desc1')}
            <br /><br />
            {t('auth.signup.desc2')}
            <br /><br />
            {t('auth.signup.desc3')}
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
            <h1 className={styles.authTitle}>{t('auth.signup.title')}</h1>
            <p className={styles.authSubtitle}>{t('auth.signup.subtitle')}</p>
          </div>

          {/* Form */}
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="name">
                {t('auth.signup.nameLabel')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={styles.formInput}
                placeholder={t('auth.signup.namePlaceholder')}
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">
                {t('auth.signup.emailLabel')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={styles.formInput}
                placeholder={t('auth.signup.emailPlaceholder')}
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="password">
                {t('auth.signup.passwordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={styles.formInput}
                placeholder={t('auth.signup.passwordPlaceholder')}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="confirmPassword">
                {t('auth.signup.confirmPasswordLabel')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={styles.formInput}
                placeholder={t('auth.signup.confirmPasswordPlaceholder')}
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
                    {t('auth.signup.creating')}
                  </span>
                ) : (
                  t('auth.signup.signUpBtn')
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className={styles.authFooter}>
            <span className={styles.footerText}>{t('auth.signup.hasAccount')}</span>
            <Link to="/login" className={styles.footerLink}>
              {t('auth.signup.signInLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}