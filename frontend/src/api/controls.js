// ─── Controls API ────────────────────────────────────────────────────────────
import { api } from '../lib/api'

export const controlsAPI = {

  // Trigger a control action (activate, deactivate, set_value)
  triggerControl: async ({ device_id, actuator_id, action_type, new_status, new_value, reason }) => {
    try {
      const data = await api.post('/controls', {
        device_id,
        actuator_id,
        action_type,   // 'activate' | 'deactivate' | 'set_value'
        new_status,
        new_value,
        reason: reason || 'Manual trigger'
      })
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get control action history
  getHistory: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString()
      const data = await api.get(`/controls?${query}`)
      return { data: data.data, total: data.total, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get single control action
  getControl: async (actionId) => {
    try {
      const data = await api.get(`/controls/${actionId}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
