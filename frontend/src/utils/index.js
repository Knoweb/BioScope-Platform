import { format, parseISO } from 'date-fns'

export const DEVICES = ['C1', 'C2']

export const fmt = (v, decimals = 1) =>
  v != null ? Number(v).toFixed(decimals) : '—'

// Helper to strip timezone info from DB timestamps so they are treated as exactly local time
const parseLocal = (ts) => {
  if (typeof ts !== 'string') return ts
  // Convert "2026-02-26 12:47:55" -> "2026-02-26T12:47:55"
  let iso = ts.replace(' ', 'T')
  // Remove trailing timezone indicators like Z, +00, +00:00, -05:00
  iso = iso.replace(/(Z|[+-]\d{2}(?::?\d{2})?)$/, '')
  return iso
}

export const fmtTime = (ts) => {
  if (!ts) return ''
  try { return format(new Date(parseLocal(ts)), 'HH:mm:ss') }
  catch { return '' }
}

export const fmtDateTime = (ts) => {
  if (!ts) return ''
  try { return format(new Date(parseLocal(ts)), 'MMM d, HH:mm') }
  catch { return '' }
}

export const fmtDateFull = (ts) => {
  if (!ts) return ''
  try { return format(new Date(parseLocal(ts)), 'MMM d yyyy, HH:mm:ss') }
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

export const formatLocalizedDeviceName = (name, t) => {
  if (!name) return ''
  const raw = String(name).trim()

  const parent = raw.match(/^parent\s*unit\s*(\d+)$/i) || raw.match(/^parent\s*(\d+)$/i)
  if (parent) {
    return t('devices.parentUnitName', {
      number: parent[1],
      defaultValue: `Parent Unit ${parent[1]}`,
    })
  }

  const child = raw.match(/^child\s*unit\s*(\d+)$/i) || raw.match(/^child\s*(\d+)$/i)
  if (child) {
    return t('devices.childUnitName', {
      number: child[1],
      defaultValue: `Child Unit ${child[1]}`,
    })
  }

  return raw
}

export const formatLocalizedDeviceRole = (role, t) => {
  if (!role) return ''
  if (role === 'parent') return t('devices.roleParent', 'parent')
  if (role === 'child') return t('devices.roleChild', 'child')
  return role
}

export const translateRuleName = (name, t) => {
  if (!name) return ''
  const normalized = String(name).toLowerCase().trim().replace(/[\s_]+/g, ' ')
  const map = {
    'device offline': 'alerts.ruleNames.deviceOffline',
    'high humidity': 'alerts.ruleNames.highHumidity',
    'high temperature': 'alerts.ruleNames.highTemperature',
    'low temperature': 'alerts.ruleNames.lowTemperature',
    'low humidity': 'alerts.ruleNames.lowHumidity',
    'high light': 'alerts.ruleNames.highLight',
    'low light': 'alerts.ruleNames.lowLight',
  }
  const key = map[normalized]
  return key ? t(key, { defaultValue: name }) : name
}

export const translateConditionText = (condition, t) => {
  if (!condition) return ''
  return String(condition)
    .replace(/\bno_data\b/gi, t('alerts.condition.noData', 'no_data'))
    .replace(/\blight_level\b/gi, t('alerts.condition.lightLevel', 'light_level'))
    .replace(/\btemperature\b/gi, t('alerts.condition.temperature', 'temperature'))
    .replace(/\bhumidity\b/gi, t('alerts.condition.humidity', 'humidity'))
}

export const translateActionText = (action, t) => {
  if (!action) return ''
  const parsed = String(action).trim().match(/^([a-z_]+)\s*:\s*(on|off)$/i)
  if (!parsed) return action

  const actuator = parsed[1].toLowerCase()
  const state = parsed[2].toLowerCase()
  const actuatorMap = {
    fan: 'controls.actuators.fan.label',
    heater: 'controls.actuators.heater.label',
    light: 'controls.actuators.light.label',
  }
  const actuatorLabel = actuatorMap[actuator] ? t(actuatorMap[actuator], { defaultValue: actuator }) : actuator
  const stateLabel = state === 'on' ? t('controls.on', 'ON') : t('controls.off', 'OFF')
  return `${actuatorLabel}:${stateLabel}`
}

export const translateSeverityLabel = (severity, t) => {
  const s = String(severity || 'warning').toLowerCase()
  if (s === 'critical') return t('alerts.severity.critical', 'CRITICAL')
  if (s === 'warning') return t('alerts.severity.warning', 'WARNING')
  return s.toUpperCase()
}

export const translateChannelStatus = (status, t) => {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return t('alerts.channelStatus.active', 'ACTIVE')
  if (s === 'inactive') return t('alerts.channelStatus.inactive', 'INACTIVE')
  return s.toUpperCase()
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

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const downloadPDF = (rows, deviceId, rangeLabel, filename) => {
  if (!rows || !rows.length) return

  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('BioScope Analytics Report', 14, 22)

  // Meta Info
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text(`Device ID: ${deviceId}`, 14, 32)
  doc.text(`Time Range: ${rangeLabel}`, 14, 38)
  doc.text(`Total Readings: ${rows.length}`, 14, 44)
  doc.text(`Generated: ${fmtDateFull(new Date().toISOString())}`, 14, 50)

  // Table Data mapping
  const tableData = rows.map(r => [
    fmtDateTime(r.recorded_at),
    fmt(r.temperature, 1) + ' °C',
    fmt(r.humidity, 1) + ' %',
    fmt(r.light_level, 0) + ' lux'
  ])

  autoTable(doc, {
    startY: 60,
    head: [['Time', 'Temperature', 'Humidity', 'Light']],
    body: tableData,
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 10, cellPadding: 4 },
  })

  doc.save(filename)
}

export const downloadFullPDF = (deviceDataList, rangeLabel, filename) => {
  if (!deviceDataList || !deviceDataList.length) return

  const doc = new jsPDF()

  deviceDataList.forEach((data, index) => {
    if (index > 0) doc.addPage()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('BioScope Full Analytics Report', 14, 22)

    // Meta Info
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`Device ID: ${data.deviceId}`, 14, 32)
    doc.text(`Time Range: ${rangeLabel}`, 14, 38)
    doc.text(`Total Readings: ${data.rows.length}`, 14, 44)
    doc.text(`Generated: ${fmtDateFull(new Date().toISOString())}`, 14, 50)

    // Table Data mapping
    const tableData = data.rows.map(r => [
      fmtDateTime(r.recorded_at),
      fmt(r.temperature, 1) + ' °C',
      fmt(r.humidity, 1) + ' %',
      fmt(r.light_level, 0) + ' lux'
    ])

    autoTable(doc, {
      startY: 60,
      head: [['Time', 'Temperature', 'Humidity', 'Light']],
      body: tableData,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10, cellPadding: 4 },
    })
  })

  doc.save(filename)
}
