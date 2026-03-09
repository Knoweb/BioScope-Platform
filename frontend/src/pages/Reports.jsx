import { useState } from 'react'
import { useReadings, useDevices } from '../hooks'
import { fmt, fmtDateTime, downloadCSV, downloadJSON, downloadPDF, downloadFullPDF } from '../utils'
import { readingsAPI } from '../api'
import { Card, SectionHeader, Btn, Badge } from '../components/UI'
import { useTranslation } from 'react-i18next'
import styles from './Reports.module.css'

function StatBox({ label, value, unit, color }) {
  return (
    <div className={styles.statBox} style={{ '--c': color }}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statVal} style={{ color }}>{value}<span className={styles.statUnit}>{unit}</span></div>
    </div>
  )
}

function DeviceReport({ deviceId, name, addToast }) {
  const { t } = useTranslation()
  const [exportRange, setExportRange] = useState(24)
  const [exporting, setExporting] = useState(null)

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

  const handleExport = async (format) => {
    setExporting(format)
    addToast(`Preparing ${format} report for ${name || deviceId}...`, 'info')
    try {
      const isParent = String(deviceId).startsWith('P')
      const sinceISO = new Date(Date.now() - exportRange * 60 * 60 * 1000).toISOString()
      const { data: exportData, error } = await readingsAPI.getReadings(deviceId, isParent, { limit: 10000, since: sinceISO })

      if (error) throw error
      if (!exportData || !exportData.length) {
        addToast('No data found for the selected time range', 'warning')
        return
      }

      const rangeLabel = exportRange === 1 ? 'Last 1 Hour' : exportRange === 24 ? 'Last 24 Hours' : 'Last 7 Days'
      const filename = `bioscope_${deviceId}_${exportRange}h_${Date.now()}`

      if (format === 'CSV') downloadCSV(exportData, filename + '.csv')
      if (format === 'JSON') downloadJSON(exportData, filename + '.json')
      if (format === 'PDF') downloadPDF(exportData, name || deviceId, rangeLabel, filename + '.pdf')

      addToast(`Successfully exported ${exportData.length} records as ${format}`, 'success')
    } catch (e) {
      addToast(`Export failed: ${e.message}`, 'error')
    } finally {
      setExporting(null)
    }
  }

  return (
    <Card className={`${styles.reportCard} fade-up`}>
      <div className={styles.reportHeader}>
        <div className={styles.reportTitle}>{name || t('reports.deviceTitle', { id: deviceId })}</div>
        <div className={styles.reportMeta}>
          <Badge label={t('reports.readingsCount', { count: arr.length })} color="cyan" />
          <Badge label={t('reports.online')} color="green" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
        <select
          value={exportRange}
          onChange={e => setExportRange(Number(e.target.value))}
          style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-mid)', marginRight: 'auto' }}
        >
          <option value={1}>{t('reports.last1Hour')}</option>
          <option value={24}>{t('reports.last24Hours')}</option>
          <option value={168}>{t('reports.last7Days')}</option>
        </select>
        <Btn onClick={() => handleExport('CSV')} loading={exporting === 'CSV'} variant="secondary" size="small">CSV</Btn>
        <Btn onClick={() => handleExport('JSON')} loading={exporting === 'JSON'} variant="secondary" size="small">JSON</Btn>
        <Btn onClick={() => handleExport('PDF')} loading={exporting === 'PDF'} variant="primary" size="small">PDF</Btn>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', padding: '12px 0' }}>{t('reports.loadingStats')}</div>
      ) : arr.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', padding: '12px 0' }}>{t('reports.noDataAvailable')}</div>
      ) : (
        <>
          <div className={styles.statSection}>
            <div className={styles.statSectionLabel}>{t('reports.temperatureHeader')}</div>
            <div className={styles.statGrid}>
              <StatBox label={t('reports.avg')} value={ts ? fmt(ts.avg) : '—'} unit="°C" color="var(--red)" />
              <StatBox label={t('reports.min')} value={ts ? fmt(ts.min) : '—'} unit="°C" color="var(--amber)" />
              <StatBox label={t('reports.max')} value={ts ? fmt(ts.max) : '—'} unit="°C" color="var(--red)" />
            </div>
          </div>
          <div className={styles.statSection}>
            <div className={styles.statSectionLabel}>{t('reports.humidityHeader')}</div>
            <div className={styles.statGrid}>
              <StatBox label={t('reports.avg')} value={hs ? fmt(hs.avg) : '—'} unit="%" color="var(--cyan)" />
              <StatBox label={t('reports.min')} value={hs ? fmt(hs.min) : '—'} unit="%" color="var(--cyan)" />
              <StatBox label={t('reports.max')} value={hs ? fmt(hs.max) : '—'} unit="%" color="var(--cyan)" />
            </div>
          </div>
          <div className={styles.statSection}>
            <div className={styles.statSectionLabel}>{t('reports.lightHeader')}</div>
            <div className={styles.statGrid}>
              <StatBox label={t('reports.avg')} value={ls ? fmt(ls.avg, 0) : '—'} unit="" color="var(--amber)" />
              <StatBox label={t('reports.min')} value={ls ? fmt(ls.min, 0) : '—'} unit="" color="var(--amber)" />
              <StatBox label={t('reports.max')} value={ls ? fmt(ls.max, 0) : '—'} unit="" color="var(--amber)" />
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

export default function Reports({ addToast }) {
  const { t } = useTranslation()
  const { devices, loading: devLoading } = useDevices()
  const [exportingFull, setExportingFull] = useState(false)

  const parentDevices = devices.filter(d => d.type === 'parent')

  const exportAll = async () => {
    setExportingFull(true)
    addToast('Generating full multi-device report... This may take a moment', 'info')

    try {
      const sinceISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const deviceDataList = []

      for (const d of parentDevices) {
        const isParent = String(d.device_id).startsWith('P')
        const { data: rows, error } = await readingsAPI.getReadings(d.device_id, isParent, { limit: 10000, since: sinceISO })
        if (!error && rows && rows.length > 0) {
          deviceDataList.push({ deviceId: d.name || d.device_id, name: d.name, rows })
        }
      }

      if (deviceDataList.length === 0) {
        addToast('No data found for any devices in the last 24 hours', 'warning')
        return
      }

      downloadFullPDF(deviceDataList, 'Last 24 Hours', `bioscope_full_report_${Date.now()}.pdf`)
      addToast('Full fleet report generated successfully', 'success')
    } catch (e) {
      addToast(`Full report failed: ${e.message}`, 'error')
    } finally {
      setExportingFull(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topActions}>
        <Btn onClick={exportAll} loading={exportingFull} icon="📊" variant="primary">{t('reports.generateFullReport')}</Btn>
      </div>

      <SectionHeader title={t('reports.perDeviceAnalytics')} />
      {devLoading ? (
        <div style={{ padding: 20 }}>{t('reports.loadingDevices')}</div>
      ) : parentDevices.length === 0 ? (
        <div style={{ padding: 20, color: 'var(--text-muted)' }}>{t('reports.noDevicesFound')}</div>
      ) : (
        <div className={styles.reportGrid}>
          {parentDevices.map(d => <DeviceReport key={d.device_id} deviceId={d.device_id} name={d.name} addToast={addToast} />)}
        </div>
      )}

      {/* About reports */}
      <SectionHeader title={t('reports.exportOptions')} />
      <Card className="fade-up">
        <div className={styles.exportOptions}>
          {[
            { format: 'CSV', icon: '📄', desc: t('reports.csvDesc') },
            { format: 'JSON', icon: '🗄', desc: t('reports.jsonDesc') },
            { format: 'PDF', icon: '📑', desc: t('reports.pdfDesc') },
          ].map(o => (
            <div key={o.format} className={styles.exportOption}>
              <span className={styles.exportIcon}>{o.icon}</span>
              <div>
                <div className={styles.exportFormat}>{o.format}</div>
                <div className={styles.exportDesc}>{o.desc}</div>
              </div>
              <Badge label={t('reports.available')} color="green" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
