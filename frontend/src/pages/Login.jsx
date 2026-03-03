import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Auth.module.css'
import { useAuth } from '../contexts/AuthContext'

export default function Login({ addToast }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      addToast?.(t('auth.login.emptyFields'), 'warning')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await login(email, password)

      if (error) {
        addToast?.(error.message || t('auth.login.failed'), 'error')
        return
      }

      addToast?.(t('auth.login.success'), 'success')
      navigate('/')
    } catch (err) {
      addToast?.(err.message || t('auth.login.failed'), 'error')
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
          <h1 className={styles.authImageTitle}>{t('auth.brand')}</h1>
          <p className={styles.authImageSubtitle}>{t('auth.subtitle')}</p>
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
            <h1 className={styles.authTitle}>{t('auth.brand')}</h1>
            <p className={styles.authSubtitle}>{t('auth.subtitle')}</p>
          </div>

          {/* Form */}
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">
                {t('auth.login.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                className={styles.formInput}
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="password">
                {t('auth.login.passwordLabel')}
              </label>
              <input
                id="password"
                type="password"
                className={styles.formInput}
                placeholder={t('auth.login.passwordPlaceholder')}
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
                    {t('auth.login.signingIn')}
                  </span>
                ) : (
                  t('auth.login.signInBtn')
                )}
              </button>
            </div>

            <div className={styles.formFooter}>
              <Link to="/forgot-password" className={styles.link}>
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
          </form>

          {/* Signup Link */}
          <div className={styles.authFooter}>
            <span className={styles.footerText}>{t('auth.login.noAccount')}</span>
            <Link to="/signup" className={styles.footerLink}>
              {t('auth.login.signUpLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
