import { useState, useMemo } from 'react'
import { useReadings } from '../hooks'
import { DEVICES, fmt, fmtDateFull, downloadCSV, downloadJSON } from '../utils'
import { DeviceTabs, SectionHeader, Card, Badge, Btn, EmptyState, PageLoader } from '../components/UI'
import styles from './History.module.css'

const PAGE_SIZE = 20

export default function History({ addToast }) {
  const [device, setDevice] = useState('C1')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  const { data: allData, loading } = useReadings(device, 200, 30000)
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
    addToast(`Exported ${filtered.length} rows as CSV`, 'success')
  }
  const handleExportJSON = () => {
    downloadJSON(filtered, `bioscope_${device}_${Date.now()}.json`)
    addToast(`Exported ${filtered.length} rows as JSON`, 'success')
  }

  const tempColor = (v) => v > 30 ? 'red' : v < 20 ? 'amber' : 'green'
  const humColor  = (v) => v > 75 ? 'red' : v < 30 ? 'amber' : 'cyan'

  return (
    <div className={styles.page}>
      <DeviceTabs devices={DEVICES} active={device} onChange={d => { setDevice(d); setPage(1) }} />

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search readings..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className={styles.toolbarRight}>
          <button
            className={styles.sortBtn}
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          >
            {sortDir === 'desc' ? '↓ Newest first' : '↑ Oldest first'}
          </button>
          <Btn onClick={handleExportCSV} icon="⬇" variant="secondary">CSV</Btn>
          <Btn onClick={handleExportJSON} icon="⬇" variant="secondary">JSON</Btn>
        </div>
      </div>

      <Card>
        <div className={styles.tableWrap}>
          {loading ? (
            <PageLoader />
          ) : paged.length === 0 ? (
            <EmptyState icon="📋" title="No readings found" sub={search ? 'Try a different search term' : 'Data will appear once the device streams readings'} />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>DEVICE</th>
                  <th>TEMPERATURE</th>
                  <th>HUMIDITY</th>
                  <th>LIGHT LEVEL</th>
                  <th>RECORDED AT</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={r.id} className={`${styles.row} fade-in`} style={{ animationDelay: `${i * 0.02}s` }}>
                    <td className={styles.cellId}>#{r.id}</td>
                    <td><Badge label={r.device_id} color="cyan" /></td>
                    <td>
                      <span className={styles.val} style={{ color: 'var(--red)' }}>{fmt(r.temperature)}°C</span>
                      <Badge label={r.temperature > 30 ? 'HIGH' : r.temperature < 20 ? 'LOW' : 'OK'} color={tempColor(r.temperature)} />
                    </td>
                    <td>
                      <span className={styles.val} style={{ color: 'var(--cyan)' }}>{fmt(r.humidity)}%</span>
                      <Badge label={r.humidity > 75 ? 'HIGH' : r.humidity < 30 ? 'LOW' : 'OK'} color={humColor(r.humidity)} />
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
        {!loading && filtered.length > PAGE_SIZE && (
          <div className={styles.pagination}>
            <span className={styles.paginInfo}>
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className={styles.paginBtns}>
              <button className={styles.paginBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                return (
                  <button key={p} className={`${styles.paginBtn} ${p === page ? styles.paginActive : ''}`} onClick={() => setPage(p)}>{p}</button>
                )
              })}
              <button className={styles.paginBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
