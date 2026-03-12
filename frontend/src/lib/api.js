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

  // Handle 204 No Content or empty responses safely
  let data = null
  if (res.status !== 204) {
    const text = await res.text()
    if (text) data = JSON.parse(text)
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
