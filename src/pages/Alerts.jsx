import { useState } from 'react'
import { useReadings } from '../hooks'
import { DEVICES, fmt, fmtDateTime, tempStatus, humStatus } from '../utils'
import { Card, SectionHeader, Badge, Btn } from '../components/UI'
import styles from './Alerts.module.css'

const ALERT_RULES = [
  { id: 1, name: 'High Temperature', condition: 'temp > 30°C',    severity: 'critical', channel: 'Email + App', active: true  },
  { id: 2, name: 'Low Temperature',  condition: 'temp < 20°C',    severity: 'warning',  channel: 'Email + App', active: true  },
  { id: 3, name: 'High Humidity',    condition: 'humidity > 75%', severity: 'warning',  channel: 'App',         active: true  },
  { id: 4, name: 'Low Humidity',     condition: 'humidity < 30%', severity: 'warning',  channel: 'App',         active: false },
  { id: 5, name: 'Device Offline',   condition: 'No data > 60s',  severity: 'critical', channel: 'Email + App', active: true  },
]

export default function Alerts({ addToast }) {
  const [rules, setRules] = useState(ALERT_RULES)

  const c1 = useReadings('C1', 1, 15000)
  const c2 = useReadings('C2', 1, 15000)
  const readings = { C1: c1.data, C2: c2.data }

  // Build live alerts
  const liveAlerts = []
  Object.entries(readings).forEach(([d, r]) => {
    if (!r) return
    if (r.temperature > 30) liveAlerts.push({ level: 'critical', device: d, metric: 'Temperature', value: `${fmt(r.temperature)}°C`, time: r.recorded_at, rule: 'High Temperature' })
    if (r.temperature < 20) liveAlerts.push({ level: 'warning',  device: d, metric: 'Temperature', value: `${fmt(r.temperature)}°C`, time: r.recorded_at, rule: 'Low Temperature' })
    if (r.humidity > 75)    liveAlerts.push({ level: 'warning',  device: d, metric: 'Humidity',    value: `${fmt(r.humidity)}%`,     time: r.recorded_at, rule: 'High Humidity' })
    if (r.humidity < 30)    liveAlerts.push({ level: 'warning',  device: d, metric: 'Humidity',    value: `${fmt(r.humidity)}%`,     time: r.recorded_at, rule: 'Low Humidity' })
  })

  const toggleRule = (id) => {
    setRules(r => r.map(rule => rule.id === id ? { ...rule, active: !rule.active } : rule))
    const rule = rules.find(r => r.id === id)
    addToast(`Rule "${rule.name}" ${rule.active ? 'disabled' : 'enabled'}`, 'info')
  }

  const severityColor = (s) => s === 'critical' ? 'red' : 'amber'

  return (
    <div className={styles.page}>
      {/* Live alerts */}
      <SectionHeader title="Live Alerts" right={
        <Badge label={liveAlerts.length > 0 ? `${liveAlerts.length} ACTIVE` : 'ALL CLEAR'} color={liveAlerts.length > 0 ? 'red' : 'green'} />
      } />
      <Card className="fade-up d1">
        {liveAlerts.length === 0 ? (
          <div className={styles.allClear}>
            <span className={styles.allClearIcon}>✓</span>
            <div>
              <div className={styles.allClearTitle}>All systems nominal</div>
              <div className={styles.allClearSub}>All sensor readings are within configured thresholds</div>
            </div>
          </div>
        ) : (
          <div className={styles.alertList}>
            {liveAlerts.map((a, i) => (
              <div key={i} className={`${styles.alertRow} ${a.level === 'critical' ? styles.alertCritical : styles.alertWarning}`}>
                <span className={styles.alertSeverityIcon}>{a.level === 'critical' ? '🔴' : '🟡'}</span>
                <div className={styles.alertBody}>
                  <div className={styles.alertTitle}>
                    {a.rule} — Device {a.device}
                    <Badge label={a.level.toUpperCase()} color={severityColor(a.level)} />
                  </div>
                  <div className={styles.alertDetail}>{a.metric}: {a.value} · {fmtDateTime(a.time)}</div>
                </div>
                <Btn onClick={() => addToast(`Alert acknowledged for ${a.device}`, 'success')} variant="secondary">ACK</Btn>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Alert rules */}
      <SectionHeader title="Alert Rules" />
      <Card className="fade-up d2">
        <div className={styles.ruleList}>
          <div className={styles.ruleHeader}>
            <span>RULE NAME</span>
            <span>CONDITION</span>
            <span>SEVERITY</span>
            <span>CHANNEL</span>
            <span>STATUS</span>
            <span></span>
          </div>
          {rules.map(r => (
            <div key={r.id} className={styles.ruleRow}>
              <span className={styles.ruleName}>{r.name}</span>
              <span className={styles.ruleCond}>{r.condition}</span>
              <Badge label={r.severity.toUpperCase()} color={severityColor(r.severity)} />
              <span className={styles.ruleChannel}>{r.channel}</span>
              <Badge label={r.active ? 'ACTIVE' : 'DISABLED'} color={r.active ? 'green' : 'muted'} />
              <Btn onClick={() => toggleRule(r.id)} variant="secondary">{r.active ? 'Disable' : 'Enable'}</Btn>
            </div>
          ))}
        </div>
      </Card>

      {/* Notification channels */}
      <SectionHeader title="Notification Channels" />
      <Card className="fade-up d3">
        <div className={styles.channels}>
          {[
            { icon: '📧', name: 'Email Alerts', desc: 'admin@bioscope.io',       status: 'active' },
            { icon: '📱', name: 'In-App Alerts', desc: 'Browser push enabled',   status: 'active' },
            { icon: '💬', name: 'SMS Alerts',    desc: 'Not configured',          status: 'inactive' },
          ].map(c => (
            <div key={c.name} className={styles.channel}>
              <span className={styles.channelIcon}>{c.icon}</span>
              <div className={styles.channelBody}>
                <div className={styles.channelName}>{c.name}</div>
                <div className={styles.channelDesc}>{c.desc}</div>
              </div>
              <Badge label={c.status.toUpperCase()} color={c.status === 'active' ? 'green' : 'muted'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
