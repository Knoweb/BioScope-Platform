import { useState, useMemo, useEffect } from 'react'
import { useReadings, useChartData, useDevices } from '../hooks'
import { fmt, fmtTime, fmtDateTime, tempStatus, humStatus } from '../utils'
import { MetricCard, DeviceTabs, SectionHeader, Card, ChartTimeSelector, PageLoader, EmptyState } from '../components/UI'
import { TempHumChart, LightChart } from '../components/Charts'
import { useTranslation } from 'react-i18next'
import styles from './Sensors.module.css'

const TIME_OPTIONS = [
  { value: 'hour', label: '1H' },
  { value: 'day', label: '24H' },
]

export default function Sensors({ addToast }) {
  const { t } = useTranslation()
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
        <EmptyState icon="📉" title={t('dashboard.noDevices')} sub={t('dashboard.noDevicesSub')} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <DeviceTabs devices={deviceIds} active={device} onChange={setDevice} />

      {/* Metric cards */}
      <div className={styles.metricGrid}>
        <MetricCard
          label={t('sensors.temperature')}
          value={latestLoading || latest?.temperature == null ? null : fmt(latest.temperature)}
          unit="°C"
          icon="🌡️"
          color="var(--red)"
          delay={0.05}
          loading={latestLoading}
          sub={latest?.temperature != null ? t('sensors.tempStatus', { status: tempStatus(latest.temperature).toUpperCase() }) : null}
        />
        <MetricCard
          label={t('sensors.humidity')}
          value={latestLoading || latest?.humidity == null ? null : fmt(latest.humidity)}
          unit="%"
          icon="💧"
          color="var(--cyan)"
          delay={0.10}
          loading={latestLoading}
          sub={latest?.humidity != null ? t('sensors.humStatus', { status: humStatus(latest.humidity).toUpperCase() }) : null}
        />
        <MetricCard
          label={t('sensors.lightLevel')}
          value={latestLoading || latest?.light_level == null ? null : fmt(latest.light_level, 0)}
          unit=" lux"
          icon="☀️"
          color="var(--amber)"
          delay={0.15}
          loading={latestLoading}
          sub={latest?.recorded_at ? t('sensors.atTime', { time: fmtDateTime(latest.recorded_at) }) : null}
        />
      </div>

      {/* Temperature & Humidity chart */}
      <Card className={`${styles.chartCard} fade-up d4`}>
        <SectionHeader
          title={t('sensors.tempHumChart')}
          right={<ChartTimeSelector value={range} onChange={setRange} options={TIME_OPTIONS} />}
        />
        {histLoading ? (
          <PageLoader />
        ) : chartData.length === 0 ? (
          <EmptyState icon="📈" title={t('sensors.noData')} sub={t('sensors.noDataSub')} />
        ) : (
          <TempHumChart data={chartData} />
        )}
      </Card>

      {/* Light chart */}
      <Card className={`${styles.chartCard} fade-up d5`}>
        <SectionHeader title={t('sensors.lightChart')} />
        {histLoading ? (
          <PageLoader />
        ) : chartData.length === 0 ? (
          <EmptyState icon="💡" title={t('sensors.noLightData')} />
        ) : (
          <LightChart data={chartData} />
        )}
      </Card>

      {/* Reading info */}
      {latest && (
        <Card className={`${styles.infoCard} fade-up d5`}>
          <SectionHeader title={t('sensors.latestReading')} />
          <div className={styles.infoGrid}>
            {[
              { label: t('sensors.deviceId'), value: latest.device_id },
              { label: t('sensors.readingId'), value: latest.id || 'N/A' },
              { label: t('sensors.temperatureInfo'), value: `${fmt(latest.temperature)} °C` },
              { label: t('sensors.humidityInfo'), value: `${fmt(latest.humidity)} %` },
              { label: t('sensors.lightLevelInfo'), value: `${fmt(latest.light_level, 0)} lux` },
              { label: t('sensors.recordedAt'), value: fmtDateTime(latest.recorded_at) },
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
