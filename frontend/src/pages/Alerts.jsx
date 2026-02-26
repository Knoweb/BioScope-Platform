import { useAlerts } from '../hooks'
import { alertsAPI } from '../api'
import { fmtDateTime } from '../utils'
import { Card, SectionHeader, Badge, Btn, PageLoader } from '../components/UI'
import styles from './Alerts.module.css'

export default function Alerts({ addToast }) {
  const { alerts: liveAlerts, rules, loading, refetch } = useAlerts()

  const toggleRule = async (id, currentActive) => {
    try {
      await alertsAPI.updateAlertRule(id, { active: !currentActive })
      addToast(`Rule ${currentActive ? 'disabled' : 'enabled'} successfully`, 'info')
      refetch()
    } catch (e) {
      addToast(`Failed to update rule`, 'error')
    }
  }

  const handleAck = async (id, device) => {
    try {
      await alertsAPI.acknowledgeAlert(id)
      addToast(`Alert acknowledged for ${device}`, 'success')
      refetch()
    } catch (e) {
      addToast(`Failed to acknowledge alert`, 'error')
    }
  }

  const severityColor = (s) => s === 'critical' ? 'red' : 'amber'

  if (loading) {
    return <div className={styles.page}><PageLoader /></div>
  }

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
            {liveAlerts.map((a) => (
              <div key={a.id} className={`${styles.alertRow} ${a.severity === 'critical' ? styles.alertCritical : styles.alertWarning}`}>
                <span className={styles.alertSeverityIcon}>{a.severity === 'critical' ? '🔴' : '🟡'}</span>
                <div className={styles.alertBody}>
                  <div className={styles.alertTitle}>
                    {a.title || a.message} — Device {a.device_id}
                    <Badge label={(a.severity || 'warning').toUpperCase()} color={severityColor(a.severity)} />
                  </div>
                  <div className={styles.alertDetail}>{a.message} · {fmtDateTime(a.created_at)}</div>
                </div>
                <Btn onClick={() => handleAck(a.id, a.device_id)} variant="secondary">ACK</Btn>
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
          {rules.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No rules configured</div>
          ) : rules.map(r => (
            <div key={r.rule_id || r.id} className={styles.ruleRow}>
              <span className={styles.ruleName}>{r.name}</span>
              <span className={styles.ruleCond}>{r.condition}</span>
              <Badge label={(r.severity || 'warning').toUpperCase()} color={severityColor(r.severity)} />
              <span className={styles.ruleChannel}>{r.channel || 'App'}</span>
              <Badge label={r.is_active ? 'ACTIVE' : 'DISABLED'} color={r.is_active ? 'green' : 'muted'} />
              <Btn onClick={() => toggleRule(r.rule_id || r.id, r.is_active)} variant="secondary">{r.is_active ? 'Disable' : 'Enable'}</Btn>
            </div>
          ))}
        </div>
      </Card>

      {/* Notification channels */}
      <SectionHeader title="Notification Channels" />
      <Card className="fade-up d3">
        <div className={styles.channels}>
          {[
            { icon: '📧', name: 'Email Alerts', desc: 'admin@bioscope.io', status: 'active' },
            { icon: '📱', name: 'In-App Alerts', desc: 'Browser push enabled', status: 'active' },
            { icon: '💬', name: 'SMS Alerts', desc: 'Not configured', status: 'inactive' },
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
