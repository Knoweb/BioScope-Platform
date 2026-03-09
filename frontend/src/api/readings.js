// ─── Readings API ─────────────────────────────────────────────────────────────
import { api } from '../lib/api'

export const readingsAPI = {

  // Get paginated readings
  getReadings: async (id, isParent = false, params = {}) => {
    try {
      const typeParam = isParent ? { parent_id: id, ...params } : { device_id: id, ...params }
      const query = new URLSearchParams(typeParam).toString()
      const data = await api.get(`/readings?${query}`)
      return { data: data.data, total: data.total, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get latest reading for a device or parent
  getLatestReading: async (id, isParent = false) => {
    try {
      const typeParam = isParent ? `parent_id=${id}` : `device_id=${id}`
      const data = await api.get(`/readings/latest?${typeParam}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get stats (avg, min, max) for a device
  getStats: async (id, isParent = false, hours = 24) => {
    try {
      const typeParam = isParent ? `parent_id=${id}` : `device_id=${id}`
      const data = await api.get(`/readings/stats?${typeParam}&hours=${hours}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get chart data (time series)
  getChartData: async (id, isParent = false, hours = 24) => {
    try {
      const typeParam = isParent ? `parent_id=${id}` : `device_id=${id}`
      const data = await api.get(`/readings/chart?${typeParam}&hours=${hours}`)
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
