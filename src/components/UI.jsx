import styles from './UI.module.css'
import { fmt } from '../utils'

// ── MetricCard ─────────────────────────────────────────────────────────────
export function MetricCard({ label, value, unit, icon, color, trend, sub, loading, delay = 0 }) {
  return (
    <div className={`${styles.metricCard} fade-up`} style={{ animationDelay: `${delay}s`, '--card-accent': color }}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricIcon}>{icon}</span>
      </div>
      {loading ? (
        <div className={`skeleton ${styles.metricSkel}`} />
      ) : (
        <div className={styles.metricValue} style={{ color }}>
          {value ?? '—'}
          {value != null && <span className={styles.metricUnit}>{unit}</span>}
        </div>
      )}
      {sub && <div className={styles.metricSub}>{sub}</div>}
      <div className={styles.metricBar} />
    </div>
  )
}

// ── DeviceTabs ─────────────────────────────────────────────────────────────
export function DeviceTabs({ devices, active, onChange }) {
  return (
    <div className={styles.deviceTabs}>
      {devices.map(d => (
        <button
          key={d}
          className={`${styles.deviceTab} ${active === d ? styles.tabActive : ''}`}
          onClick={() => onChange(d)}
        >
          <span className={styles.tabDot} />
          Device {d}
        </button>
      ))}
    </div>
  )
}

// ── SectionHeader ──────────────────────────────────────────────────────────
export function SectionHeader({ title, right }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {right && <div className={styles.sectionRight}>{right}</div>}
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, className = '', style }) {
  return <div className={`${styles.card} ${className}`} style={style}>{children}</div>
}

// ── Loader ─────────────────────────────────────────────────────────────────
export function Loader({ size = 'md' }) {
  return (
    <div className={`${styles.loader} ${styles[`loader_${size}`]}`}>
      <div className={styles.loaderRing} />
    </div>
  )
}

// ── PageLoader ─────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className={styles.pageLoader}>
      <Loader size="lg" />
      <span className={styles.pageLoaderText}>Loading data...</span>
    </div>
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'No data', sub }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title}</div>
      {sub && <div className={styles.emptySub}>{sub}</div>}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ label, color = 'green' }) {
  return <span className={`${styles.badge} ${styles[`badge_${color}`]}`}>{label}</span>
}

// ── StatusPill ─────────────────────────────────────────────────────────────
export function StatusPill({ status }) {
  const map = {
    normal:  { label: 'NORMAL',  cls: 'green' },
    high:    { label: 'HIGH',    cls: 'red' },
    low:     { label: 'LOW',     cls: 'amber' },
    unknown: { label: 'UNKNOWN', cls: 'muted' },
  }
  const info = map[status] ?? map.unknown
  return <Badge label={info.label} color={info.cls} />
}

// ── Toggle ─────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange, loading, label }) {
  return (
    <div className={styles.toggleWrap}>
      <button
        className={`${styles.toggle} ${on ? styles.toggleOn : ''} ${loading ? styles.toggleLoading : ''}`}
        onClick={onChange}
        disabled={loading}
        aria-pressed={on}
      >
        <span className={styles.toggleThumb} />
      </button>
      {label && <span className={`${styles.toggleLabel} ${on ? styles.toggleLabelOn : ''}`}>{label}</span>}
    </div>
  )
}

// ── ChartTimeSelector ──────────────────────────────────────────────────────
export function ChartTimeSelector({ value, onChange, options }) {
  return (
    <div className={styles.timeSel}>
      {options.map(o => (
        <button
          key={o.value}
          className={`${styles.timeBtn} ${value === o.value ? styles.timeBtnActive : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Btn ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'secondary', icon, disabled, loading, type = 'button', ...rest }) {
  return (
    <button
      className={`${styles.btn} ${styles[`btn_${variant}`]}`}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <div className={styles.btnSpinner} /> : icon && <span className={styles.btnIcon}>{icon}</span>}
      {children}
    </button>
  )
}
