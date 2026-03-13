import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Card, SectionHeader, Toggle, Btn, Badge } from '../components/UI'
import { useTranslation } from 'react-i18next'
import styles from './Settings.module.css'

export default function Settings({ addToast }) {
  const { user, logout, updateProfile } = useAuth()
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
      addToast('Settings saved locally (read-only mode)', 'success')
      return
    }

    setSaving(true)
    try {
      const { error } = await updateProfile({ preferences: settings })
      if (error) throw error
      addToast('Settings saved successfully', 'success')
    } catch (e) {
      addToast(`Failed to save settings: ${e.message || e}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    addToast('Logged out successfully', 'success')
    navigate('/login')
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    addToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'success')
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
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
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
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </SettingRow>
          <SettingRow label={t('settings.exportData')} desc={t('settings.exportDataDesc')}>
            <Btn onClick={() => addToast('Export initiated', 'info')} icon="⬇" variant="secondary">{t('settings.export')}</Btn>
          </SettingRow>
          <SettingRow label={t('settings.deleteAccount')} desc={t('settings.deleteAccountDesc')}>
            <Btn onClick={() => addToast('This action is disabled in demo', 'error')} variant="danger">{t('settings.delete')}</Btn>
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
            <div className={styles.accountName}>{user?.name || 'User'}</div>
            <div className={styles.accountEmail}>{user?.email || 'user@bioscope.io'}</div>
            <Badge label="USER" color="green" />
          </div>
        </div>
        <div className={styles.logoutRow}>
          <Btn onClick={handleLogout} variant="secondary" icon="🚪">{t('settings.logout')}</Btn>
        </div>
      </Card>

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
