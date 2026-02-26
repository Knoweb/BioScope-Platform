import { useState, useEffect, useMemo } from 'react'
import { useControls, useDevices } from '../hooks'
import { fmtDateTime } from '../utils'
import { DeviceTabs, SectionHeader, Card, Toggle, Badge, PageLoader, EmptyState } from '../components/UI'
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

const AUTOMATION_RULES = [
  { condition: 'Temperature > 30°C', action: 'Turn Heater OFF, Turn Fan ON', color: 'var(--red)' },
  { condition: 'Temperature < 25°C', action: 'Turn Heater ON', color: 'var(--amber)' },
  { condition: 'Temperature < 20°C', action: 'Turn Heater ON, Alert admin', color: 'var(--red)' },
  { condition: 'Humidity > 75%', action: 'Alert admin', color: 'var(--cyan)' },
  { condition: 'Light < 200 lux', action: 'Turn Light ON', color: 'var(--amber)' },
]

export default function Controls({ addToast }) {
  const { devices, loading: devLoading } = useDevices()
  const deviceIds = useMemo(() => devices.map(d => d.device_id), [devices])

  const [device, setDevice] = useState('')

  useEffect(() => {
    if (deviceIds.length > 0 && !device) setDevice(deviceIds[0])
  }, [deviceIds, device])

  const { controls, loading, updating, toggle } = useControls()

  const handleToggle = async (field) => {
    const { success, newVal, error } = await toggle(device, field)
    if (success) {
      addToast(`${field.replace('_status', '')} ${newVal ? 'activated' : 'deactivated'} on ${device}`, 'success')
    } else {
      addToast(`Control update failed: ${error}`, 'error')
    }
  }

  const ctrl = controls[device] ?? {}
  const allDeviceControls = devices.map(d => ({
    id: d.device_id,
    name: d.name,
    ...controls[d.device_id]
  }))

  if (devLoading) {
    return <div className={styles.page}><PageLoader /></div>
  }

  if (!devLoading && deviceIds.length === 0) {
    return (
      <div className={styles.page}>
        <EmptyState icon="⚙️" title="No devices found" sub="Controls require an active device" />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <DeviceTabs devices={deviceIds} active={device} onChange={setDevice} />

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
              <span className={styles.overviewDevice}>{d.name || `DEVICE ${d.id}`}</span>
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
      <SectionHeader title="Automation Rules" right={<Badge label="READ-ONLY" color="muted" />} />
      <Card className="fade-up d5">
        <div className={styles.ruleList}>
          {AUTOMATION_RULES.map((r, i) => (
            <div key={i} className={styles.ruleRow}>
              <div className={styles.ruleAccent} style={{ background: r.color }} />
              <div className={styles.ruleContent}>
                <div className={styles.ruleCondition}>IF {r.condition}</div>
                <div className={styles.ruleAction}>THEN {r.action}</div>
              </div>
              <Badge label="ACTIVE" color="green" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
