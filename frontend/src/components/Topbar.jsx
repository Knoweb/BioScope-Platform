import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import styles from './Topbar.module.css'



export default function Topbar({ onRefresh, lastUpdate, onToggleMenu }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Normalise: i18next v25 may return a string/null for unknown paths;
  // ensure we always have a plain object with string label/sub.
  const rawInfo = t(`topbar.titles.${pathname}`, { returnObjects: true }) || t(`topbar.titles./`, { returnObjects: true })
  const info = (rawInfo !== null && typeof rawInfo === 'object' && !Array.isArray(rawInfo)) ? rawInfo : {}
  const now = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—'

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    navigate('/login')
  }

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <header className={styles.topbar}>
      <button className={styles.hamburgerBtn} onClick={onToggleMenu}>
        <MenuIcon />
      </button>
      <div className={styles.left}>
        <h1 className={styles.title}>{info.label}</h1>
        <p className={styles.sub}>{info.sub}</p>
      </div>
      <div className={styles.right}>
        <div className={styles.updateBadge}>
          <span className={styles.updateLabel}>{t('topbar.lastUpdate')}</span>
          <span className={styles.updateTime}>{now}</span>
        </div>
        <button className={styles.refreshBtn} onClick={onRefresh} title={t('topbar.refresh')}>
          <RefreshIcon />
          <span>{t('topbar.refresh')}</span>
        </button>
        <div className={styles.profileDropdown} ref={menuRef}>
          <button className={styles.avatar} onClick={() => setMenuOpen(!menuOpen)}>
            {initial}
          </button>

          {menuOpen && (
            <div className={styles.menu}>
              <div className={styles.menuHeader}>
                <div className={styles.menuAvatarLarge}>{initial}</div>
                <div className={styles.menuDetails}>
                  <div className={styles.menuName}>{user?.name || 'User'}</div>
                  <div className={styles.menuEmail}>{user?.email || 'user@bioscope.local'}</div>
                  <div className={styles.menuRole}>{user?.role?.toUpperCase() || 'USER'}</div>
                </div>
              </div>
              <div className={styles.menuFooter}>
                <button className={styles.menuLogoutBtn} onClick={handleLogout}>
                  🚪 {t('settings.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function RefreshIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12.5 7A5.5 5.5 0 1 1 9 2.1" /><polyline points="9,1 9,3.5 11.5,3.5" />
  </svg>
}

function MenuIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
}
