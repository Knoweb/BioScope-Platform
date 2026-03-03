import { useState, useMemo } from 'react'
import { useControls, useDevices, useAutomationRules } from '../hooks'
import { DEVICES, fmtDateTime } from '../utils'
import { DeviceTabs, SectionHeader, Card, Toggle, Badge, PageLoader, EmptyState, Btn } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import styles from './Controls.module.css'

const ACTUATORS = [
  {
    key: 'fan_status',
    i18nKey: 'fan',
    icon: '🌀',
    color: 'var(--cyan)',
  },
  {
    key: 'heater_status',
    i18nKey: 'heater',
    icon: '🔥',
    color: 'var(--red)',
  },
  {
    key: 'light_status',
    i18nKey: 'light',
    icon: '💡',
    color: 'var(--amber)',
  },
]

export default function Controls({ addToast }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  // Determine if the user has permission to edit automation rules
  const userRole = user?.user_metadata?.role || 'viewer'
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner' || userRole === 'operator'

  const [device, setDevice] = useState('C1')
  const { controls, loading, updating, toggle } = useControls()
  const { rules: automationRules, loading: rulesLoading, createRule, updateRule, deleteRule } = useAutomationRules(device)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editPrefix, setEditPrefix] = useState('')
  const [editSuffix, setEditSuffix] = useState('')
  const [savingRule, setSavingRule] = useState(false)

  const handleToggle = async (field) => {
    // We can also block manual toggles if needed, but per requirements we focus on rules
    const { success, newVal, error } = await toggle(device, field)
    if (success) {
      addToast(`${field.replace('_status', '')} ${newVal ? 'activated' : 'deactivated'} on ${device}`, 'success')
    } else {
      addToast(`Control update failed: ${error}`, 'error')
    }
  }

  const openModal = (rule) => {
    setEditingRule(rule)
    const match = rule.trigger_condition.match(/^(.*?)([<>=]+)\s*(\d+(\.\d+)?)(.*)$/)
    if (match) {
      setEditPrefix(match[1].trim() + ' ' + match[2].trim())
      setEditValue(match[3])
      setEditSuffix(match[5].trim())
    } else {
      setEditPrefix(rule.trigger_condition)
      setEditValue('')
      setEditSuffix('')
    }
    setModalOpen(true)
  }

  const closeRuleModal = () => {
    setModalOpen(false)
    setEditingRule(null)
  }

  const handleSaveRule = async (e) => {
    e.preventDefault()
    setSavingRule(true)
    try {
      if (editingRule) {
        let newCond = editingRule.trigger_condition
        if (editValue !== '') {
          newCond = `${editPrefix} ${editValue}${editSuffix ? ' ' + editSuffix : ''}`
        }
        await updateRule(editingRule.rule_id, { trigger_condition: newCond })
        addToast('Automation rule threshold updated successfully', 'success')
      }
      closeRuleModal()
    } catch (err) {
      addToast(`Failed to save rule: ${err.message}`, 'error')
    } finally {
      setSavingRule(false)
    }
  }

  const ctrl = controls[device] ?? {}
  const allDeviceControls = DEVICES.map(d => ({ id: d, ...controls[d] }))

  return (
    <div className={styles.page}>
      <DeviceTabs devices={DEVICES} active={device} onChange={setDevice} />

      {/* Actuator controls */}
      <SectionHeader title={t('controls.actuatorControls')} right={
        <Badge label={loading ? t('controls.loading') : t('controls.live')} color={loading ? 'muted' : 'green'} />
      } />
      <div className={styles.controlGrid}>
        {ACTUATORS.map((a, i) => {
          const isOn = !!ctrl[a.key]
          const isBusy = updating === `${device}.${a.key}`
          const actTrans = t(`controls.actuators.${a.i18nKey}`, { returnObjects: true })
          return (
            <Card key={a.key} className={`${styles.controlCard} fade-up d${i + 1}`} style={{ '--a-color': a.color }}>
              <div className={styles.cardHeader}>
                <span className={styles.actIcon} style={{ filter: isOn ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                <Badge label={isOn ? t('controls.active') : t('controls.inactive')} color={isOn ? 'green' : 'muted'} />
              </div>
              <div className={styles.actName}>{actTrans.label}</div>
              <div className={styles.actDesc}>{actTrans.desc}</div>
              <div className={styles.actAuto}>{actTrans.auto}</div>
              <div className={styles.controlRow}>
                <Toggle on={isOn} loading={isBusy} onChange={() => handleToggle(a.key)} label={isOn ? t('controls.on') : t('controls.off')} />
              </div>
              <div className={styles.statusBar} style={{ background: isOn ? a.color : 'var(--border-subtle)' }} />
            </Card>
          )
        })}
      </div>

      {/* All-device overview */}
      <SectionHeader title={t('controls.allDevicesOverview')} />
      <Card className="fade-up d4">
        <div className={styles.overviewTable}>
          <div className={styles.overviewHeader}>
            <span>{t('controls.deviceCol')}</span>
            <span>{t('controls.fanCol')}</span>
            <span>{t('controls.heaterCol')}</span>
            <span>{t('controls.lightCol')}</span>
          </div>
          {allDeviceControls.map(d => (
            <div key={d.id} className={styles.overviewRow}>
              <span className={styles.overviewDevice}>{t('dashboard.device')} {d.id}</span>
              {['fan_status', 'heater_status', 'light_status'].map(k => (
                <span key={k}>
                  <Badge label={d[k] ? t('controls.on') : t('controls.off')} color={d[k] ? 'green' : 'muted'} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Automation rules */}
      <SectionHeader
        title={t('controls.automationRulesFor', { device })}
      />

      <Card className="fade-up d5">
        {rulesLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('controls.loadingRules')}</div>
        ) : automationRules.length === 0 ? (
          <EmptyState icon="⚙️" title={t('controls.noRules')} sub={t('controls.createRule')} />
        ) : (
          <div className={styles.ruleList}>
            {automationRules.map((r) => (
              <div key={r.rule_id} className={styles.ruleRow}>
                <div className={styles.ruleAccent} style={{ background: r.is_active ? 'var(--cyan)' : 'var(--border-subtle)' }} />
                <div className={styles.ruleContent}>
                  <div className={styles.ruleCondition}>{t('controls.if')} {r.trigger_condition}</div>
                  <div className={styles.ruleAction}>{t('controls.then')} {r.action}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{t('controls.name', { name: r.name })}</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {isAdminOrOwner ? (
                    <button
                      onClick={() => updateRule(r.rule_id, { is_active: !r.is_active })}
                      style={{
                        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseOut={e => e.currentTarget.style.opacity = '1'}
                      title={r.is_active ? t('controls.clickToDisable') : t('controls.clickToEnable')}
                    >
                      <Badge label={r.is_active ? t('controls.active') : t('controls.disabled')} color={r.is_active ? 'green' : 'muted'} />
                    </button>
                  ) : (
                    <Badge label={r.is_active ? t('controls.active') : t('controls.disabled')} color={r.is_active ? 'green' : 'muted'} />
                  )}

                  {isAdminOrOwner && (
                    <Btn variant="secondary" onClick={() => openModal(r)}>{t('controls.editThresholdBtn')}</Btn>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Rule Modal */}
      {modalOpen && isAdminOrOwner && editingRule && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{t('controls.editThresholdTitle')}</h2>
            <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <div><strong>{t('controls.systemRule')}</strong> {editingRule.name}</div>
              <div><strong>{t('controls.executeAction')}</strong> {editingRule.action}</div>
            </div>
            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('controls.triggerCondition')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{editPrefix}</span>
                  <input required type="number" step="any" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--text-muted)', background: 'var(--bg-card)', color: 'var(--text-main)', textAlign: 'center', fontSize: '1rem' }} />
                  <span style={{ color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{editSuffix}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <Btn variant="secondary" onClick={closeRuleModal} type="button">{t('controls.cancel')}</Btn>
                <Btn variant="primary" loading={savingRule} type="submit">{t('controls.updateRuleBtn')}</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
