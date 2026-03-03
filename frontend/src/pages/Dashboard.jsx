import { useState, useCallback, useMemo } from 'react'
import { useDevices, useDashboardReadings, useControls } from '../hooks'
import { fmt, fmtDateTime, tempStatus, humStatus } from '../utils'
import { MetricCard, Card, SectionHeader, Badge, StatusPill, Toggle, EmptyState } from '../components/UI'
import { MultiDeviceChart } from '../components/Charts'
import { useTranslation } from 'react-i18next'
import styles from './Dashboard.module.css'

const POLL = 15000

export default function Dashboard({ addToast }) {
  const { t } = useTranslation()

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
        ) : devices.length === 0 ? (
          <EmptyState title={t('dashboard.noDevices')} icon="📉" sub={t('dashboard.noDevicesSub')} />
        ) : devices.map((device, i) => {
          const d = device.device_id
          const r = readings[d]
          const ctrl = controls[d] ?? {}
          return (
            <div key={d} className={`${styles.deviceCard} fade-up d${i + 1}`}>
              <div className={styles.deviceCardHeader}>
                <div className={styles.deviceId}>{device.name || `${t('dashboard.device')} ${d}`}</div>
                <Badge label={device.status === 'offline' ? t('dashboard.offline') : t('dashboard.online')} color={device.status === 'offline' ? 'red' : 'green'} />
              </div>

              <div className={styles.miniMetrics}>
                <div className={styles.miniMetric}>
                  <span className={styles.miniLabel}>{t('dashboard.temp')}</span>
                  <span className={styles.miniVal} style={{ color: 'var(--red)' }}>
                    {loading ? '—' : r?.temperature != null ? `${fmt(r.temperature)}°C` : '—'}
                  </span>
                  {r && <StatusPill status={tempStatus(r.temperature)} t={t} />}
                </div>
                <div className={styles.miniMetric}>
                  <span className={styles.miniLabel}>{t('dashboard.humidity')}</span>
                  <span className={styles.miniVal} style={{ color: 'var(--cyan)' }}>
                    {loading ? '—' : r?.humidity != null ? `${fmt(r.humidity)}%` : '—'}
                  </span>
                  {r && <StatusPill status={humStatus(r.humidity)} t={t} />}
                </div>
                <div className={styles.miniMetric}>
                  <span className={styles.miniLabel}>{t('dashboard.light')}</span>
                  <span className={styles.miniVal} style={{ color: 'var(--amber)' }}>
                    {loading ? '—' : r?.light_level != null ? `${fmt(r.light_level, 0)} lux` : '—'}
                  </span>
                </div>
              </div>

              <div className={styles.actuators}>
                {[
                  { key: 'fan_status', label: t('dashboard.fan'), },
                  { key: 'light_status', label: t('dashboard.lightActuator'), },
                  { key: 'heater_status', label: t('dashboard.heater'), },
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
          { label: t('dashboard.fansActive'), value: devices.filter(d => controls[d.device_id]?.fan_status).length, unit: `/${devices.length}`, color: 'var(--cyan)' },
          { label: t('dashboard.heatersActive'), value: devices.filter(d => controls[d.device_id]?.heater_status).length, unit: `/${devices.length}`, color: 'var(--amber)' },
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
