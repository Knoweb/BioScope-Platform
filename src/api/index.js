// ─── BioScope API Client ────────────────────────────────────────────────────
const BASE = 'https://wqhbf9x6-3000.asse.devtunnels.ms'

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

// POST /api/stream-data
export const streamData = (payload) =>
  req('/api/stream-data', { method: 'POST', body: JSON.stringify(payload) })

// GET /api/readings/:deviceId?limit=n
export const getReadings = (deviceId, limit = 50) =>
  req(`/api/readings/${deviceId}?limit=${limit}`)

// GET /api/controls
export const getControls = () => req('/api/controls')

// POST /api/controls/:deviceId
export const setControl = (deviceId, body) =>
  req(`/api/controls/${deviceId}`, { method: 'POST', body: JSON.stringify(body) })

// GET /api/audit/:deviceId/hour|day
export const getAudit = (deviceId, range = 'hour') =>
  req(`/api/audit/${deviceId}/${range}`)
