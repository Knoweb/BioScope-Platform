import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { useAuth } from './contexts/AuthContext'
import Sidebar  from './components/Sidebar'
import Topbar   from './components/Topbar'
import Toast    from './components/Toast'
import { useToast } from './hooks'

import Dashboard from './pages/Dashboard'
import Sensors   from './pages/Sensors'
import Controls  from './pages/Controls'
import History   from './pages/History'
import Reports   from './pages/Reports'
import Devices   from './pages/Devices'
import Alerts    from './pages/Alerts'
import Settings  from './pages/Settings'
import Login     from './pages/Login'
import Signup    from './pages/Signup'

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
  const { user, login, signup } = useAuth()
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const handleRefresh = useCallback(() => {
    setLastUpdate(Date.now())
    addToast('Data refreshed', 'success')
    // Force re-renders in child components by dispatching a custom event
    window.dispatchEvent(new CustomEvent('bioscope:refresh'))
  }, [addToast])

  const passProps = { addToast }

  // Public routes (login/signup)
  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login onLogin={login} addToast={addToast} />} />
          <Route path="/signup" element={<Signup onSignup={signup} addToast={addToast} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toast toasts={toasts} />
      </>
    )
  }

  // Protected routes (main app)
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <Topbar onRefresh={handleRefresh} lastUpdate={lastUpdate} />
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
