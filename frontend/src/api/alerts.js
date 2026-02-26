// ─── Alerts API ──────────────────────────────────────────────────────────────
import { api } from '../lib/api'

export const alertsAPI = {

  // Get all alerts
  getAlerts: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString()
      const data = await api.get(`/alerts?${query}`)
      return { data: data.data, total: data.total, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get only active (unresolved) alerts
  getActiveAlerts: async () => {
    try {
      const data = await api.get('/alerts/active')
      return { data: data.data, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Acknowledge an alert
  acknowledgeAlert: async (alertId, note = '') => {
    try {
      const data = await api.patch(`/alerts/${alertId}/acknowledge`, { note })
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Resolve an alert
  resolveAlert: async (alertId, reason = '') => {
    try {
      const data = await api.patch(`/alerts/${alertId}/resolve`, { reason })
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // ── Alert Rules ────────────────────────────────────────────────────────────

  // Get all alert rules
  getAlertRules: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString()
      const data = await api.get(`/alerts/rules?${query}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Create alert rule
  createAlertRule: async (ruleData) => {
    try {
      const data = await api.post('/alerts/rules', ruleData)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update alert rule
  updateAlertRule: async (ruleId, updates) => {
    try {
      const data = await api.patch(`/alerts/rules/${ruleId}`, updates)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete alert rule
  deleteAlertRule: async (ruleId) => {
    try {
      await api.delete(`/alerts/rules/${ruleId}`)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}
