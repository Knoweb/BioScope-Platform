import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Toast from './components/Toast'
import { useToast } from './hooks'
import { api } from './lib/api'

import Dashboard from './pages/Dashboard'
import Sensors from './pages/Sensors'
import Controls from './pages/Controls'
import History from './pages/History'
import Reports from './pages/Reports'
import Devices from './pages/Devices'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Landing from './pages/Landing'

import styles from './App.module.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '14px'
      }}>
        Loading...
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { toasts, add: addToast } = useToast()
  const { user, login } = useAuth()
  const [lastUpdate, setLastUpdate] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchLatestReadingTime = useCallback(async () => {
    try {
      const devicesRes = await api.get('/devices')
      const devices = devicesRes?.data || []
      if (!devices.length) return

      const parent = devices.find(d => d.type === 'parent')
      const target = parent || devices[0]
      if (!target?.device_id) return

      const isParent = target.type === 'parent' || String(target.device_id).startsWith('P')
      const typeParam = isParent ? `parent_id=${target.device_id}` : `device_id=${target.device_id}`
      const latestRes = await api.get(`/readings/latest?${typeParam}`)
      const recordedAt = latestRes?.data?.recorded_at
      if (recordedAt) {
        setLastUpdate(recordedAt)
      }
    } catch {
      // Keep previous timestamp when fetch fails
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    await fetchLatestReadingTime()
    addToast('Data refreshed', 'success')
    // Force re-renders in child components by dispatching a custom event
    window.dispatchEvent(new CustomEvent('bioscope:refresh'))
  }, [addToast, fetchLatestReadingTime])

  useEffect(() => {
    if (!user) return
    fetchLatestReadingTime()
    const timer = setInterval(fetchLatestReadingTime, 15000)
    return () => clearInterval(timer)
  }, [user, fetchLatestReadingTime])

  const passProps = { addToast }

  // Public routes (login/signup)
  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login onLogin={login} addToast={addToast} />} />
          <Route path="/signup" element={<Signup addToast={addToast} />} />
          <Route path="/forgot-password" element={<ForgotPassword addToast={addToast} />} />
          <Route path="/reset-password" element={<ResetPassword addToast={addToast} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toast toasts={toasts} />
      </>
    )
  }

  // Protected routes (main app)
  return (
    <div className={styles.layout}>
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className={styles.content}>
        <Topbar
          onRefresh={handleRefresh}
          lastUpdate={lastUpdate}
          onToggleMenu={() => setMobileMenuOpen(p => !p)}
        />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard {...passProps} />
              </ProtectedRoute>
            } />
            <Route path="/sensors" element={
              <ProtectedRoute>
                <Sensors {...passProps} />
              </ProtectedRoute>
            } />
            <Route path="/controls" element={
              <ProtectedRoute>
                <Controls {...passProps} />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <History {...passProps} />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports {...passProps} />
              </ProtectedRoute>
            } />
            <Route path="/devices" element={
              <ProtectedRoute>
                <Devices {...passProps} />
              </ProtectedRoute>
            } />
            <Route path="/alerts" element={
              <ProtectedRoute>
                <Alerts {...passProps} />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings {...passProps} />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toast toasts={toasts} />
    </div>
  )
}
