import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDevices, useDashboardReadings, useControls } from '../hooks'
import { fmt, fmtDateTime, tempStatus, humStatus } from '../utils'
import { MetricCard, Card, SectionHeader, Badge, StatusPill, Toggle, EmptyState } from '../components/UI'
import { MultiDeviceChart } from '../components/Charts'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import styles from './Dashboard.module.css'

const POLL = 15000

export default function Dashboard({ addToast }) {
  const { t } = useTranslation()

  const formatDeviceName = (name) => {
    if (!name) return ''
    const parent = String(name).match(/^parent\s+unit\s+(\d+)$/i)
    if (parent) return `${t('devices.parentDevice', 'Parent')} ${t('common.unit', 'Unit')} ${parent[1]}`

    const child = String(name).match(/^child\s+unit\s+(\d+)$/i)
    if (child) return `${t('devices.childDevice', 'Child')} ${t('common.unit', 'Unit')} ${child[1]}`

    return name
  }

  // Fetch devices
  const { devices, loading: devLoading, updateDeviceMode } = useDevices()
  const deviceIds = useMemo(() => devices.map(d => d.device_id), [devices])

  // Fetch latest reading for all populated devices
  const { data: readings, loading: rdgLoading } = useDashboardReadings(deviceIds, POLL)

  // Actuator controls
  const { controls, loading: ctrlLoading, updating, toggle } = useControls()

  const loading = devLoading || rdgLoading

  const navigate = useNavigate()

  // Fetch slot assignments for parent devices
  const [slotMap, setSlotMap] = useState({})

  useEffect(() => {
    devices.filter(d => d.type === 'parent').forEach(d => {
      api.get(`/devices/${d.device_id}/slots`).then(r => {
        if (r.data?.data) setSlotMap(p => ({ ...p, [d.device_id]: r.data.data }))
      }).catch(() => { })
    })
  }, [devices])

  const handleToggle = async (deviceId, field) => {
    const { success, newVal, error } = await toggle(deviceId, field)
    if (success) addToast(`${field.charAt(0).toUpperCase() + field.slice(1)} turned ${newVal ? 'ON' : 'OFF'}`, 'success')
    else addToast(error || `Failed to update ${field}`, 'error')
  }

  // Build alerts
  const alerts = []
  Object.entries(readings || {}).forEach(([d, r]) => {
    if (!r) return
    if (r.temperature > 30) alerts.push({ level: 'error', msg: t('dashboard.alertsMsg.highTemp', { device: d, val: fmt(r.temperature) }), time: r.recorded_at })
    if (r.temperature < 20) alerts.push({ level: 'warning', msg: t('dashboard.alertsMsg.lowTemp', { device: d, val: fmt(r.temperature) }), time: r.recorded_at })
    if (r.humidity > 75) alerts.push({ level: 'warning', msg: t('dashboard.alertsMsg.highHum', { device: d, val: fmt(r.humidity) }), time: r.recorded_at })
    if (r.humidity < 30) alerts.push({ level: 'warning', msg: t('dashboard.alertsMsg.lowHum', { device: d, val: fmt(r.humidity) }), time: r.recorded_at })
  })

  return (
    <div className={styles.page}>
      {/* Device snapshot cards */}
      <SectionHeader title={t('dashboard.deviceStatus')} />
      <div className={styles.deviceRow}>
        {devLoading ? (
          <div style={{ padding: 20 }}>{t('dashboard.loadingDevices')}</div>
        ) : devices.filter(d => d.type === 'parent').length === 0 ? (
          <EmptyState title={t('dashboard.noDevices')} icon="📉" sub={t('dashboard.noDevicesSub')} />
        ) : devices.filter(d => d.type === 'parent').map((device, i) => {
          const d = device.device_id
          const r = readings[d]
          const ctrl = controls[d] ?? {}
          return (
            <div key={d} className={`${styles.deviceCard} fade-up d${i + 1}`}>
              <div className={styles.deviceCardHeader}>
                <div className={styles.deviceId}>{formatDeviceName(device.name) || `${t('dashboard.device')} ${d}`}</div>
                <Badge label={device.status === 'offline' ? t('dashboard.offline') : t('dashboard.online')} color={device.status === 'offline' ? 'red' : 'green'} />
              </div>

              <div className={styles.deviceCardBody}>
                <div className={styles.metricsColumn}>
                  <div className={styles.miniMetrics}>
                    <div className={`${styles.metricTile} ${styles.metricTileTemp}`}>
                      <div className={styles.metricTileHeader}><span className={styles.metricTileIcon}>🌡️</span> {t('dashboard.temp')}</div>
                      <div className={styles.metricTileVal}>
                        {loading ? '—' : r?.temperature != null ? `${fmt(r.temperature)}°C` : '—'}
                      </div>
                      {r && <StatusPill status={tempStatus(r.temperature)} t={t} />}
                    </div>
                    <div className={`${styles.metricTile} ${styles.metricTileHum}`}>
                      <div className={styles.metricTileHeader}><span className={styles.metricTileIcon}>💧</span> {t('dashboard.humidity')}</div>
                      <div className={styles.metricTileVal}>
                        {loading ? '—' : r?.humidity != null ? `${fmt(r.humidity)}%` : '—'}
                      </div>
                      {r && <StatusPill status={humStatus(r.humidity)} t={t} />}
                    </div>
                    <div className={`${styles.metricTile} ${styles.metricTileLight}`}>
                      <div className={styles.metricTileHeader}><span className={styles.metricTileIcon}>☀️</span> {t('dashboard.light')}</div>
                      <div className={styles.metricTileVal}>
                        {loading ? '—' : r?.light_level != null ? `${fmt(r.light_level, 0)} lux` : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two Slot Status Tiles (read-only — click to go to Controls) */}
                <div className={styles.actuatorsColumn}>
                  <div className={styles.modeSwitchContainer}>
                    <div className={styles.modeSwitchLabel}>
                      <span>⚙️</span> {t('dashboard.controlMode', 'Control Mode')}
                      <Badge label={device.control_mode === 'manual' ? t('dashboard.modeManual', 'MANUAL') : t('dashboard.modeAuto', 'AUTO')} color={device.control_mode === 'manual' ? 'amber' : 'green'} />
                    </div>
                    <Toggle
                      on={device.control_mode === 'manual'}
                      onChange={async () => {
                        const newMode = device.control_mode === 'manual' ? 'auto' : 'manual'
                        const { success, error } = await updateDeviceMode(d, newMode)
                        if (success) addToast(t('dashboard.switchedMode', { mode: newMode.toUpperCase(), defaultValue: `Switched to ${newMode.toUpperCase()}` }), 'success')
                        else addToast(t('dashboard.failedMode', { error, defaultValue: `Failed: ${error}` }), 'error')
                      }}
                      label={t('dashboard.override', 'Override')}
                    />
                  </div>

                  <div className={styles.actuatorSubSection}>
                    <div className={styles.actuatorSubTitle}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{t('dashboard.actuatorSlots', 'Actuator Slots')}</span>
                      <button onClick={() => navigate('/controls')}
                        style={{ fontSize: '0.75rem', color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        {t('dashboard.manage', 'Manage')} →
                      </button>
                    </div>
                    <div className={styles.actuatorTilesGrid}>
                      {[1, 2].map(slotNum => {
                        const slotKey = `slot_${slotNum}_device`
                        const devSlots = slotMap[d] || {}
                        const assigned = devSlots[slotKey] || (slotNum === 1 ? 'fan' : 'light')
                        const ICONS = { fan: '🌀', heater: '🔥', light: '💡' }
                        const COLORS = { fan: 'var(--cyan)', heater: 'var(--red)', light: 'var(--amber)' }
                        // ctrl is kept live by the realtime subscription in useControls
                        const isOn = !!ctrl[assigned]
                        const color = COLORS[assigned] || 'var(--text-muted)'
                        return (
                          <div key={slotNum}
                            className={`${styles.actuatorTile} ${isOn ? styles.active : ''}`}
                            onClick={() => navigate('/controls')}
                            style={{ cursor: 'pointer', borderTop: `2px solid ${isOn ? color : 'var(--border-subtle)'}` }}
                          >
                            <div className={styles.actuatorTileHeader}>
                              <span className={styles.actuatorTileIcon}>{ICONS[assigned]}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('dashboard.slot', 'Slot')} {slotNum}</span>
                            </div>
                            <div className={styles.actuatorTileInfo}>
                              <div className={styles.actuatorTileName} style={{ textTransform: 'capitalize' }}>{t(`controls.actuators.${assigned}.label`, assigned)}</div>
                              <div className={styles.actuatorTileStatus} style={{ color: isOn ? color : 'var(--text-muted)' }}>
                                {isOn ? t('controls.on', 'ON') : t('controls.off', 'OFF')}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {r?.recorded_at && (
                <div className={styles.lastUpdate}>{t('dashboard.updated', { time: fmtDateTime(r.recorded_at) })}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Alerts */}
      <SectionHeader title={t('dashboard.activeAlerts')} />
      <Card className={`fade-up d3`}>
        {alerts.length === 0 ? (
          <div className={styles.allGood}>
            <span className={styles.allGoodIcon}>✓</span>
            {t('dashboard.allNormal')}
          </div>
        ) : (
          <div className={styles.alertList}>
            {alerts.map((a, i) => (
              <div key={i} className={`${styles.alertRow} ${styles[`alert_${a.level}`]}`}>
                <span className={styles.alertIcon}>{a.level === 'error' ? '🔴' : '🟡'}</span>
                <div>
                  <div className={styles.alertMsg}>{a.msg}</div>
                  {a.time && <div className={styles.alertTime}>{fmtDateTime(a.time)}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick stats row */}
      <SectionHeader title={t('dashboard.quickStats')} right={<span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t('dashboard.autoRefresh')}</span>} />
      <div className={styles.statsRow}>
        {[
          { label: t('dashboard.totalDevices'), value: devices.length, unit: '', color: 'var(--green)' },
          { label: t('dashboard.activeAlerts'), value: alerts.length, unit: '', color: alerts.length > 0 ? 'var(--red)' : 'var(--green)' },
          { label: t('dashboard.parentUnits'), value: devices.filter(d => d.type === 'parent').length, unit: '', color: 'var(--cyan)' },
          { label: t('dashboard.childUnits'), value: devices.filter(d => d.type === 'child').length, unit: '', color: 'var(--amber)' },
        ].map((s, i) => (
          <Card key={s.label} className={`${styles.statCard} fade-up d${i + 1}`}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue} style={{ color: s.color }}>{s.value}<span className={styles.statUnit}>{s.unit}</span></div>
          </Card>
        ))}
      </div>
    </div>
  )
}
