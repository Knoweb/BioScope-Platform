import { useState, useCallback, useMemo } from 'react'
import { useDevices, useDashboardReadings, useControls } from '../hooks'
import { fmt, fmtDateTime, tempStatus, humStatus } from '../utils'
import { MetricCard, Card, SectionHeader, Badge, StatusPill, Toggle, EmptyState } from '../components/UI'
import { MultiDeviceChart } from '../components/Charts'
import styles from './Dashboard.module.css'

const POLL = 15000

export default function Dashboard({ addToast }) {
  // Fetch devices
  const { devices, loading: devLoading } = useDevices()
  const deviceIds = useMemo(() => devices.map(d => d.device_id), [devices])

  // Fetch latest reading for all populated devices
  const { data: readings, loading: rdgLoading } = useDashboardReadings(deviceIds, POLL)

  // Actuator controls
  const { controls, loading: ctrlLoading, updating, toggle } = useControls()

  const loading = devLoading || rdgLoading

  const handleToggle = async (deviceId, field) => {
    const { success, newVal, error } = await toggle(deviceId, field)
    if (success) addToast(`${deviceId} ${field.replace('_', ' ')} turned ${newVal ? 'ON' : 'OFF'}`, 'success')
    else addToast(`Failed to update ${field}: ${error}`, 'error')
  }

  // Build alerts
  const alerts = []
  Object.entries(readings || {}).forEach(([d, r]) => {
    if (!r) return
    if (r.temperature > 30) alerts.push({ level: 'error', msg: `High temperature on ${d}: ${fmt(r.temperature)}°C`, time: r.recorded_at })
    if (r.temperature < 20) alerts.push({ level: 'warning', msg: `Low temperature on ${d}: ${fmt(r.temperature)}°C`, time: r.recorded_at })
    if (r.humidity > 75) alerts.push({ level: 'warning', msg: `High humidity on ${d}: ${fmt(r.humidity)}%`, time: r.recorded_at })
    if (r.humidity < 30) alerts.push({ level: 'warning', msg: `Low humidity on ${d}: ${fmt(r.humidity)}%`, time: r.recorded_at })
  })

  return (
    <div className={styles.page}>
      {/* Device snapshot cards */}
      <SectionHeader title="Device Status" />
      <div className={styles.deviceRow}>
        {devLoading ? (
          <div style={{ padding: 20 }}>Loading devices...</div>
        ) : devices.length === 0 ? (
          <EmptyState title="No devices found" icon="📉" sub="Please add a device from the devices page" />
        ) : devices.map((device, i) => {
          const d = device.device_id
          const r = readings[d]
          const ctrl = controls[d] ?? {}
          return (
            <div key={d} className={`${styles.deviceCard} fade-up d${i + 1}`}>
              <div className={styles.deviceCardHeader}>
                <div className={styles.deviceId}>{device.name || `DEVICE ${d}`}</div>
                <Badge label={device.status === 'offline' ? 'OFFLINE' : 'ONLINE'} color={device.status === 'offline' ? 'red' : 'green'} />
              </div>

              <div className={styles.miniMetrics}>
                <div className={styles.miniMetric}>
                  <span className={styles.miniLabel}>TEMP</span>
                  <span className={styles.miniVal} style={{ color: 'var(--red)' }}>
                    {loading ? '—' : r?.temperature != null ? `${fmt(r.temperature)}°C` : '—'}
                  </span>
                  {r && <StatusPill status={tempStatus(r.temperature)} />}
                </div>
                <div className={styles.miniMetric}>
                  <span className={styles.miniLabel}>HUMIDITY</span>
                  <span className={styles.miniVal} style={{ color: 'var(--cyan)' }}>
                    {loading ? '—' : r?.humidity != null ? `${fmt(r.humidity)}%` : '—'}
                  </span>
                  {r && <StatusPill status={humStatus(r.humidity)} />}
                </div>
                <div className={styles.miniMetric}>
                  <span className={styles.miniLabel}>LIGHT</span>
                  <span className={styles.miniVal} style={{ color: 'var(--amber)' }}>
                    {loading ? '—' : r?.light_level != null ? `${fmt(r.light_level, 0)} lux` : '—'}
                  </span>
                </div>
              </div>

              <div className={styles.actuators}>
                {[
                  { key: 'fan_status', label: '🌀 Fan', },
                  { key: 'light_status', label: '💡 Light', },
                  { key: 'heater_status', label: '🔥 Heater', },
                ].map(({ key, label }) => (
                  <div key={key} className={styles.actuatorRow}>
                    <span className={styles.actuatorLabel}>{label}</span>
                    <Toggle
                      on={!!ctrl[key]}
                      loading={updating === `${d}.${key}`}
                      onChange={() => handleToggle(d, key)}
                    />
                  </div>
                ))}
              </div>

              {r?.recorded_at && (
                <div className={styles.lastUpdate}>Updated {fmtDateTime(r.recorded_at)}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Alerts */}
      <SectionHeader title="Active Alerts" />
      <Card className={`fade-up d3`}>
        {alerts.length === 0 ? (
          <div className={styles.allGood}>
            <span className={styles.allGoodIcon}>✓</span>
            All parameters within normal range
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
      <SectionHeader title="Quick Stats" right={<span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>AUTO-REFRESH 15s</span>} />
      <div className={styles.statsRow}>
        {[
          { label: 'TOTAL DEVICES', value: devices.length, unit: '', color: 'var(--green)' },
          { label: 'ACTIVE ALERTS', value: alerts.length, unit: '', color: alerts.length > 0 ? 'var(--red)' : 'var(--green)' },
          { label: 'FANS ACTIVE', value: devices.filter(d => controls[d.device_id]?.fan_status).length, unit: `/${devices.length}`, color: 'var(--cyan)' },
          { label: 'HEATERS ACTIVE', value: devices.filter(d => controls[d.device_id]?.heater_status).length, unit: `/${devices.length}`, color: 'var(--amber)' },
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
