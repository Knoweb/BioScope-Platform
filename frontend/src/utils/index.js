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
