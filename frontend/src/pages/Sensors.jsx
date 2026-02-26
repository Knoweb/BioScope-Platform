import { useState, useMemo, useEffect } from 'react'
import { useReadings, useChartData, useDevices } from '../hooks'
import { fmt, fmtTime, fmtDateTime, tempStatus, humStatus } from '../utils'
import { MetricCard, DeviceTabs, SectionHeader, Card, ChartTimeSelector, PageLoader, EmptyState } from '../components/UI'
import { TempHumChart, LightChart } from '../components/Charts'
import styles from './Sensors.module.css'

const TIME_OPTIONS = [
  { value: 'hour', label: '1H' },
  { value: 'day', label: '24H' },
]

export default function Sensors({ addToast }) {
  const { devices, loading: devLoading } = useDevices()
  const deviceIds = useMemo(() => devices.map(d => d.device_id), [devices])

  const [device, setDevice] = useState('')
  const [range, setRange] = useState('hour')

  // Auto-select the first device when loaded
  useEffect(() => {
    if (deviceIds.length > 0 && !device) {
      setDevice(deviceIds[0])
    }
  }, [deviceIds, device])

  const { data: latest, loading: latestLoading } = useReadings(device, 1, 15000)
  const { data: history, loading: histLoading } = useChartData(device, range)

  const chartData = useMemo(() => {
    if (!history || !history.length) return []
    return [...history].reverse().slice(-80).map(r => ({
      time: fmtTime(r.recorded_at),
      temperature: Number(r.temperature ?? 0),
      humidity: Number(r.humidity ?? 0),
      light: Number(r.light_level ?? 0),
    }))
  }, [history])

  if (devLoading) {
    return <div className={styles.page}><PageLoader /></div>
  }

  if (!devLoading && deviceIds.length === 0) {
    return (
      <div className={styles.page}>
        <EmptyState icon="📉" title="No devices found" sub="Please add a device from the devices page" />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <DeviceTabs devices={deviceIds} active={device} onChange={setDevice} />

      {/* Metric cards */}
      <div className={styles.metricGrid}>
        <MetricCard
          label="TEMPERATURE"
          value={latestLoading || latest?.temperature == null ? null : fmt(latest.temperature)}
          unit="°C"
          icon="🌡️"
          color="var(--red)"
          delay={0.05}
          loading={latestLoading}
          sub={latest?.temperature != null ? `Status: ${tempStatus(latest.temperature).toUpperCase()}` : null}
        />
        <MetricCard
          label="HUMIDITY"
          value={latestLoading || latest?.humidity == null ? null : fmt(latest.humidity)}
          unit="%"
          icon="💧"
          color="var(--cyan)"
          delay={0.10}
          loading={latestLoading}
          sub={latest?.humidity != null ? `Status: ${humStatus(latest.humidity).toUpperCase()}` : null}
        />
        <MetricCard
          label="LIGHT LEVEL"
          value={latestLoading || latest?.light_level == null ? null : fmt(latest.light_level, 0)}
          unit=" lux"
          icon="☀️"
          color="var(--amber)"
          delay={0.15}
          loading={latestLoading}
          sub={latest?.recorded_at ? `At ${fmtDateTime(latest.recorded_at)}` : null}
        />
      </div>

      {/* Temperature & Humidity chart */}
      <Card className={`${styles.chartCard} fade-up d4`}>
        <SectionHeader
          title="Temperature & Humidity"
          right={<ChartTimeSelector value={range} onChange={setRange} options={TIME_OPTIONS} />}
        />
        {histLoading ? (
          <PageLoader />
        ) : chartData.length === 0 ? (
          <EmptyState icon="📈" title="No data available" sub="Readings will appear once the device starts streaming" />
        ) : (
          <TempHumChart data={chartData} />
        )}
      </Card>

      {/* Light chart */}
      <Card className={`${styles.chartCard} fade-up d5`}>
        <SectionHeader title="Light Level" />
        {histLoading ? (
          <PageLoader />
        ) : chartData.length === 0 ? (
          <EmptyState icon="💡" title="No light data" />
        ) : (
          <LightChart data={chartData} />
        )}
      </Card>

      {/* Reading info */}
      {latest && (
        <Card className={`${styles.infoCard} fade-up d5`}>
          <SectionHeader title="Latest Reading Details" />
          <div className={styles.infoGrid}>
            {[
              { label: 'Device ID', value: latest.device_id },
              { label: 'Reading ID', value: latest.id || 'N/A' },
              { label: 'Temperature', value: `${fmt(latest.temperature)} °C` },
              { label: 'Humidity', value: `${fmt(latest.humidity)} %` },
              { label: 'Light Level', value: `${fmt(latest.light_level, 0)} lux` },
              { label: 'Recorded At', value: fmtDateTime(latest.recorded_at) },
            ].map(({ label, value }) => (
              <div key={label} className={styles.infoRow}>
                <span className={styles.infoLabel}>{label}</span>
                <span className={styles.infoValue}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
