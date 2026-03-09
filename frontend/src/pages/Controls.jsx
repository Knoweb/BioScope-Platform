import { useState, useEffect, useMemo } from 'react'
import { useControls, useDevices, useAutomationRules } from '../hooks'
import { fmtDateTime } from '../utils'
import { DeviceTabs, SectionHeader, Card, Toggle, Badge, PageLoader, EmptyState, Btn } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import styles from './Controls.module.css'

// Format `act1_fan:on` -> "A1 Fan → ON"
const formatAction = (action) => {
  if (!action) return action
  const [key, cmd] = action.split(':')
  const labels = { act1_fan: 'A1 Fan', act1_light: 'A1 Light', act1_heater: 'A1 Heater', act2_fan: 'A2 Fan', act2_light: 'A2 Light', act2_heater: 'A2 Heater' }
  return `${labels[key] || key} → ${(cmd || '').toUpperCase()}`
}

const ACTUATOR_GROUPS = [
  {
    groupId: 'act1',
    name: 'Actuator 1',
    color: 'var(--cyan)',
    controls: [
      { key: 'act1_fan', i18nKey: 'fan', icon: '🌀' },
      { key: 'act1_light', i18nKey: 'light', icon: '💡' },
      { key: 'act1_heater', i18nKey: 'heater', icon: '🔥', fallbackName: 'Heater' },
    ]
  },
  {
    groupId: 'act2',
    name: 'Actuator 2',
    color: 'var(--amber)',
    controls: [
      { key: 'act2_fan', i18nKey: 'fan', icon: '🌀' },
      { key: 'act2_light', i18nKey: 'light', icon: '💡' },
      { key: 'act2_heater', i18nKey: 'heater', icon: '🔥', fallbackName: 'Heater' },
    ]
  }
]

