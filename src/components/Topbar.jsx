import { useLocation } from 'react-router-dom'
import styles from './Topbar.module.css'

const TITLES = {
  '/':         { label: 'Dashboard',       sub: 'Real-time overview of all devices' },
  '/sensors':  { label: 'Sensor Readings', sub: 'Live environmental data monitoring' },
  '/controls': { label: 'Device Controls', sub: 'Manual actuator management' },
  '/history':  { label: 'Data History',    sub: 'Historical sensor records' },
  '/reports':  { label: 'Reports',         sub: 'Data export and analytics' },
  '/devices':  { label: 'Devices',         sub: 'Device registry and configuration' },
  '/alerts':   { label: 'Alerts',          sub: 'Notification rules and history' },
  '/settings': { label: 'Settings',        sub: 'Application configuration' },
}

export default function Topbar({ onRefresh, lastUpdate }) {
  const { pathname } = useLocation()
  const info = TITLES[pathname] ?? TITLES['/']
  const now = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—'

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>{info.label}</h1>
        <p className={styles.sub}>{info.sub}</p>
      </div>
      <div className={styles.right}>
        <div className={styles.updateBadge}>
          <span className={styles.updateLabel}>LAST UPDATE</span>
          <span className={styles.updateTime}>{now}</span>
        </div>
        <button className={styles.refreshBtn} onClick={onRefresh} title="Refresh data">
          <RefreshIcon />
          <span>Refresh</span>
        </button>
        <div className={styles.avatar}>BS</div>
      </div>
    </header>
  )
}

function RefreshIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12.5 7A5.5 5.5 0 1 1 9 2.1" /><polyline points="9,1 9,3.5 11.5,3.5" />
  </svg>
}
