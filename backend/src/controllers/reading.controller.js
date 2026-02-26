import { supabase } from '../config/supabase.js'

// GET /api/readings?device_id=C1&limit=50&since=2025-01-01
export const getReadings = async (req, res, next) => {
  try {
    const { device_id, sensor_id, since, until, limit = 100, page = 1 } = req.query
    if (!device_id) return res.status(400).json({ error: 'device_id is required' })

    const offset = (page - 1) * limit

    let query = supabase
      .from('readings')
      .select('*', { count: 'exact' })
      .eq('device_id', device_id)
      .order('recorded_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (sensor_id) query = query.eq('sensor_id', sensor_id)
    if (since) query = query.gte('recorded_at', since)
    if (until) query = query.lte('recorded_at', until)

    const { data, error, count } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
}

// GET /api/readings/latest?device_id=C1
export const getLatestReading = async (req, res, next) => {
  try {
    const { device_id } = req.query
    if (!device_id) return res.status(400).json({ error: 'device_id is required' })

    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('device_id', device_id)
      .order('recorded_at', { ascending: false })
      .limit(1)

    if (error) return res.status(400).json({ error: error.message })

    return res.json({ data: data && data.length > 0 ? data[0] : null })
  } catch (err) { next(err) }
}

// GET /api/readings/stats?device_id=C1&hours=24
export const getReadingStats = async (req, res, next) => {
  try {
    const { device_id, hours = 24 } = req.query
    if (!device_id) return res.status(400).json({ error: 'device_id is required' })

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('readings')
      .select('temperature, humidity, light_level, recorded_at')
      .eq('device_id', device_id)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true })

    if (error) return res.status(400).json({ error: error.message })

    if (!data || data.length === 0) {
      return res.json({ data: null, message: 'No readings found in this period' })
    }

    const temps = data.map(r => r.temperature).filter(v => v !== null)
    const humids = data.map(r => r.humidity).filter(v => v !== null)
    const lights = data.map(r => r.light_level).filter(v => v !== null)

    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
    const round = (v) => v !== null ? Math.round(v * 100) / 100 : null

    return res.json({
      data: {
        period_hours: parseInt(hours),
        count: data.length,
        temperature: { avg: round(avg(temps)), min: round(Math.min(...temps)), max: round(Math.max(...temps)) },
        humidity: { avg: round(avg(humids)), min: round(Math.min(...humids)), max: round(Math.max(...humids)) },
        light_level: { avg: round(avg(lights)), min: round(Math.min(...lights)), max: round(Math.max(...lights)) },
        first_reading: data[0].recorded_at,
        last_reading: data[data.length - 1].recorded_at
      }
    })
  } catch (err) { next(err) }
}

// POST /api/readings  (single or batch)
export const createReading = async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body]
    const readings = payload.map(r => ({
      device_id: r.device_id,
      sensor_id: r.sensor_id || null,
      temperature: r.temperature ?? null,
      humidity: r.humidity ?? null,
      light_level: r.light_level ?? null,
      raw_data: r.raw_data || null,
      recorded_at: r.recorded_at || new Date().toISOString()
    }))

    const missing = readings.find(r => !r.device_id)
    if (missing) return res.status(400).json({ error: 'device_id is required for all readings' })

    const { data, error } = await supabase.from('readings').insert(readings).select()
    if (error) return res.status(400).json({ error: error.message })

    return res.status(201).json({ data, inserted: data.length })
  } catch (err) { next(err) }
}

// GET /api/readings/chart?device_id=C1&hours=24&interval=15m
export const getChartData = async (req, res, next) => {
  try {
    const { device_id, hours = 24 } = req.query
    if (!device_id) return res.status(400).json({ error: 'device_id is required' })

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('readings')
      .select('recorded_at, temperature, humidity, light_level')
      .eq('device_id', device_id)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true })

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ data })
  } catch (err) { next(err) }
}
