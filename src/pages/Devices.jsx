import { useState } from 'react'
import { DEVICES, fmtDateTime } from '../utils'
import { Card, SectionHeader, Badge, Btn } from '../components/UI'
import styles from './Devices.module.css'

const DEVICE_INFO = {
  C1: {
    name:       'Enclosure Monitor Alpha',
    type:       'Environmental Sensor + Actuator Hub',
    sensors:    ['Temperature (NTC)', 'Humidity (DHT22)', 'Light (LDR)'],
    actuators:  ['Fan (PWM)', 'Heater (Relay)', 'LED Light (PWM)'],
    gateway:    'WiFi Gateway v2.1',
    location:   'Zone A — Rack 1',
    added:      '2025-01-10T09:00:00Z',
    firmware:   '2.4.1',
    ip:         '192.168.1.101',
  },
  C2: {
    name:       'Enclosure Monitor Beta',
    type:       'Environmental Sensor + Actuator Hub',
    sensors:    ['Temperature (NTC)', 'Humidity (DHT22)', 'Light (LDR)'],
    actuators:  ['Fan (PWM)', 'Heater (Relay)', 'LED Light (PWM)'],
    gateway:    'WiFi Gateway v2.1',
    location:   'Zone A — Rack 2',
    added:      '2025-01-15T14:30:00Z',
    firmware:   '2.4.1',
    ip:         '192.168.1.102',
  }
}

export default function Devices({ addToast }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newId, setNewId] = useState('')

  const handleAdd = () => {
    if (!newId.trim()) { addToast('Device ID cannot be empty', 'warning'); return }
    addToast(`Device registration pending for: ${newId}`, 'info')
    setNewId('')
    setShowAdd(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageActions}>
        <Btn onClick={() => setShowAdd(v => !v)} icon="+" variant="primary">Register Device</Btn>
      </div>

      {showAdd && (
        <Card className={`${styles.addCard} fade-up`}>
          <SectionHeader title="Register New Device" />
          <div className={styles.addForm}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Device ID</label>
              <input
                className={styles.input}
                placeholder="e.g. C3"
                value={newId}
                onChange={e => setNewId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className={styles.addActions}>
              <Btn onClick={handleAdd} variant="primary">Register</Btn>
              <Btn onClick={() => setShowAdd(false)} variant="secondary">Cancel</Btn>
            </div>
          </div>
          <div className={styles.addHint}>💡 Scan the QR code on your device to get its ID, or enter it manually.</div>
        </Card>
      )}

      <SectionHeader title={`Registered Devices (${DEVICES.length})`} />
      <div className={styles.devGrid}>
        {DEVICES.map((d, i) => {
          const info = DEVICE_INFO[d]
          return (
            <Card key={d} className={`${styles.devCard} fade-up d${i+1}`}>
              <div className={styles.devHeader}>
                <div className={styles.devId}>{d}</div>
                <Badge label="ONLINE" color="green" />
              </div>
              <div className={styles.devName}>{info.name}</div>
              <div className={styles.devType}>{info.type}</div>

              <div className={styles.divider} />

              <div className={styles.infoRows}>
                <InfoRow label="LOCATION"  value={info.location} />
                <InfoRow label="GATEWAY"   value={info.gateway} />
                <InfoRow label="FIRMWARE"  value={info.firmware} />
                <InfoRow label="IP"        value={info.ip} />
                <InfoRow label="ADDED"     value={fmtDateTime(info.added)} />
              </div>

              <div className={styles.divider} />

              <div className={styles.componentSection}>
                <div className={styles.compLabel}>SENSORS</div>
                <div className={styles.compList}>
                  {info.sensors.map(s => <Badge key={s} label={s} color="cyan" />)}
                </div>
              </div>
              <div className={styles.componentSection}>
                <div className={styles.compLabel}>ACTUATORS</div>
                <div className={styles.compList}>
                  {info.actuators.map(a => <Badge key={a} label={a} color="amber" />)}
                </div>
              </div>

              <div className={styles.devActions}>
                <Btn onClick={() => addToast(`Pinging ${d}...`, 'info')} variant="secondary">Ping</Btn>
                <Btn onClick={() => addToast(`${d} restart scheduled`, 'warning')} variant="secondary">Restart</Btn>
                <Btn onClick={() => addToast(`Remove ${d}? (disabled in demo)`, 'error')} variant="danger">Remove</Btn>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', gap: 12 }}>
      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1.5px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
