import { useState, useEffect, useCallback, useRef } from 'react'
import { readingsAPI, controlsAPI, alertsAPI, automationAPI } from '../api'
import { api } from '../lib/api'
import { getRealtimeClient } from '../lib/supabase'

// ── useInterval ────────────────────────────────────────────────────────────
export function useInterval(cb, delay) {
  const saved = useRef(cb)
  useEffect(() => { saved.current = cb }, [cb])
  useEffect(() => {
    if (delay == null) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

// ── useToast ───────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const add = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idRef.current
    setToasts(p => [...p, { id, message, type, dying: false }])
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, dying: true } : t))
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 400)
    }, duration)
  }, [])

  return { toasts, add }
}

// ── useReadings ────────────────────────────────────────────────────────────
export function useReadings(deviceId, limit = 1, interval = 15000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch_ = useCallback(async () => {
    if (!deviceId) {
      setLoading(false)
      return
    }
    const isParent = String(deviceId).startsWith('P')
    try {
      if (limit === 1) {
        const { data: latest, error: err } = await readingsAPI.getLatestReading(deviceId, isParent)
        if (err) throw err
        setData(latest)
      } else {
        const { data: list, error: err } = await readingsAPI.getReadings(deviceId, isParent, { limit })
        if (err) throw err
        setData(list ?? [])
      }
      setError(null)
    } catch (e) {
      setError(e.message || 'Failed to fetch readings')
    } finally {
      setLoading(false)
    }
  }, [deviceId, limit])

  useEffect(() => { setLoading(true); fetch_() }, [fetch_])
  useInterval(fetch_, interval)

  return { data, loading, error, refetch: fetch_ }
}

// ── useAudit ───────────────────────────────────────────────────────────────
export function useAudit(deviceId, range = 'hour') {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch_ = useCallback(async () => {
    if (!deviceId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // Backend doesn't have a dedicated audit API in the frontend exported index yet
      // Fetching from `/api/audit`
      const res = await api.get(`/audit?device_id=${deviceId}&range=${range}`)
      setData(res.data ?? [])
      setError(null)
    } catch (e) {
      setError(e.message || 'Failed to fetch audit log')
    } finally {
      setLoading(false)
    }
  }, [deviceId, range])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, loading, error, refetch: fetch_ }
}

// ── Helper: normalize actuator name → key ─────────────────────────────────
export function buildControlKey(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('fan')) return 'fan'
  if (n.includes('light') || n.includes('led')) return 'light'
  if (n.includes('heat')) return 'heater'
  return null
}

