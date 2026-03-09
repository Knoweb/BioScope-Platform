import { useState } from 'react'
import { fmtDateTime } from '../utils'
import { Card, SectionHeader, Badge, Btn, EmptyState, PageLoader } from '../components/UI'
import { useDevices } from '../hooks'
import { useTranslation } from 'react-i18next'
import styles from './Devices.module.css'

export default function Devices({ addToast }) {
  const { t } = useTranslation()
  const { devices, loading: devLoading } = useDevices()
  const [showAdd, setShowAdd] = useState(false)
  const [addType, setAddType] = useState('parent')
  const [newId, setNewId] = useState('')

  const parents = devices.filter(d => d.type === 'parent')
  const children = devices.filter(d => d.type === 'child')

  const handleAdd = () => {
    if (!newId.trim()) { addToast('Device ID cannot be empty', 'warning'); return }
    addToast(`Registration pending for ${addType === 'parent' ? 'Parent Unit' : 'Child Unit'}: ${newId}`, 'info')
    setNewId('')
    setShowAdd(false)
  }

  if (devLoading) return <div className={styles.page}><PageLoader /></div>

  return (
    <div className={styles.page}>
      <div className={styles.pageActions}>
        <Btn onClick={() => setShowAdd(v => !v)} icon="+" variant="primary">Register Device</Btn>
      </div>

      {showAdd && (
        <Card className={`${styles.addCard} fade-up`}>
          <SectionHeader title="Register New Device" />
          <div className={styles.addForm}>
            <div style={{ marginBottom: 16 }}>
              <label>
                <input type="radio" checked={addType === 'parent'} onChange={() => setAddType('parent')} /> Parent Unit
              </label>
              <label style={{ marginLeft: 16 }}>
                <input type="radio" checked={addType === 'child'} onChange={() => setAddType('child')} /> Child Unit
              </label>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Device Unit ID</label>
              <input
                className={styles.input}
                placeholder={addType === 'parent' ? "e.g. P1" : "e.g. C1"}
                value={newId}
                onChange={e => setNewId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>

            <div className={styles.addActions}>
              <Btn onClick={handleAdd} variant="primary">Register {addType === 'parent' ? 'Parent' : 'Child'}</Btn>
              <Btn onClick={() => setShowAdd(false)} variant="secondary">Cancel</Btn>
            </div>
          </div>
          <div className={styles.addHint}>💡 Enter ID to register device to the backend API.</div>
        </Card>
      )}

      {/* Parent Units Section */}
      <SectionHeader title={`Parent Units (${parents.length})`} />
      <div className={styles.devGrid}>
        {parents.length === 0 ? <EmptyState title="No Parent Units found" /> : parents.map((d, i) => (
          <Card key={d.device_id} className={`${styles.devCard} fade-up d${i + 1}`}>
            <div className={styles.devHeader}>
              <div className={styles.devId}>{d.device_id}</div>
              <Badge label={d.status === 'offline' ? 'OFFLINE' : 'ONLINE'} color={d.status === 'offline' ? 'red' : 'green'} />
            </div>
            <div className={styles.devName}>{d.name}</div>

            <div className={styles.divider} />

            <div className={styles.infoRows}>
              <InfoRow label="LOCATION" value={d.location || 'N/A'} />
              <InfoRow label="GATEWAY" value={d.gateway || 'N/A'} />
              <InfoRow label="FIRMWARE" value={d.firmware || 'N/A'} />
              <InfoRow label="IP TYPE" value={d.ip_type || 'N/A'} />
              <InfoRow label="ADDED" value={fmtDateTime(d.created_at)} />
            </div>

            <div className={styles.devActions} style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <Btn onClick={() => addToast(`Pinging ${d.device_id}...`, 'info')} variant="secondary">Ping</Btn>
              <Btn onClick={() => addToast(`Remove ${d.device_id}? (disabled in demo)`, 'error')} variant="danger">Remove</Btn>
            </div>
          </Card>
        ))}
      </div>

      {/* Child Units Section */}
      <SectionHeader title={`Child Units (${children.length})`} style={{ marginTop: 32 }} />
      <div className={styles.devGrid}>
        {children.length === 0 ? <EmptyState title="No Child Units found" /> : children.map((d, i) => (
          <Card key={d.device_id} className={`${styles.devCard} fade-up d${i + 1}`}>
            <div className={styles.devHeader}>
              <div className={styles.devId}>{d.device_id}</div>
              <Badge label={d.status === 'offline' ? 'OFFLINE' : 'ONLINE'} color={d.status === 'offline' ? 'red' : 'green'} />
            </div>
            <div className={styles.devName}>{d.name}</div>

            <div className={styles.divider} />

            <div className={styles.infoRows}>
              <InfoRow label="PARENT UNIT" value={d.parent_unit_id} />
              <InfoRow label="PRIORITY" value={d.priority || 'N/A'} />
              <InfoRow label="LOCATION" value={d.location || 'N/A'} />
              <InfoRow label="ADDED" value={fmtDateTime(d.created_at)} />
            </div>

            <div className={styles.devActions} style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <Btn onClick={() => addToast(`Pinging ${d.device_id}...`, 'info')} variant="secondary">Ping</Btn>
              <Btn onClick={() => addToast(`Remove ${d.device_id}? (disabled in demo)`, 'error')} variant="danger">Remove</Btn>
            </div>
          </Card>
        ))}
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
