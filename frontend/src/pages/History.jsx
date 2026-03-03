import { useState, useMemo, useEffect } from 'react'
import { useReadings, useDevices } from '../hooks'
import { fmt, fmtDateFull, downloadCSV, downloadJSON } from '../utils'
import { DeviceTabs, SectionHeader, Card, Badge, Btn, EmptyState, PageLoader } from '../components/UI'
import { useTranslation } from 'react-i18next'
import styles from './History.module.css'

const PAGE_SIZE = 20

export default function History({ addToast }) {
  const { t } = useTranslation()
  const { devices, loading: devLoading } = useDevices()
  const deviceIds = useMemo(() => devices.map(d => d.device_id), [devices])

  const [device, setDevice] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    if (deviceIds.length > 0 && !device) {
      setDevice(deviceIds[0])
    }
  }, [deviceIds, device])

  const { data: allData, loading: rdgLoading } = useReadings(device, 200, 30000)
  const loading = devLoading || rdgLoading

  const rows = Array.isArray(allData) ? allData : (allData ? [allData] : [])

  const filtered = useMemo(() => {
    let d = [...rows]
    if (search) {
      const q = search.toLowerCase()
      d = d.filter(r =>
        String(r.temperature).includes(q) ||
        String(r.humidity).includes(q) ||
        String(r.id).includes(q)
      )
    }
    d.sort((a, b) => sortDir === 'desc'
      ? new Date(b.recorded_at) - new Date(a.recorded_at)
      : new Date(a.recorded_at) - new Date(b.recorded_at))
    return d
  }, [rows, search, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleExportCSV = () => {
    downloadCSV(filtered, `bioscope_${device}_${Date.now()}.csv`)
    addToast(t('history.exportedCsv', { count: filtered.length }), 'success')
  }
  const handleExportJSON = () => {
    downloadJSON(filtered, `bioscope_${device}_${Date.now()}.json`)
    addToast(t('history.exportedJson', { count: filtered.length }), 'success')
  }

  const tempColor = (v) => v > 30 ? 'red' : v < 20 ? 'amber' : 'green'
  const humColor = (v) => v > 75 ? 'red' : v < 30 ? 'amber' : 'cyan'

  if (devLoading) {
    return <div className={styles.page}><PageLoader /></div>
  }

  if (!devLoading && deviceIds.length === 0) {
    return (
      <div className={styles.page}>
        <EmptyState icon="📋" title={t('history.noDevices')} sub={t('history.noDevicesSub')} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <DeviceTabs devices={deviceIds} active={device} onChange={d => { setDevice(d); setPage(1) }} />

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder={t('history.searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className={styles.toolbarRight}>
          <button
            className={styles.sortBtn}
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          >
            {sortDir === 'desc' ? t('history.newestFirst') : t('history.oldestFirst')}
          </button>
          <Btn onClick={handleExportCSV} icon="⬇" variant="secondary">{t('history.csv')}</Btn>
          <Btn onClick={handleExportJSON} icon="⬇" variant="secondary">{t('history.json')}</Btn>
        </div>
      </div>

      <Card>
        <div className={styles.tableWrap}>
          {rdgLoading ? (
            <PageLoader />
          ) : paged.length === 0 ? (
            <EmptyState icon="📋" title={t('history.noReadings')} sub={search ? t('history.tryDifferentSearch') : t('history.dataWillAppear')} />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('history.tableId')}</th>
                  <th>{t('history.tableDevice')}</th>
                  <th>{t('history.tableTemp')}</th>
                  <th>{t('history.tableHum')}</th>
                  <th>{t('history.tableLight')}</th>
                  <th>{t('history.tableRecorded')}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={r.id || `reading-${i}`} className={`${styles.row} fade-in`} style={{ animationDelay: `${i * 0.02}s` }}>
                    <td className={styles.cellId}>#{r.id || 'N/A'}</td>
                    <td><Badge label={r.device_id} color="cyan" /></td>
                    <td>
                      <span className={styles.val} style={{ color: 'var(--red)' }}>{fmt(r.temperature)}°C</span>
                      <Badge label={r.temperature > 30 ? t('history.high') : r.temperature < 20 ? t('history.low') : t('history.ok')} color={tempColor(r.temperature)} />
                    </td>
                    <td>
                      <span className={styles.val} style={{ color: 'var(--cyan)' }}>{fmt(r.humidity)}%</span>
                      <Badge label={r.humidity > 75 ? t('history.high') : r.humidity < 30 ? t('history.low') : t('history.ok')} color={humColor(r.humidity)} />
                    </td>
                    <td><span className={styles.val} style={{ color: 'var(--amber)' }}>{fmt(r.light_level, 0)} lux</span></td>
                    <td className={styles.cellTime}>{fmtDateFull(r.recorded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!rdgLoading && filtered.length > PAGE_SIZE && (
          <div className={styles.pagination}>
            <span className={styles.paginInfo}>
              {t('history.showing', { start: ((page - 1) * PAGE_SIZE) + 1, end: Math.min(page * PAGE_SIZE, filtered.length), total: filtered.length })}
            </span>
            <div className={styles.paginBtns}>
              <button className={styles.paginBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t('history.prev')}</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                return (
                  <button key={p} className={`${styles.paginBtn} ${p === page ? styles.paginActive : ''}`} onClick={() => setPage(p)}>{p}</button>
                )
              })}
              <button className={styles.paginBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t('history.next')}</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
