import styles from './UI.module.css'
import { formatLocalizedDeviceName } from '../utils'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  return (
    <div className={styles.deviceTabs}>
      {devices.map(d => {
        const isObj = typeof d === 'object'
        const id = isObj ? d.device_id : d
        const name = isObj ? (formatLocalizedDeviceName(d.name, t) || `${t('dashboard.device', 'Device')} ${id}`) : `${t('dashboard.device', 'Device')} ${d}`
        return (
          <button
            key={id}
            className={`${styles.deviceTab} ${active === id ? styles.tabActive : ''}`}
            onClick={() => onChange(id)}
          >
            <span className={styles.tabDot} />
            {name}
          </button>
        )
      })}
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
  const { t } = useTranslation()
  return (
    <div className={styles.pageLoader}>
      <Loader size="lg" />
      <span className={styles.pageLoaderText}>{t('common.loadingData', 'Loading data...')}</span>
    </div>
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'No data', sub }) {
  const { t } = useTranslation()
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title || t('common.noData', 'No data')}</div>
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
  const { t } = useTranslation()
  const map = {
    normal: { label: t('common.status.normal', 'NORMAL'), cls: 'green' },
    high: { label: t('common.status.high', 'HIGH'), cls: 'red' },
    low: { label: t('common.status.low', 'LOW'), cls: 'amber' },
    unknown: { label: t('common.status.unknown', 'UNKNOWN'), cls: 'muted' },
  }
  const info = map[status] ?? map.unknown
  return <Badge label={info.label} color={info.cls} />
}

// ── Toggle ─────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange, loading, disabled, label }) {
  return (
    <div className={styles.toggleWrap}>
      <button
        className={`${styles.toggle} ${on ? styles.toggleOn : ''} ${loading ? styles.toggleLoading : ''} ${disabled && !loading ? styles.toggleDisabled : ''}`}
        onClick={onChange}
        disabled={loading || disabled}
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
export function Btn({ children, onClick, variant = 'secondary', icon, disabled, loading }) {
  return (
    <button
      className={`${styles.btn} ${styles[`btn_${variant}`]}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <div className={styles.btnSpinner} /> : icon && <span className={styles.btnIcon}>{icon}</span>}
      {children}
    </button>
  )
}