export default function Controls({ addToast }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const userRole = user?.user_metadata?.role || 'viewer'
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner' || userRole === 'operator'

  const { devices, loading: devLoading } = useDevices()
  const parents = useMemo(() => devices.filter(d => d.type === 'parent'), [devices])
  const parentIds = useMemo(() => parents.map(p => p.device_id), [parents])

  const [device, setDevice] = useState('')

  useEffect(() => {
    if (parentIds.length > 0 && !device) setDevice(parentIds[0])
  }, [parentIds, device])

  const { controls, loading, updating, toggle } = useControls()
  const { rules: automationRules, loading: rulesLoading, createRule, updateRule, deleteRule } = useAutomationRules(device)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editPriority, setEditPriority] = useState(10)
  const [savingRule, setSavingRule] = useState(false)

  const handleToggle = async (field) => {
    const { success, newVal, error } = await toggle(device, field)
    if (success) {
      addToast(`${field.replace('_status', '')} ${newVal ? 'activated' : 'deactivated'} on ${device}`, 'success')
    } else {
      addToast(`Control update failed: ${error}`, 'error')
    }
  }

  const openModal = (rule) => {
    setEditingRule(rule)
    setEditValue(rule.trigger_condition)
    setEditPriority(rule.priority || 10)
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
        await updateRule(editingRule.rule_id, { trigger_condition: editValue, priority: editPriority })
        addToast('Automation rule updated successfully', 'success')
      }
      closeRuleModal()
    } catch (err) {
      addToast(`Failed to save rule: ${err.message}`, 'error')
    } finally {
      setSavingRule(false)
    }
  }

  const ctrl = controls[device] ?? {}
  const allDeviceControls = parents.map(d => ({ id: d.device_id, name: d.name, ...controls[d.device_id] }))

  if (devLoading) {
    return <div className={styles.page}><PageLoader /></div>
  }

  if (!devLoading && parentIds.length === 0) {
    return (
      <div className={styles.page}>
        <EmptyState title="No Parent Units Found" sub="Actuators can only be controlled on parent units." />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <DeviceTabs devices={parents} active={device} onChange={setDevice} />

      {/* Actuator controls */}
      <SectionHeader title={t('controls.actuatorControls')} right={
        <Badge label={loading ? t('controls.loading') : t('controls.live')} color={loading ? 'muted' : 'green'} />
      } />
      <div className={styles.controlGridGrouped}>
        {ACTUATOR_GROUPS.map((g, i) => (
          <Card key={g.groupId} className={`${styles.controlCardGrouped} fade-up d${i + 1}`} style={{ '--a-color': g.color }}>
            <div className={styles.groupHeader}>
              <div className={styles.actGroupName}>{g.name}</div>
            </div>
            <div className={styles.groupControls}>
              {g.controls.map(c => {
                const isOn = !!ctrl[c.key]
                const isBusy = updating === `${device}.${c.key}`
                const actTrans = t(`controls.actuators.${c.i18nKey}`, { returnObjects: true, defaultValue: { label: c.fallbackName || c.i18nKey } })
                const labelText = typeof actTrans === 'object' ? actTrans.label : (c.fallbackName || c.i18nKey)
                return (
                  <div key={c.key} className={styles.subControlItem} style={{ borderLeftColor: isOn ? g.color : 'transparent' }}>
                    <div className={styles.subControlInfo}>
                      <span className={styles.subActIcon} style={{ filter: isOn ? 'none' : 'grayscale(1)' }}>{c.icon}</span>
                      <div className={styles.subActText}>
                        <div className={styles.subActName}>{labelText}</div>
                        <div className={styles.subActStatus} style={{ color: isOn ? 'var(--green)' : 'var(--text-muted)' }}>
                          {isOn ? t('controls.active') : t('controls.inactive')}
                        </div>
                      </div>
                    </div>
                    <Toggle on={isOn} loading={isBusy} onChange={() => handleToggle(c.key)} label={isOn ? t('controls.on') : t('controls.off')} />
                  </div>
                )
              })}
            </div>
            <div className={styles.statusBar} style={{ background: g.color }} />
          </Card>
        ))}
      </div>

      {/* All-device overview */}
      <SectionHeader title={t('controls.allDevicesOverview')} />
      <Card className="fade-up d4">
        <div className={styles.overviewTable}>
          <div className={`${styles.overviewHeader} ${styles.overviewHeaderWide}`}>
            <span>{t('controls.deviceCol')}</span>
            <span>Actuator 1</span>
            <span>Actuator 2</span>
          </div>
          {allDeviceControls.map(d => (
            <div key={d.id} className={`${styles.overviewRow} ${styles.overviewRowWide}`}>
              <span className={styles.overviewDevice}>{t('dashboard.device')} {d.id}</span>
              <div className={styles.overviewSubGroup}>
                <Badge label={`Fan: ${d.act1_fan ? t('controls.on') : t('controls.off')}`} color={d.act1_fan ? 'green' : 'muted'} />
                <Badge label={`Light: ${d.act1_light ? t('controls.on') : t('controls.off')}`} color={d.act1_light ? 'green' : 'muted'} />
                <Badge label={`Heater: ${d.act1_heater ? t('controls.on') : t('controls.off')}`} color={d.act1_heater ? 'red' : 'muted'} />
              </div>
              <div className={styles.overviewSubGroup}>
                <Badge label={`Fan: ${d.act2_fan ? t('controls.on') : t('controls.off')}`} color={d.act2_fan ? 'green' : 'muted'} />
                <Badge label={`Light: ${d.act2_light ? t('controls.on') : t('controls.off')}`} color={d.act2_light ? 'green' : 'muted'} />
                <Badge label={`Heater: ${d.act2_heater ? t('controls.on') : t('controls.off')}`} color={d.act2_heater ? 'red' : 'muted'} />
              </div>
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
                  <div className={styles.ruleAction}>{t('controls.then')} {formatAction(r.action)}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{r.name}</div>
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
                <input required type="text" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem' }} placeholder="e.g. temperature > 30 AND humidity < 50" />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Priority (1 is highest)</label>
                <input required type="number" min="1" max="100" value={editPriority} onChange={e => setEditPriority(Number(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem' }} />
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
