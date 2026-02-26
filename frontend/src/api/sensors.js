// ─── Sensors API ─────────────────────────────────────────────────────────────
import { api } from '../lib/api'

export const sensorsAPI = {

  // Get all sensors (optionally filter by device)
  getSensors: async (deviceId = null) => {
    try {
      const query = deviceId ? `?device_id=${deviceId}` : ''
      const data = await api.get(`/sensors${query}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get single sensor
  getSensor: async (sensorId) => {
    try {
      const data = await api.get(`/sensors/${sensorId}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get all sensor types
  getSensorTypes: async () => {
    try {
      const data = await api.get('/sensors/types')
      return { data: data.data, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Create sensor
  createSensor: async (sensorData) => {
    try {
      const data = await api.post('/sensors', sensorData)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update sensor
  updateSensor: async (sensorId, updates) => {
    try {
      const data = await api.patch(`/sensors/${sensorId}`, updates)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete sensor
  deleteSensor: async (sensorId) => {
    try {
      await api.delete(`/sensors/${sensorId}`)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}
