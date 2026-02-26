import { api } from '../lib/api'

export const automationAPI = {
    getRules: async (deviceId) => {
        const query = deviceId ? `?device_id=${deviceId}` : ''
        const { data } = await api.get(`/automation${query}`)
        return { data }
    },

    getRuleById: async (id) => {
        const { data } = await api.get(`/automation/${id}`)
        return { data }
    },

    createRule: async (rule) => {
        // The backend uses req.user info, payload doesn't need to specify role
        const { data } = await api.post('/automation', rule)
        return { data }
    },

    updateRule: async (id, updates) => {
        const { data } = await api.patch(`/automation/${id}`, updates)
        return { data }
    },

    deleteRule: async (id) => {
        await api.delete(`/automation/${id}`)
        return { success: true }
    }
}
