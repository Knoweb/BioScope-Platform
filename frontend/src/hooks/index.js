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
    try {
      if (limit === 1) {
        const { data: latest, error: err } = await readingsAPI.getLatestReading(deviceId)
        if (err) throw err
        setData(latest)
      } else {
        const { data: list, error: err } = await readingsAPI.getReadings(deviceId, { limit })
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

// ── useControls ────────────────────────────────────────────────────────────
export function useControls() {
  const [controls, setControls] = useState({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const fetch_ = useCallback(async () => {
    try {
      // Need a way to fetch the all-device status
      // We'll use the devices API to fetch devices which includes actuator states
      const res = await api.get('/devices')
      const devices = res.data || []
      const map = {}

      devices.forEach(d => {
        // Construct the expected control state map from actuators view or we can fetch a specific summary
        // The dashboard expects: map[deviceId] = { fan_status: true, heater_status: false } etc
        // Backend `GET /api/devices` just returns devices. But wait, `GET /api/devices/:id/summary` has it.
        // Or if the backend returns actuators in an array, we can map them.
        map[d.device_id] = {
          fan_status: false,
          heater_status: false,
          light_status: false
        }
      })

      // Try to get actual statuses using a parallel fetch if possible, 
      // but to be clean, let's fetch all controls from `/controls` if that returns active state
      const { data: controlList } = await controlsAPI.getHistory()
      // Wait, `/controls` gets control action history. 
      // For actual actuator status, the actuators table holds `status (boolean)`.
      // Let's fetch the devices summary or actuators directly!
      const actRes = await api.get('/actuators')
      const actuators = actRes.data || []

      actuators.forEach(act => {
        if (!map[act.device_id]) map[act.device_id] = {}
        const key = act.name.toLowerCase().includes('fan') ? 'fan_status' :
          act.name.toLowerCase().includes('heater') ? 'heater_status' :
            act.name.toLowerCase().includes('light') ? 'light_status' : null
        if (key) {
          map[act.device_id][key] = act.status
        }
      })

      setControls(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()

    // Subscribe to actuator changes
    const realtime = getRealtimeClient()
    const channel = realtime
      .channel('public:actuators')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'actuators' }, (payload) => {
        const act = payload.new
        const key = act.name.toLowerCase().includes('fan') ? 'fan_status' :
          act.name.toLowerCase().includes('heater') ? 'heater_status' :
            act.name.toLowerCase().includes('light') ? 'light_status' : null

        if (key) {
          setControls(prev => ({
            ...prev,
            [act.device_id]: { ...(prev[act.device_id] || {}), [key]: act.status }
          }))
        }
      })
      .subscribe()

    return () => {
      realtime.removeChannel(channel)
    }
  }, [fetch_])

  useInterval(fetch_, 15000)

  const toggle = useCallback(async (deviceId, field) => {
    const key = `${deviceId}.${field}`
    const currentVal = controls[deviceId]?.[field]
    const actuatorName = field === 'fan_status' ? 'Fan' :
      field === 'heater_status' ? 'Heater' :
        field === 'light_status' ? 'LED Light' : ''

    setUpdating(key)
    try {
      // Find the actuator id by fetching actuators for this device
      const actRes = await api.get(`/actuators?device_id=${deviceId}`)
      const match = (actRes.data || []).find(a =>
        a.name.toLowerCase().includes(actuatorName.toLowerCase()) ||
        field.includes(a.name.toLowerCase())
      )

      if (!match) throw new Error(`Actuator not found for ${field}`)

      const { error } = await controlsAPI.triggerControl({
        device_id: deviceId,
        actuator_id: match.actuator_id,
        action_type: !currentVal ? 'activate' : 'deactivate',
        new_status: !currentVal
      })

      if (error) throw error

      setControls(p => ({ ...p, [deviceId]: { ...p[deviceId], [field]: !currentVal } }))
      return { success: true, newVal: !currentVal }
    } catch (e) {
      return { success: false, error: e.message || e }
    } finally {
      setUpdating(null)
    }
  }, [controls])

  return { controls, loading, updating, toggle, refetch: fetch_ }
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

  useEffect(() => { fetch_() }, [fetch_])
  return { devices, loading, refetch: fetch_ }
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
        const { data: latest } = await readingsAPI.getLatestReading(id)
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
    try {
      const hours = range === 'hour' ? 1 : range === 'day' ? 24 : 1
      const { data: chartData, error: err } = await readingsAPI.getChartData(deviceId, hours)
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
