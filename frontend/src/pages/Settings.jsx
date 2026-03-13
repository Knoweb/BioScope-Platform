import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Card, SectionHeader, Toggle, Btn, Badge } from '../components/UI'
import { useTranslation } from 'react-i18next'
import { useDevices } from '../hooks'
import { readingsAPI } from '../api'
import { downloadJSON } from '../utils'
import styles from './Settings.module.css'

export default function Settings({ addToast }) {
  const { user, logout, updateProfile, deleteAccount } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [settings, setSettings] = useState(() => {
    return user?.preferences || {
      autoRefresh: true,
      refreshInterval: 15,
      emailAlerts: true,
      pushAlerts: true,
      smsAlerts: false,
      tempUnit: 'C',
      language: 'en',
      dataRetention: 30,
    }
  })

  // Update UI if preferences load downstream
  useEffect(() => {
    if (user?.preferences) {
      setSettings(user.preferences)
    }
  }, [user?.preferences])

  const [saving, setSaving] = useState(false)

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  const save = async () => {
    if (!updateProfile) {
      addToast(t('settings.savedLocal', 'Settings saved locally (read-only mode)'), 'success')
      return
    }

    setSaving(true)
    try {
      const { error } = await updateProfile({ preferences: settings })
      if (error) throw error
      addToast(t('settings.savedSuccess', 'Settings saved successfully'), 'success')
    } catch (e) {
      addToast(t('settings.saveFailed', { reason: e.message || e, defaultValue: `Failed to save settings: ${e.message || e}` }), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    addToast(t('settings.loggedOut', 'Logged out successfully'), 'success')
    navigate('/login')
  }

  const { devices } = useDevices()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleExportAll = async () => {
    setExporting(true)
    addToast(t('settings.exportInitiated', 'Preparing export...'), 'info')
    try {
      const allData = {}
      for (const d of devices) {
        const isParent = String(d.device_id).startsWith('P')
        const { data: rows, error } = await readingsAPI.getReadings(d.device_id, isParent, { limit: 50000 })
        if (!error && rows?.length) allData[d.device_id] = rows
      }
      if (Object.keys(allData).length === 0) {
        addToast(t('settings.exportNoData', 'No data found to export'), 'warning')
        return
      }
      downloadJSON({ exported_at: new Date().toISOString(), devices: allData }, `bioscope_all_data_${Date.now()}.json`)
      const total = Object.values(allData).reduce((s, r) => s + r.length, 0)
      addToast(t('settings.exportSuccess', { total, defaultValue: `Exported ${total} records` }), 'success')
    } catch (e) {
      addToast(t('settings.exportFailed', { error: e.message, defaultValue: `Export failed: ${e.message}` }), 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setConfirmDelete(false)
    setDeleting(true)
    const { error } = await deleteAccount()
    setDeleting(false)
    if (error) {
      addToast(t('settings.deleteFailed', { reason: error.message || error, defaultValue: `Delete failed: ${error.message || error}` }), 'error')
    } else {
      addToast(t('settings.deleteSuccess', 'Account deleted successfully'), 'success')
      navigate('/login')
    }
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    addToast(t('settings.themeEnabled', { theme: newTheme === 'dark' ? t('settings.darkMode', 'Dark Mode') : t('settings.lightMode', 'Light Mode'), defaultValue: `${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled` }), 'success')
  }

  return (
    <div className={styles.page}>
      {/* General */}
      <SectionHeader title={t('settings.general')} />
      <Card className="fade-up d1">
        <div className={styles.settingRows}>
          <SettingRow label={t('settings.darkMode')} desc={t('settings.darkModeDesc')}>
            <Toggle on={theme === 'dark'} onChange={handleThemeToggle} />
          </SettingRow>
          <SettingRow label={t('settings.autoRefresh')} desc={t('settings.autoRefreshDesc')}>
            <Toggle on={settings.autoRefresh} onChange={() => set('autoRefresh', !settings.autoRefresh)} />
          </SettingRow>
          <SettingRow label={t('settings.refreshInterval')} desc={t('settings.refreshIntervalDesc')}>
            <select
              className={styles.select}
              value={settings.refreshInterval}
              onChange={e => set('refreshInterval', Number(e.target.value))}
            >
              <option value={5}>{t('settings.secondsOption', { value: 5, defaultValue: '5 seconds' })}</option>
              <option value={10}>{t('settings.secondsOption', { value: 10, defaultValue: '10 seconds' })}</option>
              <option value={15}>{t('settings.secondsOption', { value: 15, defaultValue: '15 seconds' })}</option>
              <option value={30}>{t('settings.secondsOption', { value: 30, defaultValue: '30 seconds' })}</option>
              <option value={60}>{t('settings.secondsOption', { value: 60, defaultValue: '60 seconds' })}</option>
            </select>
          </SettingRow>
          <SettingRow label={t('settings.temperatureUnit')} desc={t('settings.temperatureUnitDesc')}>
            <div className={styles.unitBtns}>
              <button className={`${styles.unitBtn} ${settings.tempUnit === 'C' ? styles.unitActive : ''}`} onClick={() => set('tempUnit', 'C')}>°C</button>
              <button className={`${styles.unitBtn} ${settings.tempUnit === 'F' ? styles.unitActive : ''}`} onClick={() => set('tempUnit', 'F')}>°F</button>
            </div>
          </SettingRow>
          <SettingRow label={t('settings.language')} desc={t('settings.languageDesc')}>
            <select className={styles.select} value={settings.language} onChange={e => {
              const lang = e.target.value;
              set('language', lang);
              i18n.changeLanguage(lang);
            }}>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </SettingRow>
        </div>
      </Card>

      {/* Notifications */}
      <SectionHeader title={t('settings.notifications')} />
      <Card className="fade-up d2">
        <div className={styles.settingRows}>
          <SettingRow label={t('settings.emailAlerts')} desc={t('settings.emailAlertsDesc')}>
            <Toggle on={settings.emailAlerts} onChange={() => set('emailAlerts', !settings.emailAlerts)} />
          </SettingRow>
          <SettingRow label={t('settings.pushNotifications')} desc={t('settings.pushNotificationsDesc')}>
            <Toggle on={settings.pushAlerts} onChange={() => set('pushAlerts', !settings.pushAlerts)} />
          </SettingRow>
          <SettingRow label={t('settings.smsAlerts')} desc={t('settings.smsAlertsDesc')}>
            <Toggle on={settings.smsAlerts} onChange={() => set('smsAlerts', !settings.smsAlerts)} />
          </SettingRow>
        </div>
      </Card>

      {/* Data */}
      <SectionHeader title={t('settings.dataPrivacy')} />
      <Card className="fade-up d3">
        <div className={styles.settingRows}>
          <SettingRow label={t('settings.dataRetention')} desc={t('settings.dataRetentionDesc')}>
            <select className={styles.select} value={settings.dataRetention} onChange={e => set('dataRetention', Number(e.target.value))}>
              <option value={7}>{t('settings.daysOption', { value: 7, defaultValue: '7 days' })}</option>
              <option value={30}>{t('settings.daysOption', { value: 30, defaultValue: '30 days' })}</option>
              <option value={90}>{t('settings.daysOption', { value: 90, defaultValue: '90 days' })}</option>
              <option value={365}>{t('settings.oneYear', '1 year')}</option>
            </select>
          </SettingRow>
          <SettingRow label={t('settings.exportData')} desc={t('settings.exportDataDesc')}>
            <Btn onClick={handleExportAll} loading={exporting} icon="⬇" variant="secondary">{t('settings.export')}</Btn>
          </SettingRow>
          <SettingRow label={t('settings.deleteAccount')} desc={t('settings.deleteAccountDesc')}>
            <Btn onClick={() => setConfirmDelete(true)} loading={deleting} variant="danger">{t('settings.delete')}</Btn>
          </SettingRow>
        </div>
      </Card>

      {/* Account */}
      <SectionHeader title={t('settings.account')} />
      <Card className="fade-up d4">
        <div className={styles.accountRow}>
          <div className={styles.avatar}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className={styles.accountInfo}>
            <div className={styles.accountName}>{user?.name || t('settings.user', 'User')}</div>
            <div className={styles.accountEmail}>{user?.email || 'user@bioscope.io'}</div>
            <Badge label={t('settings.userBadge', 'USER')} color="green" />
          </div>
        </div>
        <div className={styles.logoutRow}>
          <Btn onClick={handleLogout} variant="secondary" icon="🚪">{t('settings.logout')}</Btn>
        </div>
      </Card>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '32px 28px', maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{t('settings.deleteConfirmTitle', 'Delete Account?')}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>{t('settings.deleteConfirmMsg', 'This will permanently delete your account and all associated data. This action cannot be undone.')}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setConfirmDelete(false)}>{t('settings.deleteConfirmCancel', 'Cancel')}</Btn>
              <Btn variant="danger" onClick={handleDeleteAccount}>{t('settings.deleteConfirmBtn', 'Yes, Delete')}</Btn>
            </div>
          </div>
        </div>
      )}

      <div className={styles.saveRow}>
        <Btn onClick={save} variant="primary" icon="✓" disabled={saving}>
          {saving ? t('settings.saving') : t('settings.saveSettings')}
        </Btn>
      </div>
    </div>
  )
}

function SettingRow({ label, desc, children }) {
  return (
    <div className={styles.settingRow} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 0', borderBottom: '1px solid var(--border-subtle)', gap: 16
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}
