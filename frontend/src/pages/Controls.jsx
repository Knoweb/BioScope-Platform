import { useState, useMemo } from 'react'
import { useControls, useDevices, useAutomationRules } from '../hooks'
import { DEVICES, fmtDateTime } from '../utils'
import { DeviceTabs, SectionHeader, Card, Toggle, Badge, PageLoader, EmptyState, Btn } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import styles from './Controls.module.css'

const ACTUATORS = [
  {
    key: 'fan_status',
    label: 'Fan',
    icon: '🌀',
    desc: 'Ventilation control for air circulation',
    auto: 'Auto-activates when temp > 30°C',
    color: 'var(--cyan)',
  },
  {
    key: 'heater_status',
    label: 'Heater',
    icon: '🔥',
    desc: 'Heating element for temperature regulation',
    auto: 'Auto-activates when temp < 25°C',
    color: 'var(--red)',
  },
  {
    key: 'light_status',
    label: 'Light',
    icon: '💡',
    desc: 'Lighting control for the enclosure',
    auto: 'Auto-activates when light < 200 lux',
    color: 'var(--amber)',
  },
]

export default function Controls({ addToast }) {
  const { user } = useAuth()
  // Determine if the user has permission to edit automation rules
  const userRole = user?.user_metadata?.role || 'viewer'
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner' || userRole === 'operator'

  const [device, setDevice] = useState('C1')
  const { controls, loading, updating, toggle } = useControls()
  const { rules: automationRules, loading: rulesLoading, createRule, updateRule, deleteRule } = useAutomationRules(device)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formData, setFormData] = useState({ name: '', trigger_condition: '', action: '', is_active: true })
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

  const openModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule)
      setFormData({ name: rule.name, trigger_condition: rule.trigger_condition, action: rule.action, is_active: rule.is_active })
    } else {
      setEditingRule(null)
      setFormData({ name: '', trigger_condition: '', action: '', is_active: true })
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
        await updateRule(editingRule.rule_id, formData)
        addToast('Automation rule updated successfully', 'success')
      } else {
        await createRule(formData)
        addToast('Automation rule created successfully', 'success')
      }
      closeRuleModal()
    } catch (err) {
      addToast(`Failed to save rule: ${err.message}`, 'error')
    } finally {
      setSavingRule(false)
    }
  }

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this automation rule?')) return
    try {
      await deleteRule(id)
      addToast('Automation rule deleted', 'success')
    } catch (err) {
      addToast(`Failed to delete rule: ${err.message}`, 'error')
    }
  }

  const ctrl = controls[device] ?? {}
  const allDeviceControls = DEVICES.map(d => ({ id: d, ...controls[d] }))

  return (
    <div className={styles.page}>
      <DeviceTabs devices={DEVICES} active={device} onChange={setDevice} />

      {/* Actuator controls */}
      <SectionHeader title="Actuator Controls" right={
        <Badge label={loading ? 'LOADING...' : 'LIVE'} color={loading ? 'muted' : 'green'} />
      } />
      <div className={styles.controlGrid}>
        {ACTUATORS.map((a, i) => {
          const isOn = !!ctrl[a.key]
          const isBusy = updating === `${device}.${a.key}`
          return (
            <Card key={a.key} className={`${styles.controlCard} fade-up d${i + 1}`} style={{ '--a-color': a.color }}>
              <div className={styles.cardHeader}>
                <span className={styles.actIcon} style={{ filter: isOn ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                <Badge label={isOn ? 'ACTIVE' : 'INACTIVE'} color={isOn ? 'green' : 'muted'} />
              </div>
              <div className={styles.actName}>{a.label}</div>
              <div className={styles.actDesc}>{a.desc}</div>
              <div className={styles.actAuto}>{a.auto}</div>
              <div className={styles.controlRow}>
                <Toggle on={isOn} loading={isBusy} onChange={() => handleToggle(a.key)} label={isOn ? 'ON' : 'OFF'} />
              </div>
              <div className={styles.statusBar} style={{ background: isOn ? a.color : 'var(--border-subtle)' }} />
            </Card>
          )
        })}
      </div>

      {/* All-device overview */}
      <SectionHeader title="All Devices Overview" />
      <Card className="fade-up d4">
        <div className={styles.overviewTable}>
          <div className={styles.overviewHeader}>
            <span>DEVICE</span>
            <span>🌀 FAN</span>
            <span>🔥 HEATER</span>
            <span>💡 LIGHT</span>
          </div>
          {allDeviceControls.map(d => (
            <div key={d.id} className={styles.overviewRow}>
              <span className={styles.overviewDevice}>DEVICE {d.id}</span>
              {['fan_status', 'heater_status', 'light_status'].map(k => (
                <span key={k}>
                  <Badge label={d[k] ? 'ON' : 'OFF'} color={d[k] ? 'green' : 'muted'} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Automation rules */}
      <SectionHeader
        title={`Automation Rules for ${device}`}
        right={
          isAdminOrOwner ? (
            <Btn variant="primary" onClick={() => openModal()} icon="＋">Add Rule</Btn>
          ) : (
            <Badge label="READ-ONLY" color="muted" />
          )
        }
      />

      <Card className="fade-up d5">
        {rulesLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading rules...</div>
        ) : automationRules.length === 0 ? (
          <EmptyState icon="⚙️" title="No automation rules" sub="Create a rule to automate hardware controls" />
        ) : (
          <div className={styles.ruleList}>
            {automationRules.map((r) => (
              <div key={r.rule_id} className={styles.ruleRow}>
                <div className={styles.ruleAccent} style={{ background: r.is_active ? 'var(--cyan)' : 'var(--border-subtle)' }} />
                <div className={styles.ruleContent}>
                  <div className={styles.ruleCondition}>IF {r.trigger_condition}</div>
                  <div className={styles.ruleAction}>THEN {r.action}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Name: {r.name}</div>
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
                      title={r.is_active ? "Click to Disable" : "Click to Enable"}
                    >
                      <Badge label={r.is_active ? 'ACTIVE' : 'DISABLED'} color={r.is_active ? 'green' : 'muted'} />
                    </button>
                  ) : (
                    <Badge label={r.is_active ? 'ACTIVE' : 'DISABLED'} color={r.is_active ? 'green' : 'muted'} />
                  )}

                  {isAdminOrOwner && (
                    <>
                      <Btn variant="secondary" onClick={() => openModal(r)}>Edit</Btn>
                      <Btn variant="danger" onClick={() => handleDeleteRule(r.rule_id)}>Delete</Btn>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Rule Modal */}
      {modalOpen && isAdminOrOwner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{editingRule ? 'Edit Rule' : 'New Automation Rule'}</h2>
            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rule Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)' }} placeholder="e.g. High Temp Cooling" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trigger Condition</label>
                <input required type="text" value={formData.trigger_condition} onChange={e => setFormData({ ...formData, trigger_condition: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)' }} placeholder="e.g. temperature > 30" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Action Payload</label>
                <input required type="text" value={formData.action} onChange={e => setFormData({ ...formData, action: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)' }} placeholder="e.g. turn_fan_on" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                <label htmlFor="isActive" style={{ color: 'var(--text-main)' }}>Rule is active</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <Btn variant="secondary" onClick={closeRuleModal} type="button">Cancel</Btn>
                <Btn variant="primary" loading={savingRule} type="submit">{editingRule ? 'Update' : 'Create'}</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
