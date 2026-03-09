import { useState, useEffect } from 'react'
import { useControls, useDevices, useAutomationRules } from '../hooks'
import { DeviceTabs, SectionHeader, Card, Toggle, Badge, EmptyState, PageLoader } from '../components/UI'
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
  const { devices, loading: devLoading } = useDevices()
  const parents = devices.filter(d => d.type === 'parent')
  const parentIds = parents.map(p => p.device_id)

  const [device, setDevice] = useState('')

  useEffect(() => {
    if (parentIds.length > 0 && !device) setDevice(parentIds[0])
  }, [parentIds, device])

  const { controls, loading, updating, toggle } = useControls()
  const { rules, loading: rulesLoading } = useAutomationRules(device) // fetch automation rules for current device

  const handleToggle = async (field) => {
    const { success, newVal, error } = await toggle(device, field)
    if (success) {
      addToast(`${field.replace('_status', '')} ${newVal ? 'activated' : 'deactivated'} on ${device}`, 'success')
    } else {
      addToast(`Control update failed: ${error}`, 'error')
    }
  }

  const ctrl = controls[device] ?? {}
  const allDeviceControls = parents.map(d => ({ id: d.device_id, ...controls[d.device_id] }))

  if (devLoading) return <div className={styles.page}><PageLoader /></div>

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
      <SectionHeader title="All Parent Units Overview" />
      <Card className="fade-up d4">
        <div className={styles.overviewTable}>
          <div className={styles.overviewHeader}>
            <span>PARENT UNIT</span>
            <span>🌀 FAN</span>
            <span>🔥 HEATER</span>
            <span>💡 LIGHT</span>
          </div>
          {allDeviceControls.map(d => (
            <div key={d.id} className={styles.overviewRow}>
              <span className={styles.overviewDevice}>{d.id}</span>
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
      <SectionHeader title="Automation Rules" right={<Badge label="LIVE" color="green" />} />
      <Card className="fade-up d5">
        <div className={styles.ruleList}>
          {rulesLoading ? (
            <div style={{ padding: 20 }}>Loading rules...</div>
          ) : rules.length === 0 ? (
            <EmptyState title="No Automation Rules" sub="There are no automation rules linked to this parent unit." />
          ) : rules.map((r, i) => (
            <div key={r.rule_id || i} className={styles.ruleRow}>
              <div className={styles.ruleAccent} style={{ background: r.is_active ? 'var(--green)' : 'var(--muted)' }} />
              <div className={styles.ruleContent}>
                <div className={styles.ruleCondition}>IF {r.condition_type} {r.operator} {r.threshold_value}</div>
                <div className={styles.ruleAction}>THEN {r.action} (Actuator: {r.actuator_id})</div>
              </div>
              <Badge label={r.is_active ? 'ACTIVE' : 'INACTIVE'} color={r.is_active ? 'green' : 'muted'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
