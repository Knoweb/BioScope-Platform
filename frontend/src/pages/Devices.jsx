import { useState } from 'react'
import { useDevices } from '../hooks'
import { api } from '../lib/api'
import { fmtDateTime } from '../utils'
import { Card, SectionHeader, Badge, Btn, PageLoader, EmptyState } from '../components/UI'
import styles from './Devices.module.css'

export default function Devices({ addToast }) {
  const { devices, loading, refetch } = useDevices()

  const [showAdd, setShowAdd] = useState(false)
  const [newId, setNewId] = useState('')

  const handleAdd = async () => {
    if (!newId.trim()) { addToast('Device ID cannot be empty', 'warning'); return }
    addToast(`Registering device: ${newId}...`, 'info')

    try {
      const res = await api.post('/devices', {
        device_id: newId,
        name: `New Device ${newId}`,
        type: 'Standard Monitor',
        status: 'offline'
      })
      if (res.error) throw res.error
      addToast(`Device ${newId} registered successfully`, 'success')
      setNewId('')
      setShowAdd(false)
      refetch()
    } catch (e) {
      addToast(`Failed to register device: ${e.message || e}`, 'error')
    }
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
          <div className={styles.addHint}>💡 Enter a unique device ID to register it to your account.</div>
        </Card>
      )}

      <SectionHeader title={`Registered Devices (${devices?.length || 0})`} />

      {loading ? (
        <PageLoader />
      ) : devices.length === 0 ? (
        <EmptyState icon="🔌" title="No devices registered" sub="Click 'Register Device' to add your first monitor" />
      ) : (
        <div className={styles.devGrid}>
          {devices.map((d, i) => {
            return (
              <Card key={d.device_id} className={`${styles.devCard} fade-up d${i + 1}`}>
                <div className={styles.devHeader}>
                  <div className={styles.devId}>{d.device_id}</div>
                  <Badge label={d.status === 'offline' ? 'OFFLINE' : 'ONLINE'} color={d.status === 'offline' ? 'red' : 'green'} />
                </div>
                <div className={styles.devName}>{d.name || `Device ${d.device_id}`}</div>
                <div className={styles.devType}>{d.type || 'Standard Monitor'}</div>

                <div className={styles.divider} />

                <div className={styles.infoRows}>
                  <InfoRow label="LOCATION" value={d.location || 'Unassigned'} />
                  <InfoRow label="GATEWAY" value="WiFi Gateway v2.1" />
                  <InfoRow label="FIRMWARE" value={d.firmware_version || '1.0.0'} />
                  <InfoRow label="IP" value="DHCP" />
                  <InfoRow label="ADDED" value={d.created_at ? fmtDateTime(d.created_at) : 'N/A'} />
                </div>

                <div className={styles.divider} />

                <div className={styles.componentSection}>
                  <div className={styles.compLabel}>CAPABILITIES</div>
                  <div className={styles.compList}>
                    <Badge label="Sensors" color="cyan" />
                    <Badge label="Actuators" color="amber" />
                  </div>
                </div>

                <div className={styles.devActions}>
                  <Btn onClick={() => addToast(`Pinging ${d.device_id}...`, 'info')} variant="secondary">Ping</Btn>
                  <Btn onClick={() => addToast(`${d.device_id} restart scheduled`, 'warning')} variant="secondary">Restart</Btn>
                  <Btn onClick={() => addToast(`Removing disabled in this view`, 'error')} variant="danger">Remove</Btn>
                </div>
              </Card>
            )
          })}
        </div>
      )}
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
