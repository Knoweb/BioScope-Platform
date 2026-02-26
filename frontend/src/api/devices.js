// ─── Devices API ─────────────────────────────────────────────────────────────
import { api } from '../lib/api'

export const devicesAPI = {

  // Get all devices
  getDevices: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString()
      const data = await api.get(`/devices${query ? `?${query}` : ''}`)
      return { data: data.data, total: data.total, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get single device with sensors, actuators, settings
  getDevice: async (deviceId) => {
    try {
      const data = await api.get(`/devices/${deviceId}`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get device summary (uses DB view)
  getDeviceSummary: async (deviceId) => {
    try {
      const data = await api.get(`/devices/${deviceId}/summary`)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Create device
  createDevice: async (deviceData) => {
    try {
      const data = await api.post('/devices', deviceData)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update device
  updateDevice: async (deviceId, updates) => {
    try {
      const data = await api.patch(`/devices/${deviceId}`, updates)
      return { data: data.data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete device (soft delete)
  deleteDevice: async (deviceId) => {
    try {
      await api.delete(`/devices/${deviceId}`)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}
