import { useState, useEffect } from 'react'
import { api } from '../lib/api'

/**
 * Polls the latest reading timestamp for a device every 60 seconds.
 * Returns sensor health info used to show banners and force manual mode.
 *
 * severity: 'ok' (< 10 min) | 'warning' (10–30 min) | 'offline' (> 30 min)
 * canOverride: true when sensor is offline — forces MANUAL mode
 */
export function useSensorStatus(deviceId) {
    const [status, setStatus] = useState({
        isStale: false,
        minutesSince: null,
        canOverride: false,
        severity: 'ok',
        lastUpdated: null,
    })

    useEffect(() => {
        if (!deviceId) return

        async function check() {
            try {
                const res = await api.get(`/readings?parent_id=${deviceId}&limit=1`)
                const rows = res.data ?? []
                const latest = Array.isArray(rows) ? rows[0] : rows

                if (!latest?.recorded_at) {
                    setStatus({ isStale: true, minutesSince: 999, canOverride: true, severity: 'offline', lastUpdated: null })
                    return
                }

                const mins = (Date.now() - new Date(latest.recorded_at).getTime()) / 60000
                setStatus({
                    isStale: mins > 10,
                    minutesSince: Math.floor(mins),
                    canOverride: mins > 30,
                    severity: mins > 30 ? 'offline' : mins > 10 ? 'warning' : 'ok',
                    lastUpdated: latest.recorded_at,
                    reading: latest,
                })
            } catch (e) {
                console.error('[useSensorStatus]', e.message)
            }
        }

        check()
        const timer = setInterval(check, 60_000)
        return () => clearInterval(timer)
    }, [deviceId])

    return status
}
