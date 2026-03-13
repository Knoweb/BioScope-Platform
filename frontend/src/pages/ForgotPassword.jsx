import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../api/auth'
import styles from './Auth.module.css'

export default function ForgotPassword({ addToast }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setSent(false)

    if (!email.trim()) {
      const message = t('auth.forgot.emptyEmail')
      setFormError(message)
      addToast?.(message, 'warning')
      return
    }

    setLoading(true)
    try {
      const { error } = await authAPI.resetPassword(email.trim())
      if (error) {
        const message = error.message || t('auth.forgot.failed')
        setFormError(message)
        addToast?.(message, 'error')
        return
      }

      setSent(true)
      addToast?.(t('auth.forgot.success'), 'success')
    } catch (error) {
      const message = error.message || t('auth.forgot.failed')
      setFormError(message)
      addToast?.(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
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

      <div className={styles.authFormPanel}>
        <div className={styles.authCard}>
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
            <h1 className={styles.authTitle}>{t('auth.forgot.title')}</h1>
            <p className={styles.authSubtitle}>{t('auth.forgot.subtitle')}</p>
          </div>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">
                {t('auth.forgot.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                className={styles.formInput}
                placeholder={t('auth.forgot.emailPlaceholder')}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (formError) setFormError('')
                }}
                autoComplete="email"
                required
              />
            </div>

            {formError && (
              <div className={styles.errorMessage}>
                {formError}
              </div>
            )}

            {sent && (
              <div className={styles.infoMessage}>
                {t('auth.forgot.sentMessage', { email })}
              </div>
            )}

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? t('auth.forgot.sending') : t('auth.forgot.submitBtn')}
              </button>
            </div>
          </form>

          <div className={styles.authFooter}>
            <span className={styles.footerText}>{t('auth.forgot.remembered')}</span>
            <Link to="/login" className={styles.footerLink}>
              {t('auth.forgot.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}