import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Auth.module.css'
import { useAuth } from '../contexts/AuthContext'

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

export default function Signup({ onSignup, addToast }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  placeholder={t('auth.signup.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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
                {t('auth.signup.confirmPasswordLabel')}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
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