import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Card, SectionHeader, Toggle, Btn, Badge } from '../components/UI'
import styles from './Settings.module.css'

export default function Settings({ addToast }) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    autoRefresh:     true,
    refreshInterval: 15,
    emailAlerts:     true,
    pushAlerts:      true,
    smsAlerts:       false,
    tempUnit:        'C',
    language:        'en',
    dataRetention:   30,
  })

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))
  const save = () => addToast('Settings saved successfully', 'success')
  
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
      <SectionHeader title="General" />
      <Card className="fade-up d1">
        <div className={styles.settingRows}>
          <SettingRow label="Dark Mode" desc="Use dark colour scheme (recommended)">
            <Toggle on={theme === 'dark'} onChange={handleThemeToggle} />
          </SettingRow>
          <SettingRow label="Auto Refresh" desc="Automatically refresh sensor data">
            <Toggle on={settings.autoRefresh} onChange={() => set('autoRefresh', !settings.autoRefresh)} />
          </SettingRow>
          <SettingRow label="Refresh Interval" desc="How often to poll new data">
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
          <SettingRow label="Temperature Unit" desc="Display temperature in Celsius or Fahrenheit">
            <div className={styles.unitBtns}>
              <button className={`${styles.unitBtn} ${settings.tempUnit === 'C' ? styles.unitActive : ''}`} onClick={() => set('tempUnit', 'C')}>°C</button>
              <button className={`${styles.unitBtn} ${settings.tempUnit === 'F' ? styles.unitActive : ''}`} onClick={() => set('tempUnit', 'F')}>°F</button>
            </div>
          </SettingRow>
          <SettingRow label="Language" desc="Interface language">
            <select className={styles.select} value={settings.language} onChange={e => set('language', e.target.value)}>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </SettingRow>
        </div>
      </Card>

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <Card className="fade-up d2">
        <div className={styles.settingRows}>
          <SettingRow label="Email Alerts" desc="Receive alerts via email">
            <Toggle on={settings.emailAlerts} onChange={() => set('emailAlerts', !settings.emailAlerts)} />
          </SettingRow>
          <SettingRow label="Push Notifications" desc="Browser push notifications">
            <Toggle on={settings.pushAlerts} onChange={() => set('pushAlerts', !settings.pushAlerts)} />
          </SettingRow>
          <SettingRow label="SMS Alerts" desc="Text message for critical alerts">
            <Toggle on={settings.smsAlerts} onChange={() => set('smsAlerts', !settings.smsAlerts)} />
          </SettingRow>
        </div>
      </Card>

      {/* Data */}
      <SectionHeader title="Data & Privacy" />
      <Card className="fade-up d3">
        <div className={styles.settingRows}>
          <SettingRow label="Data Retention" desc="How long to keep historical data">
            <select className={styles.select} value={settings.dataRetention} onChange={e => set('dataRetention', Number(e.target.value))}>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </SettingRow>
          <SettingRow label="Export All Data" desc="Download your complete dataset">
            <Btn onClick={() => addToast('Export initiated', 'info')} icon="⬇" variant="secondary">Export</Btn>
          </SettingRow>
          <SettingRow label="Delete Account" desc="Permanently remove account and data">
            <Btn onClick={() => addToast('This action is disabled in demo', 'error')} variant="danger">Delete</Btn>
          </SettingRow>
        </div>
      </Card>

      {/* Account */}
      <SectionHeader title="Account" />
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
          <Btn onClick={handleLogout} variant="secondary" icon="🚪">Logout</Btn>
        </div>
      </Card>

      <div className={styles.saveRow}>
        <Btn onClick={save} variant="primary" icon="✓">Save Settings</Btn>
      </div>
    </div>
  )
}

function SettingRow({ label, desc, children }) {
  return (
    <div style={{
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
