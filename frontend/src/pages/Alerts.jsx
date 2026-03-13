import { useAlerts } from '../hooks'
import { alertsAPI } from '../api'
import { fmtDateTime, translateRuleName, translateConditionText, translateSeverityLabel, translateChannelStatus } from '../utils'
import { Card, SectionHeader, Badge, Btn, PageLoader } from '../components/UI'
import { useTranslation } from 'react-i18next'
import styles from './Alerts.module.css'

export default function Alerts({ addToast }) {
  const { t } = useTranslation()
  const { alerts: liveAlerts, rules, loading, refetch } = useAlerts()

  const toggleRule = async (id, currentActive) => {
    try {
      await alertsAPI.updateAlertRule(id, { active: !currentActive })
      addToast(currentActive ? t('alerts.ruleDisabled') : t('alerts.ruleEnabled'), 'info')
      refetch()
    } catch (e) {
      addToast(t('alerts.ruleUpdateFailed'), 'error')
    }
  }

  const handleAck = async (id, device) => {
    try {
      await alertsAPI.acknowledgeAlert(id)
      addToast(t('alerts.alertAck', { device }), 'success')
      refetch()
    } catch (e) {
      addToast(t('alerts.ackFailed'), 'error')
    }
  }

  const severityColor = (s) => s === 'critical' ? 'red' : 'amber'

  if (loading) {
    return <div className={styles.page}><PageLoader /></div>
  }

  return (
    <div className={styles.page}>
      {/* Live alerts */}
      <SectionHeader title={t('alerts.liveAlerts')} right={
        <Badge label={liveAlerts.length > 0 ? t('alerts.activeCount', { count: liveAlerts.length }) : t('alerts.allClear')} color={liveAlerts.length > 0 ? 'red' : 'green'} />
      } />
      <Card className="fade-up d1">
        {liveAlerts.length === 0 ? (
          <div className={styles.allClear}>
            <span className={styles.allClearIcon}>✓</span>
            <div>
              <div className={styles.allClearTitle}>{t('alerts.systemsNominal')}</div>
              <div className={styles.allClearSub}>{t('alerts.nominalSub')}</div>
            </div>
          </div>
        ) : (
          <div className={styles.alertList}>
            {liveAlerts.map((a) => (
              <div key={a.id} className={`${styles.alertRow} ${a.severity === 'critical' ? styles.alertCritical : styles.alertWarning}`}>
                <span className={styles.alertSeverityIcon}>{a.severity === 'critical' ? '🔴' : '🟡'}</span>
                <div className={styles.alertBody}>
                  <div className={styles.alertTitle}>
                    {translateRuleName(a.title || a.message, t)} — {t('alerts.device', { id: a.device_id })}
                    <Badge label={translateSeverityLabel(a.severity, t)} color={severityColor(a.severity)} />
                  </div>
                  <div className={styles.alertDetail}>{a.message} · {fmtDateTime(a.created_at)}</div>
                </div>
                <Btn onClick={() => handleAck(a.id, a.device_id)} variant="secondary">{t('alerts.ackBtn')}</Btn>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Alert rules */}
      <SectionHeader title={t('alerts.alertRules')} />
      <Card className="fade-up d2">
        <div className={styles.ruleList}>
          <div className={styles.ruleHeader}>
            <span>{t('alerts.colRuleName')}</span>
            <span>{t('alerts.colCondition')}</span>
            <span>{t('alerts.colSeverity')}</span>
            <span>{t('alerts.colChannel')}</span>
            <span>{t('alerts.colStatus')}</span>
            <span></span>
          </div>
          {rules.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>{t('alerts.noRules')}</div>
          ) : rules.map(r => (
            <div key={r.rule_id || r.id} className={styles.ruleRow}>
              <span className={styles.ruleName}>{translateRuleName(r.name, t)}</span>
              <span className={styles.ruleCond}>{translateConditionText(r.condition, t)}</span>
              <Badge label={translateSeverityLabel(r.severity, t)} color={severityColor(r.severity)} />
              <span className={styles.ruleChannel}>{r.channel || t('alerts.appChannel')}</span>
              <Badge label={r.is_active ? t('alerts.active') : t('alerts.disabled')} color={r.is_active ? 'green' : 'muted'} />
              <Btn onClick={() => toggleRule(r.rule_id || r.id, r.is_active)} variant="secondary">{r.is_active ? t('alerts.disableBtn') : t('alerts.enableBtn')}</Btn>
            </div>
          ))}
        </div>
      </Card>

      {/* Notification channels */}
      <SectionHeader title={t('alerts.notificationChannels')} />
      <Card className="fade-up d3">
        <div className={styles.channels}>
          {[
            { icon: '📧', name: t('alerts.emailAlerts'), desc: t('alerts.emailDesc'), status: 'active' },
            { icon: '📱', name: t('alerts.inAppAlerts'), desc: t('alerts.inAppDesc'), status: 'active' },
            { icon: '💬', name: t('alerts.smsAlerts'), desc: t('alerts.smsDesc'), status: 'inactive' },
          ].map(c => (
            <div key={c.name} className={styles.channel}>
              <span className={styles.channelIcon}>{c.icon}</span>
              <div className={styles.channelBody}>
                <div className={styles.channelName}>{c.name}</div>
                <div className={styles.channelDesc}>{c.desc}</div>
              </div>
              <Badge label={translateChannelStatus(c.status, t)} color={c.status === 'active' ? 'green' : 'muted'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
