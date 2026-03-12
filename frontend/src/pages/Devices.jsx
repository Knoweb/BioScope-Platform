import { useState } from 'react'
import { useDevices } from '../hooks'
import { api } from '../lib/api'
import { fmtDateTime } from '../utils'
import { Card, SectionHeader, Badge, Btn, PageLoader, EmptyState } from '../components/UI'
import { useTranslation } from 'react-i18next'
import styles from './Devices.module.css'

export default function Devices({ addToast }) {
  const { t } = useTranslation()
  const { devices, loading, refetch, removeDevice } = useDevices()

  const handleRemove = async (deviceId) => {
    if (!window.confirm(t('devices.confirmRemove', { id: deviceId }))) return
    addToast(t('devices.removing', { id: deviceId }), 'info')
    try {
      await removeDevice(deviceId)
      addToast(t('devices.removeSuccess', { id: deviceId }), 'success')
      refetch()
    } catch (e) {
      addToast(t('devices.removeFailed', { error: e.message || e }), 'error')
    }
  }

  const [showAdd, setShowAdd] = useState(false)
  const [addMode, setAddMode] = useState('parent') // 'parent' or 'child'
  const [newDev, setNewDev] = useState({ id: '', name: '', type: t('devices.standardMonitor'), location: '', parent_id: '' })

  // Get parent units for dropdown and display
  const parentUnits = devices?.filter(d => d.type === 'parent') || []

  const handleAdd = async () => {
    if (!newDev.id.trim()) { addToast(t('devices.idRequired'), 'warning'); return }
    if (!newDev.name.trim()) { addToast(t('devices.nameRequired'), 'warning'); return }
    if (!newDev.location.trim()) { addToast(t('devices.locationRequired'), 'warning'); return }
    addToast(t('devices.registering', { id: newDev.id }), 'info')

    try {
      const payload = {
        device_id: newDev.id,
        name: newDev.name,
        type: addMode === 'parent' ? 'parent' : 'child',
        location: newDev.location,
        status: 'offline'
      }
      if (addMode === 'child' && newDev.parent_id) {
        payload.parent_unit_id = newDev.parent_id
      }

      const res = await api.post('/devices', payload)
      if (res.error) throw res.error
      addToast(t('devices.registerSuccess', { id: newDev.id }), 'success')
      setNewDev({ id: '', name: '', type: t('devices.standardMonitor'), location: '', parent_id: '' })
      setShowAdd(false)
      refetch()
    } catch (e) {
      addToast(t('devices.registerFailed', { error: e.message || e }), 'error')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageActions}>
        <Btn onClick={() => setShowAdd(v => !v)} icon="+" variant="primary">{t('devices.registerBtn')}</Btn>
      </div>

      {showAdd && (
        <Card className={`${styles.addCard} fade-up`} style={{ border: '2px dashed var(--border-mid)' }}>
          <SectionHeader title={t('devices.registerNewTitle')} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div
              onClick={() => setAddMode('parent')}
              style={{
                padding: '1rem', border: `2px solid ${addMode === 'parent' ? 'var(--green)' : 'var(--border-subtle)'}`,
                borderRadius: '8px', cursor: 'pointer', background: addMode === 'parent' ? 'var(--bg-main)' : 'var(--bg-card)',
                transition: 'all 0.2s', textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📡 {t('devices.addParentUnit')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Main hub device that actuators connect to.</div>
            </div>

            <div
              onClick={() => setAddMode('child')}
              style={{
                padding: '1rem', border: `2px solid ${addMode === 'child' ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                borderRadius: '8px', cursor: 'pointer', background: addMode === 'child' ? 'var(--bg-main)' : 'var(--bg-card)',
                transition: 'all 0.2s', textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔌 {t('devices.addChildUnit')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sensor modules that report to a Parent Unit.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', width: '100%' }}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>{t('devices.deviceIdLabel')}</label>
                <input
                  className={styles.input}
                  placeholder={addMode === 'parent' ? 'e.g. P1, P2' : 'e.g. C1, C2'}
                  value={newDev.id}
                  onChange={e => setNewDev({ ...newDev, id: e.target.value.toUpperCase() })}
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>{t('devices.deviceNameLabel')}</label>
                <input
                  className={styles.input}
                  placeholder={addMode === 'parent' ? 'Parent Unit 1' : 'Child Unit 1'}
                  value={newDev.name}
                  onChange={e => setNewDev({ ...newDev, name: e.target.value })}
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>{t('devices.locationLabel')}</label>
                <input
                  className={styles.input}
                  placeholder={t('devices.locationPlaceholder')}
                  value={newDev.location}
                  onChange={e => setNewDev({ ...newDev, location: e.target.value })}
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
                />
              </div>
              {addMode === 'child' && (
                <>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>{t('devices.parentDeviceLabel')}</label>
                    <select
                      className={styles.input}
                      value={newDev.parent_id || ''}
                      onChange={e => setNewDev({ ...newDev, parent_id: e.target.value })}
                      style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: '6px', height: '100%' }}
                    >
                      <option value="">{t('devices.selectParent')}</option>
                      {parentUnits.map(pu => (
                        <option key={pu.device_id} value={pu.device_id}>
                          {pu.name || pu.device_id} ({pu.device_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>{t('devices.deviceTypeLabel')}</label>
                    <input
                      className={styles.input}
                      placeholder={t('devices.standardMonitor')}
                      value={newDev.type}
                      onChange={e => setNewDev({ ...newDev, type: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div className={styles.addHint}>{t('devices.registerHint')}</div>
              <div className={styles.addActions}>
                <Btn onClick={() => setShowAdd(false)} variant="secondary">{t('devices.cancel')}</Btn>
                <Btn onClick={handleAdd} variant="primary" icon="✓">{t('devices.register')}</Btn>
              </div>
            </div>
          </div>
        </Card>
      )}

      <SectionHeader title={t('devices.registeredDevices', { count: devices?.length || 0 })} />

      {loading ? (
        <PageLoader />
      ) : devices.length === 0 ? (
        <EmptyState icon="🔌" title={t('devices.noDevicesTitle')} sub={t('devices.noDevicesSub')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

          {/* PARENT UNITS SECTION */}
          {parentUnits.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Parent Units</h3>
              <div className={styles.devGrid}>
                {parentUnits.map((d, i) => (
                  <DeviceCard key={d.device_id} d={d} i={i} t={t} addToast={addToast} handleRemove={handleRemove} />
                ))}
              </div>
            </div>
          )}

          {/* CHILD UNITS SECTION */}
          {devices.filter(d => d.type === 'child').length > 0 && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Child Units</h3>
              <div className={styles.devGrid}>
                {devices.filter(d => d.type === 'child').map((d, i) => (
                  <DeviceCard key={d.device_id} d={d} i={i} t={t} addToast={addToast} handleRemove={handleRemove} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function DeviceCard({ d, i, t, addToast, handleRemove }) {
  return (
    <Card className={`${styles.devCard} fade-up d${i + 1}`}>
      <div className={styles.devHeader}>
        <div className={styles.devId}>{d.device_id}</div>
        <Badge label={d.status === 'offline' ? t('devices.offline') : t('devices.online')} color={d.status === 'offline' ? 'red' : 'green'} />
      </div>
      <div className={styles.devName}>{d.name || t('devices.deviceDefaultName', { id: d.device_id })}</div>
      <div className={styles.devType}>{d.type || t('devices.standardMonitor')}</div>

      <div className={styles.divider} />

      <div className={styles.infoRows}>
        {d.parent_id && (
          <InfoRow label={t('devices.parentDevice')} value={d.parent_id} />
        )}
        <InfoRow label={t('devices.location')} value={d.location || t('devices.unassigned')} />
        <InfoRow label={t('devices.gateway')} value="WiFi Gateway v2.1" />
        <InfoRow label={t('devices.firmware')} value={d.firmware_version || '1.0.0'} />
        <InfoRow label={t('devices.ip')} value="DHCP" />
        <InfoRow label={t('devices.added')} value={d.created_at ? fmtDateTime(d.created_at) : t('devices.na')} />
      </div>

      <div className={styles.divider} />

      <div className={styles.componentSection}>
        <div className={styles.compLabel}>{t('devices.capabilities')}</div>
        <div className={styles.compList}>
          <Badge label={t('devices.sensors')} color="cyan" />
          {d.type === 'parent' && <Badge label={t('devices.actuators')} color="amber" />}
        </div>
      </div>

      <div className={styles.devActions}>
        <Btn onClick={() => addToast(t('devices.pinging', { id: d.device_id }), 'info')} variant="secondary">{t('devices.ping')}</Btn>
        <Btn onClick={() => addToast(t('devices.restartScheduled', { id: d.device_id }), 'warning')} variant="secondary">{t('devices.restart')}</Btn>
        <Btn onClick={() => handleRemove(d.device_id)} variant="danger">{t('devices.remove')}</Btn>
      </div>
    </Card>
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
