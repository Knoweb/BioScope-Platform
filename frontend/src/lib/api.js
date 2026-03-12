// ─── Backend API Base Helper ─────────────────────────────────────────────────
// All calls to your Express backend go through here

// In dev: use the same origin as the browser (works for mobile on LAN too)
// In prod: use VITE_API_URL env variable or fallback to /api
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? `${window.location.origin}/api` : '/api')


// Get stored token
const getToken = () => localStorage.getItem('bioscope_token')

// Save token
export const saveToken = (token) => localStorage.setItem('bioscope_token', token)

// Remove token
export const clearToken = () => localStorage.removeItem('bioscope_token')

// Shared refresh promise — multiple concurrent 401s all await the same call
let _refreshPromise = null

const doRefresh = () => {
  if (_refreshPromise) return _refreshPromise

  _refreshPromise = (async () => {
    const refresh_token = localStorage.getItem('bioscope_refresh_token')
    if (!refresh_token) throw new Error('No refresh token')

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token })
    })
    const d = await res.json()
    if (!res.ok || !d.access_token) throw new Error('Refresh failed')

    saveToken(d.access_token)
    localStorage.setItem('bioscope_refresh_token', d.refresh_token)
    return d.access_token
  })().finally(() => { _refreshPromise = null })

  return _refreshPromise
}

// Parse response body safely
const parseBody = async (res) => {
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// Core request function
const request = async (endpoint, options = {}) => {
  const token = getToken()

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  }

  const res = await fetch(`${API_URL}${endpoint}`, config)
  const data = await parseBody(res)

  // ── 401 handling: try token refresh then retry once ──────────────────────
  if (res.status === 401 && !endpoint.startsWith('/auth/')) {
    let newToken
    try {
      newToken = await doRefresh()
    } catch {
      // Refresh failed — clear credentials and notify the app
      clearToken()
      localStorage.removeItem('bioscope_refresh_token')
      window.dispatchEvent(new CustomEvent('bioscope:session-expired'))
      throw new Error(data?.error || 'Session expired')
    }

    // Retry original request with refreshed token
    const retryConfig = {
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${newToken}` }
    }
    const retryRes = await fetch(`${API_URL}${endpoint}`, retryConfig)
    const retryData = await parseBody(retryRes)
    if (!retryRes.ok) throw new Error(retryData?.error || `Request failed: ${retryRes.status}`)
    return retryData
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`)
  }

  return data
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
}
