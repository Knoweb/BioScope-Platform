import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

function PasswordEye({ visible }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12C3.8 8.5 7.5 6 12 6C16.5 6 20.2 8.5 22 12C20.2 15.5 16.5 18 12 18C7.5 18 3.8 15.5 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 6.2C11.06 6.07 11.53 6 12 6C16.5 6 20.2 8.5 22 12C21.2 13.56 20.06 14.9 18.67 15.95" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.35 7.35C4.62 8.46 3.13 10.05 2 12C3.8 15.5 7.5 18 12 18C13.9 18 15.66 17.55 17.2 16.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.88 9.88C9.34 10.42 9 11.17 9 12C9 13.66 10.34 15 12 15C12.83 15 13.58 14.66 14.12 14.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ResetPassword({ addToast }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState('')

  useEffect(() => {
    const establishRecoverySession = async () => {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (!accessToken || !refreshToken || type !== 'recovery') {
        setLinkError(t('auth.reset.invalidLink'))
        return
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        setLinkError(error.message || t('auth.reset.invalidLink'))
        return
      }

      window.history.replaceState({}, document.title, '/reset-password')
      setReady(true)
    }

    establishRecoverySession()
  }, [t])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!password || !confirmPassword) {
      addToast?.(t('auth.reset.emptyFields'), 'warning')
      return
    }

    if (password !== confirmPassword) {
      addToast?.(t('auth.reset.passwordMismatch'), 'error')
      return
    }

    if (password.length < 8) {
      addToast?.(t('auth.reset.passwordLength'), 'warning')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        addToast?.(error.message || t('auth.reset.failed'), 'error')
        return
      }

      await supabase.auth.signOut()
      addToast?.(t('auth.reset.success'), 'success')
      navigate('/login')
    } catch (error) {
      addToast?.(error.message || t('auth.reset.failed'), 'error')
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
            <h1 className={styles.authTitle}>{t('auth.reset.title')}</h1>
            <p className={styles.authSubtitle}>{t('auth.reset.subtitle')}</p>
          </div>

          {linkError ? (
            <>
              <div className={styles.errorMessage}>{linkError}</div>
              <div className={styles.authFooter}>
                <Link to="/forgot-password" className={styles.footerLink}>
                  {t('auth.reset.requestAnother')}
                </Link>
              </div>
            </>
          ) : (
            <form className={styles.authForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="password">
                  {t('auth.reset.passwordLabel')}
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={styles.formInput}
                    placeholder={t('auth.reset.passwordPlaceholder')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={!ready}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    <PasswordEye visible={showPassword} />
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="confirmPassword">
                  {t('auth.reset.confirmPasswordLabel')}
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={styles.formInput}
                    placeholder={t('auth.reset.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={!ready}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmPassword}
                  >
                    <PasswordEye visible={showConfirmPassword} />
                  </button>
                </div>
              </div>

              {!ready && <div className={styles.infoMessage}>{t('auth.reset.preparing')}</div>}

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading || !ready}>
                  {loading ? t('auth.reset.saving') : t('auth.reset.submitBtn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}