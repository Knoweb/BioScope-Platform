import { format, parseISO } from 'date-fns'

export const DEVICES = ['C1', 'C2']

export const fmt = (v, decimals = 1) =>
  v != null ? Number(v).toFixed(decimals) : '—'

export const fmtTime = (ts) => {
  if (!ts) return ''
  try { return format(typeof ts === 'string' ? parseISO(ts) : new Date(ts), 'HH:mm:ss') }
  catch { return '' }
}

export const fmtDateTime = (ts) => {
  if (!ts) return ''
  try { return format(typeof ts === 'string' ? parseISO(ts) : new Date(ts), 'MMM d, HH:mm') }
  catch { return '' }
}

export const fmtDateFull = (ts) => {
  if (!ts) return ''
  try { return format(typeof ts === 'string' ? parseISO(ts) : new Date(ts), 'MMM d yyyy, HH:mm:ss') }
  catch { return '' }
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export const tempStatus = (t) => {
  if (t == null) return 'unknown'
  if (t < 20) return 'low'
  if (t > 30) return 'high'
  return 'normal'
}

export const humStatus = (h) => {
  if (h == null) return 'unknown'
  if (h < 30) return 'low'
  if (h > 75) return 'high'
  return 'normal'
}

export const downloadCSV = (rows, filename) => {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
