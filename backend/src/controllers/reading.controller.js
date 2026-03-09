import { supabase } from '../config/supabase.js'
import { automationService } from '../services/automation.service.js'

// GET /api/readings?device_id=C1&limit=50&since=2025-01-01
export const getReadings = async (req, res, next) => {
  try {
    let { device_id, parent_id, sensor_id, since, until, limit = 100, page = 1 } = req.query
    if (!device_id && !parent_id) return res.status(400).json({ error: 'device_id or parent_id is required' })

    if (parent_id) {
      const { data: child, error: childErr } = await supabase
        .from('child_units')
        .select('unit_id')
        .eq('parent_unit_id', parent_id)
        .order('priority', { ascending: true })
        .limit(1)
        .single()
      if (!childErr && child) device_id = child.unit_id
    }

    if (!device_id) return res.json({ data: [], total: 0, page: parseInt(page), limit: parseInt(limit) })

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

// GET /api/readings/latest
export const getLatestReading = async (req, res, next) => {
  try {
    const { device_id, parent_id } = req.query
    if (!device_id && !parent_id) return res.status(400).json({ error: 'device_id or parent_id is required' })

    if (parent_id) {
      // Find the highest priority child unit for this parent
      const { data: child, error: childErr } = await supabase
        .from('child_units')
        .select('unit_id')
        .eq('parent_unit_id', parent_id)
        .order('priority', { ascending: true })
        .limit(1)
        .single()

      if (childErr || !child) return res.json({ data: null })

      // Get its reading
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('device_id', child.unit_id)
        .order('recorded_at', { ascending: false })
        .limit(1)

      if (error) return res.status(400).json({ error: error.message })
      return res.json({ data: data && data.length > 0 ? data[0] : null })
    }

    // Normal direct device ID lookup
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
    let { device_id, parent_id, hours = 24 } = req.query
    if (!device_id && !parent_id) return res.status(400).json({ error: 'device_id or parent_id is required' })

    if (parent_id) {
      const { data: child, error: childErr } = await supabase
        .from('child_units')
        .select('unit_id')
        .eq('parent_unit_id', parent_id)
        .order('priority', { ascending: true })
        .limit(1)
        .single()
      if (!childErr && child) device_id = child.unit_id
    }

    if (!device_id) return res.json({ data: null, message: 'No internal device matching parent parameter' })

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

    // Fire off the automation evaluation asynchronously in the background
    // for every recorded parent device reading that was just inserted
    if (data && data.length > 0) {
      Promise.all(data.map(reading => {
        return automationService.processReadings(reading.device_id, reading)
      })).catch(err => console.error('[Automation Background Error]', err));
    }

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
