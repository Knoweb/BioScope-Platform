// ─── Actuators API ───────────────────────────────────────────────────────────
import { api } from '../lib/api'

export const actuatorsAPI = {

  // Get all actuators (optionally filter by device)
  getActuators: async (deviceId = null) => {
    try {
      const query = deviceId ? `?device_id=${deviceId}` : ''
      const data = await api.get(`/actuators${query}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get single actuator
  getActuator: async (actuatorId) => {
    try {
      const data = await api.get(`/actuators/${actuatorId}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Toggle actuator on/off
  toggleActuator: async (actuatorId) => {
    try {
      const data = await api.patch(`/actuators/${actuatorId}/toggle`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update actuator (status, value, etc.)
  updateActuator: async (actuatorId, updates) => {
    try {
      const data = await api.patch(`/actuators/${actuatorId}`, updates)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Create actuator
  createActuator: async (actuatorData) => {
    try {
      const data = await api.post('/actuators', actuatorData)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete actuator
  deleteActuator: async (actuatorId) => {
    try {
      await api.delete(`/actuators/${actuatorId}`)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}
