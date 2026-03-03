import { NavLink, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Sidebar.module.css'

const NAV = [
  {
    section: 'MONITOR',
    items: [
      { to: '/', label: 'Dashboard', icon: <DashIcon /> },
      { to: '/sensors', label: 'Sensors', icon: <SensorIcon /> },
      { to: '/controls', label: 'Controls', icon: <ControlIcon /> },
    ]
  },
  {
    section: 'DATA',
    items: [
      { to: '/history', label: 'History', icon: <HistoryIcon /> },
      { to: '/reports', label: 'Reports', icon: <ReportIcon /> },
    ]
  },
  {
    section: 'MANAGE',
    items: [
      { to: '/devices', label: 'Devices', icon: <DeviceIcon /> },
      { to: '/alerts', label: 'Alerts', icon: <AlertIcon /> },
      { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    ]
  }
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { t } = useTranslation()

  return (
    <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
      {/* Mobile close button */}
      <button className={styles.mobileCloseBtn} onClick={onClose}>
        <CloseIcon />
      </button>

      {/* Logo */}
      <Link to="/" className={styles.logo} onClick={() => { if (mobileOpen) onClose() }}>
        <div className={styles.logoMark}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="var(--green)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="7" stroke="var(--green)" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="14" cy="14" r="3" fill="var(--green)" />
            <line x1="14" y1="2" x2="14" y2="6" stroke="var(--green)" strokeWidth="1.5" />
            <line x1="14" y1="22" x2="14" y2="26" stroke="var(--green)" strokeWidth="1.5" />
            <line x1="2" y1="14" x2="6" y2="14" stroke="var(--green)" strokeWidth="1.5" />
            <line x1="22" y1="14" x2="26" y2="14" stroke="var(--green)" strokeWidth="1.5" />
          </svg>
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>BioScope</span>
          <span className={styles.logoSub}>ENV · MONITOR</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV.map(({ section, items }) => (
          <div key={section} className={styles.navGroup}>
            <div className={styles.sectionLabel}>{t(`nav.${section.toLowerCase()}`)}</div>
            {items.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => { if (mobileOpen) onClose() }}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.navIcon}>{icon}</span>
                <span className={styles.navLabel}>{t(`nav.${label.toLowerCase()}`)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer status */}
      <div className={styles.footer}>
        <div className={styles.footerStatus}>
          <span className={styles.dot} />
          <span>SUPABASE LIVE</span>
        </div>
        <div className={styles.footerVersion}>v1.0.0</div>
      </div>
    </aside>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────
function DashIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
}
function SensorIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="2.5" /><path d="M3 8a5 5 0 0 1 10 0" /><path d="M1 8a7 7 0 0 1 14 0" />
  </svg>
}
function ControlIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
    <path d="M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
  </svg>
}
function HistoryIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" /><polyline points="8,5 8,8 10,10" />
  </svg>
}
function ReportIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="1" width="10" height="14" rx="1" /><line x1="6" y1="5" x2="10" y2="5" />
    <line x1="6" y1="8" x2="10" y2="8" /><line x1="6" y1="11" x2="8" y2="11" />
  </svg>
}
function DeviceIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="3" width="14" height="10" rx="1" /><line x1="8" y1="13" x2="8" y2="15" /><line x1="5" y1="15" x2="11" y2="15" />
    <circle cx="8" cy="8" r="2" />
  </svg>
}
function AlertIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 1l7 13H1L8 1z" /><line x1="8" y1="6" x2="8" y2="9" /><circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
  </svg>
}
function SettingsIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.06 1.06M12.01 12.01l1.06 1.06M2.93 13.07l1.06-1.06M12.01 3.99l1.06-1.06" />
  </svg>
}

function CloseIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
}
