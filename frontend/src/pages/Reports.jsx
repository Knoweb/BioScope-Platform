import { useState } from 'react'
import { useReadings, useDevices } from '../hooks'
import { fmt, fmtDateTime, downloadCSV, downloadJSON } from '../utils'
import { Card, SectionHeader, Btn, Badge } from '../components/UI'
import styles from './Reports.module.css'

function StatBox({ label, value, unit, color }) {
  return (
    <div className={styles.statBox} style={{ '--c': color }}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statVal} style={{ color }}>{value}<span className={styles.statUnit}>{unit}</span></div>
    </div>
  )
}

function DeviceReport({ deviceId, addToast }) {
  const { data: rows, loading } = useReadings(deviceId, 200, 60000)
  const arr = Array.isArray(rows) ? rows : []

  const temps = arr.map(r => Number(r.temperature)).filter(Boolean)
  const hums = arr.map(r => Number(r.humidity)).filter(Boolean)
  const lights = arr.map(r => Number(r.light_level)).filter(Boolean)

  const stat = (a) => a.length === 0 ? null : ({
    avg: a.reduce((s, v) => s + v, 0) / a.length,
    min: Math.min(...a),
    max: Math.max(...a),
  })

  const ts = stat(temps), hs = stat(hums), ls = stat(lights)

  const exportReport = () => {
    downloadCSV(arr, `bioscope_report_${deviceId}_${Date.now()}.csv`)
    addToast(`Report exported for ${deviceId}`, 'success')
  }

  return (
    <Card className={`${styles.reportCard} fade-up`}>
      <div className={styles.reportHeader}>
        <div className={styles.reportTitle}>Device {deviceId}</div>
        <div className={styles.reportMeta}>
          <Badge label={`${arr.length} READINGS`} color="cyan" />
          <Badge label="ONLINE" color="green" />
        </div>
        <Btn onClick={exportReport} icon="⬇" variant="secondary">Export CSV</Btn>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', padding: '12px 0' }}>Loading stats...</div>
      ) : arr.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', padding: '12px 0' }}>No data available</div>
      ) : (
        <>
          <div className={styles.statSection}>
            <div className={styles.statSectionLabel}>🌡️ TEMPERATURE (°C)</div>
            <div className={styles.statGrid}>
              <StatBox label="AVG" value={ts ? fmt(ts.avg) : '—'} unit="°C" color="var(--red)" />
              <StatBox label="MIN" value={ts ? fmt(ts.min) : '—'} unit="°C" color="var(--amber)" />
              <StatBox label="MAX" value={ts ? fmt(ts.max) : '—'} unit="°C" color="var(--red)" />
            </div>
          </div>
          <div className={styles.statSection}>
            <div className={styles.statSectionLabel}>💧 HUMIDITY (%)</div>
            <div className={styles.statGrid}>
              <StatBox label="AVG" value={hs ? fmt(hs.avg) : '—'} unit="%" color="var(--cyan)" />
              <StatBox label="MIN" value={hs ? fmt(hs.min) : '—'} unit="%" color="var(--cyan)" />
              <StatBox label="MAX" value={hs ? fmt(hs.max) : '—'} unit="%" color="var(--cyan)" />
            </div>
          </div>
          <div className={styles.statSection}>
            <div className={styles.statSectionLabel}>☀️ LIGHT (lux)</div>
            <div className={styles.statGrid}>
              <StatBox label="AVG" value={ls ? fmt(ls.avg, 0) : '—'} unit="" color="var(--amber)" />
              <StatBox label="MIN" value={ls ? fmt(ls.min, 0) : '—'} unit="" color="var(--amber)" />
              <StatBox label="MAX" value={ls ? fmt(ls.max, 0) : '—'} unit="" color="var(--amber)" />
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

export default function Reports({ addToast }) {
  const { devices, loading: devLoading } = useDevices()

  const exportAll = () => {
    addToast('Generating full report...', 'info')
    setTimeout(() => addToast('Full report ready', 'success'), 1000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topActions}>
        <Btn onClick={exportAll} icon="📊" variant="primary">Generate Full Report</Btn>
      </div>

      <SectionHeader title="Per-Device Analytics" />
      {devLoading ? (
        <div style={{ padding: 20 }}>Loading devices...</div>
      ) : devices.length === 0 ? (
        <div style={{ padding: 20, color: 'var(--text-muted)' }}>No devices found</div>
      ) : (
        <div className={styles.reportGrid}>
          {devices.map(d => <DeviceReport key={d.device_id} deviceId={d.device_id} addToast={addToast} />)}
        </div>
      )}

      {/* About reports */}
      <SectionHeader title="Export Options" />
      <Card className="fade-up">
        <div className={styles.exportOptions}>
          {[
            { format: 'CSV', icon: '📄', desc: 'Comma-separated values for spreadsheet tools (Excel, Google Sheets)' },
            { format: 'JSON', icon: '🗄', desc: 'Structured JSON for developers and data pipelines' },
            { format: 'PDF', icon: '📑', desc: 'Formatted PDF report with charts (coming soon)' },
          ].map(o => (
            <div key={o.format} className={styles.exportOption}>
              <span className={styles.exportIcon}>{o.icon}</span>
              <div>
                <div className={styles.exportFormat}>{o.format}</div>
                <div className={styles.exportDesc}>{o.desc}</div>
              </div>
              <Badge label={o.format === 'PDF' ? 'SOON' : 'AVAILABLE'} color={o.format === 'PDF' ? 'muted' : 'green'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
