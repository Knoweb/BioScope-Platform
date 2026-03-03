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
  const [newDev, setNewDev] = useState({ id: '', name: '', type: t('devices.standardMonitor'), location: '' })

  const handleAdd = async () => {
    if (!newDev.id.trim()) { addToast(t('devices.idRequired'), 'warning'); return }
    if (!newDev.name.trim()) { addToast(t('devices.nameRequired'), 'warning'); return }
    if (!newDev.location.trim()) { addToast(t('devices.locationRequired'), 'warning'); return }
    addToast(t('devices.registering', { id: newDev.id }), 'info')

    try {
      const res = await api.post('/devices', {
        device_id: newDev.id,
        name: newDev.name,
        type: newDev.type,
        location: newDev.location,
        status: 'offline'
      })
      if (res.error) throw res.error
      addToast(t('devices.registerSuccess', { id: newDev.id }), 'success')
      setNewDev({ id: '', name: '', type: t('devices.standardMonitor'), location: '' })
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
        <Card className={`${styles.addCard} fade-up`}>
          <SectionHeader title={t('devices.registerNewTitle')} />
          <div className={styles.addForm}>
            <div className={styles.inputGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
              <div>
                <label className={styles.inputLabel}>{t('devices.deviceIdLabel')}</label>
                <input
                  className={styles.input}
                  placeholder={t('devices.deviceIdPlaceholder')}
                  value={newDev.id}
                  onChange={e => setNewDev({ ...newDev, id: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className={styles.inputLabel}>{t('devices.deviceNameLabel')}</label>
                <input
                  className={styles.input}
                  placeholder={t('devices.deviceNamePlaceholder')}
                  value={newDev.name}
                  onChange={e => setNewDev({ ...newDev, name: e.target.value })}
                />
              </div>
              <div>
                <label className={styles.inputLabel}>{t('devices.locationLabel')}</label>
                <input
                  className={styles.input}
                  placeholder={t('devices.locationPlaceholder')}
                  value={newDev.location}
                  onChange={e => setNewDev({ ...newDev, location: e.target.value })}
                />
              </div>
              <div>
                <label className={styles.inputLabel}>{t('devices.deviceTypeLabel')}</label>
                <input
                  className={styles.input}
                  placeholder={t('devices.standardMonitor')}
                  value={newDev.type}
                  onChange={e => setNewDev({ ...newDev, type: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </div>
            </div>
            <div className={styles.addActions} style={{ marginTop: '1rem' }}>
              <Btn onClick={handleAdd} variant="primary">{t('devices.register')}</Btn>
              <Btn onClick={() => setShowAdd(false)} variant="secondary">{t('devices.cancel')}</Btn>
            </div>
          </div>
          <div className={styles.addHint}>{t('devices.registerHint')}</div>
        </Card>
      )}

      <SectionHeader title={t('devices.registeredDevices', { count: devices?.length || 0 })} />

      {loading ? (
        <PageLoader />
      ) : devices.length === 0 ? (
        <EmptyState icon="🔌" title={t('devices.noDevicesTitle')} sub={t('devices.noDevicesSub')} />
      ) : (
        <div className={styles.devGrid}>
          {devices.map((d, i) => {
            return (
              <Card key={d.device_id} className={`${styles.devCard} fade-up d${i + 1}`}>
                <div className={styles.devHeader}>
                  <div className={styles.devId}>{d.device_id}</div>
                  <Badge label={d.status === 'offline' ? t('devices.offline') : t('devices.online')} color={d.status === 'offline' ? 'red' : 'green'} />
                </div>
                <div className={styles.devName}>{d.name || t('devices.deviceDefaultName', { id: d.device_id })}</div>
                <div className={styles.devType}>{d.type || t('devices.standardMonitor')}</div>

                <div className={styles.divider} />

                <div className={styles.infoRows}>
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
                    <Badge label={t('devices.actuators')} color="amber" />
                  </div>
                </div>

                <div className={styles.devActions}>
                  <Btn onClick={() => addToast(t('devices.pinging', { id: d.device_id }), 'info')} variant="secondary">{t('devices.ping')}</Btn>
                  <Btn onClick={() => addToast(t('devices.restartScheduled', { id: d.device_id }), 'warning')} variant="secondary">{t('devices.restart')}</Btn>
                  <Btn onClick={() => handleRemove(d.device_id)} variant="danger">{t('devices.remove')}</Btn>
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