// ── useControls ────────────────────────────────────────────────────────────
// State per device: { fan: bool, light: bool, heater: bool }
export function useControls() {
  const [controls, setControls] = useState({})  // { [deviceId]: { fan, light, heater } }
  const [allActuators, setAllActuators] = useState([]) // raw rows (include actuator_slot)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const buildStatusMap = (actuators) => {
    const m = { fan: false, light: false, heater: false }
    // Use OR logic: if ANY actuator of this type is ON, the key is true.
    // Prevents "Actuator 2 Heater OFF" overwriting "Actuator 1 Heater ON".
    actuators.forEach(a => { const k = buildControlKey(a.name); if (k && a.status) m[k] = true })
    return m
  }

  const fetch_ = useCallback(async () => {
    try {
      const [devRes, actRes] = await Promise.all([
        api.get('/devices'),
        api.get('/actuators')
      ])
      const devices = devRes.data || []
      const actuators = actRes.data || []
      setAllActuators(actuators)

      const map = {}
      devices.forEach(d => { map[d.device_id] = { fan: false, light: false, heater: false } })
      const byDevice = {}
      actuators.forEach(a => { if (!byDevice[a.device_id]) byDevice[a.device_id] = []; byDevice[a.device_id].push(a) })
      for (const [devId, acts] of Object.entries(byDevice)) { map[devId] = buildStatusMap(acts) }
      setControls(map)
    } catch (e) {
      if (e?.code !== 'NETWORK_ERROR' && !/failed to fetch/i.test(String(e?.message || ''))) {
        console.error(e)
      }
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch_()
    const realtime = getRealtimeClient()
    const channel = realtime
      .channel('public:actuators')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'actuators' }, (payload) => {
        const act = payload.new
        setAllActuators(prev => {
          const updated = prev.map(a => a.actuator_id === act.actuator_id ? act : a)
          const deviceActs = updated.filter(a => a.device_id === act.device_id)
          setControls(p => ({ ...p, [act.device_id]: buildStatusMap(deviceActs) }))
          return updated
        })
      })
      .subscribe()
    return () => realtime.removeChannel(channel)
  }, [fetch_])

  useInterval(fetch_, 15000)

  /* Toggle fan | light | heater — enforces Fan↔Heater mutual exclusion */
  const toggle = useCallback(async (deviceId, field) => {
    const currentVal = controls[deviceId]?.[field]
    const turningOn = !currentVal

    if (turningOn) {
      // Mutual exclusion: fan and heater cannot coexist
      const blocker = field === 'fan' ? 'heater' : field === 'heater' ? 'fan' : null
      if (blocker && controls[deviceId]?.[blocker]) {
        return { success: false, error: `Cannot turn ${field} ON — ${blocker} is already ON` }
      }
      // Max 2 actuators active at once (2 physical ports)
      const activeCount = Object.values(controls[deviceId] || {}).filter(Boolean).length
      if (activeCount >= 2) {
        return { success: false, error: 'Maximum 2 actuators can be active at once' }
      }
    }

    setUpdating(`${deviceId}.${field}`)
    try {
      // When turning OFF, prefer the actuator that is actually ON to avoid toggling wrong unit.
      const match = turningOn
        ? allActuators.find(a => a.device_id === deviceId && buildControlKey(a.name) === field)
        : (allActuators.find(a => a.device_id === deviceId && buildControlKey(a.name) === field && a.status === true)
           || allActuators.find(a => a.device_id === deviceId && buildControlKey(a.name) === field))
      if (!match) throw new Error(`Actuator "${field}" not found for device ${deviceId}`)

      const { error } = await controlsAPI.triggerControl({
        device_id: deviceId,
        actuator_id: match.actuator_id,
        action_type: turningOn ? 'activate' : 'deactivate',
        new_status: turningOn
      })
      if (error) throw error

      setControls(p => ({ ...p, [deviceId]: { ...p[deviceId], [field]: turningOn } }))
      return { success: true, newVal: turningOn }
    } catch (e) {
      return { success: false, error: e.message || e }
    } finally {
      setUpdating(null)
    }
  }, [controls, allActuators])

  /* Change physical slot assignment of a device */
  const assignSlot = useCallback(async (deviceId, slotNumber, actuatorKey) => {
    const match = allActuators.find(
      a => a.device_id === deviceId && buildControlKey(a.name) === actuatorKey
    )
    if (!match) return { success: false, error: 'Actuator not found' }
    try {
      await api.patch(`/actuators/${match.actuator_id}`, { actuator_slot: slotNumber })
      setAllActuators(prev =>
        prev.map(a => a.actuator_id === match.actuator_id ? { ...a, actuator_slot: slotNumber } : a)
      )
      return { success: true }
    } catch (e) { return { success: false, error: e.message } }
  }, [allActuators])

  return { controls, allActuators, loading, updating, toggle, assignSlot, refetch: fetch_ }
}

// ── useDevices ─────────────────────────────────────────────────────────────
export function useDevices() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    try {
      const { data } = await api.get('/devices')
      setDevices(data || [])
    } catch (e) { console.error('Failed to fetch devices', e) }
    finally { setLoading(false) }
  }, [])

  const removeDevice = async (id) => {
    try {
      await api.delete(`/devices/${id}`)
      setDevices(prev => prev.filter(d => d.device_id !== id))
      return true
    } catch (e) {
      console.error('Failed to remove device', e)
      throw e
    }
  }

  const updateDeviceMode = async (id, mode) => {
    try {
      const { data } = await api.patch(`/devices/${id}`, { control_mode: mode })
      setDevices(prev => prev.map(d => d.device_id === id ? { ...d, control_mode: mode } : d))
      return { success: true, data }
    } catch (e) {
      console.error('Failed to update device mode', e)
      return { success: false, error: e.message }
    }
  }

  useEffect(() => { fetch_() }, [fetch_])
  return { devices, loading, refetch: fetch_, removeDevice, updateDeviceMode }
}

// ── useDashboardReadings ───────────────────────────────────────────────────
export function useDashboardReadings(deviceIds, interval = 15000) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    if (!deviceIds || !deviceIds.length) {
      setLoading(false)
      return
    }
    try {
      const results = {}
      await Promise.all(deviceIds.map(async id => {
        const isParent = id.startsWith('P')
        const { data: latest } = await readingsAPI.getLatestReading(id, isParent)
        results[id] = latest
      }))
      setData(results)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(deviceIds)])

  useEffect(() => {
    setLoading(true)
    fetch_()

    if (!deviceIds.length) return

    const realtime = getRealtimeClient()
    const channel = realtime
      .channel('public:readings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'readings' }, (payload) => {
        const reading = payload.new
        if (deviceIds.includes(reading.device_id)) {
          setData(prev => ({ ...prev, [reading.device_id]: reading }))
        }
      })
      .subscribe()

    return () => {
      realtime.removeChannel(channel)
    }
  }, [fetch_, JSON.stringify(deviceIds)])

  useInterval(fetch_, interval)

  return { data, loading, refetch: fetch_ }
}

