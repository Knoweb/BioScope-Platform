import { useState, useEffect, useCallback, useRef } from 'react'
import * as API from '../api'

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
    try {
      const r = await API.getReadings(deviceId, limit)
      setData(limit === 1 ? r?.[0] ?? null : r ?? [])
      setError(null)
    } catch (e) {
      setError(e.message)
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
    setLoading(true)
    try {
      const r = await API.getAudit(deviceId, range)
      setData(r ?? [])
      setError(null)
    } catch (e) {
      setError(e.message)
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
      const list = await API.getControls()
      const map = {}
      ;(list ?? []).forEach(c => { map[c.device_id] = c })
      setControls(map)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])
  useInterval(fetch_, 15000)

  const toggle = useCallback(async (deviceId, field) => {
    const key = `${deviceId}.${field}`
    const currentVal = controls[deviceId]?.[field]
    setUpdating(key)
    try {
      const updated = await API.setControl(deviceId, { [field]: !currentVal })
      setControls(p => ({ ...p, [deviceId]: { ...p[deviceId], ...updated } }))
      return { success: true, newVal: !currentVal }
    } catch (e) {
      return { success: false, error: e.message }
    } finally {
      setUpdating(null)
    }
  }, [controls])

  return { controls, loading, updating, toggle, refetch: fetch_ }
}
