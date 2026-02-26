// ─── Readings API ─────────────────────────────────────────────────────────────
import { api } from '../lib/api'

export const readingsAPI = {

  // Get paginated readings
  getReadings: async (deviceId, params = {}) => {
    try {
      const query = new URLSearchParams({ device_id: deviceId, ...params }).toString()
      const data = await api.get(`/readings?${query}`)
      return { data: data.data, total: data.total, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get latest reading for a device
  getLatestReading: async (deviceId) => {
    try {
      const data = await api.get(`/readings/latest?device_id=${deviceId}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get stats (avg, min, max) for a device
  getStats: async (deviceId, hours = 24) => {
    try {
      const data = await api.get(`/readings/stats?device_id=${deviceId}&hours=${hours}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get chart data (time series)
  getChartData: async (deviceId, hours = 24) => {
    try {
      const data = await api.get(`/readings/chart?device_id=${deviceId}&hours=${hours}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Insert a single or batch readings
  createReading: async (readings) => {
    try {
      const data = await api.post('/readings', readings)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