// ── useChartData ───────────────────────────────────────────────────────────
export function useChartData(deviceId, range = 'hour', interval = 30000) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch_ = useCallback(async () => {
    if (!deviceId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const isParent = String(deviceId).startsWith('P')
    try {
      const hours = range === 'hour' ? 1 : range === 'day' ? 24 : 1
      const { data: chartData, error: err } = await readingsAPI.getChartData(deviceId, isParent, hours)
      if (err) throw err
      setData(chartData || [])
      setError(null)
    } catch (e) {
      setError(e.message || 'Failed to fetch chart data')
    } finally {
      setLoading(false)
    }
  }, [deviceId, range])

  useEffect(() => { fetch_() }, [fetch_])
  useInterval(fetch_, interval)

  return { data, loading, error, refetch: fetch_ }
}

// ── useAlerts ──────────────────────────────────────────────────────────────
export function useAlerts(interval = 30000) {
  const [alerts, setAlerts] = useState([])
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    try {
      const [alertsRes, rulesRes] = await Promise.all([
        alertsAPI.getActiveAlerts(),
        alertsAPI.getAlertRules()
      ])
      setAlerts(alertsRes.data || [])
      setRules(rulesRes.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()

    const realtime = getRealtimeClient()
    const channel = realtime
      .channel('public:alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        // Only append unresolved alerts
        if (payload.new.status !== 'resolved') {
          setAlerts(prev => [payload.new, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alerts' }, (payload) => {
        if (payload.new.status === 'resolved') {
          setAlerts(prev => prev.filter(a => a.alert_id !== payload.new.alert_id))
        } else {
          setAlerts(prev => prev.map(a => a.alert_id === payload.new.alert_id ? payload.new : a))
        }
      })
      .subscribe()

    const rulesChannel = realtime
      .channel('public:alert_rules')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alert_rules' }, (payload) => {
        setRules(prev => prev.map(r => r.rule_id === payload.new.rule_id ? payload.new : r))
      })
      .subscribe()

    return () => {
      realtime.removeChannel(channel)
      realtime.removeChannel(rulesChannel)
    }
  }, [fetch_])

  useInterval(fetch_, interval)

  return { alerts, rules, loading, refetch: fetch_ }
}

// ── useAutomationRules ─────────────────────────────────────────────────────
export function useAutomationRules(deviceId) {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    try {
      const { data } = await automationAPI.getRules(deviceId || '')
      setRules(data || [])
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    fetch_()

    const realtime = getRealtimeClient()
    const channel = realtime
      .channel('public:automation_rules')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'automation_rules' }, (payload) => {
        setRules(prev => [payload.new, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'automation_rules' }, (payload) => {
        setRules(prev => prev.map(r => r.rule_id === payload.new.rule_id ? payload.new : r))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'automation_rules' }, (payload) => {
        setRules(prev => prev.filter(r => r.rule_id !== payload.old.rule_id))
      })
      .subscribe()

    return () => realtime.removeChannel(channel)
  }, [fetch_])

  const createRule = async (ruleData) => {
    const { data } = await automationAPI.createRule({ ...ruleData, device_id: deviceId || null })
    if (data) setRules(prev => [data, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    return data
  }

  const updateRule = async (id, updates) => {
    const { data } = await automationAPI.updateRule(id, updates)
    if (data) setRules(prev => prev.map(r => r.rule_id === id ? data : r))
    return data
  }

  const deleteRule = async (id) => {
    await automationAPI.deleteRule(id)
    setRules(prev => prev.filter(r => r.rule_id !== id))
  }

  return { rules, loading, createRule, updateRule, deleteRule, refetch: fetch_ }
}

// ── useControlHistory ──────────────────────────────────────────────────────
export function useControlHistory(deviceId, limit = 50) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    if (!deviceId) return setLoading(false)
    try {
      const { data } = await controlsAPI.getHistory({ device_id: deviceId, limit })
      setHistory(data || [])
    } finally {
      setLoading(false)
    }
  }, [deviceId, limit])

  useEffect(() => {
    fetch_()

    const realtime = getRealtimeClient()
    const channel = realtime
      .channel('public:control_history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'control_history' }, (payload) => {
        if (payload.new.device_id === deviceId) {
          setHistory(prev => [payload.new, ...prev].slice(0, limit))
        }
      })
      .subscribe()

    return () => realtime.removeChannel(channel)
  }, [fetch_, deviceId, limit])

  return { history, loading, refetch: fetch_ }
}
