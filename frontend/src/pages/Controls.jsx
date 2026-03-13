import { useState, useEffect, useCallback, useMemo } from 'react'
import { useControls, useDevices, useAutomationRules } from '../hooks'
import { useSensorStatus } from '../hooks/useSensorStatus'
import { DeviceTabs, Card, Toggle, Badge, PageLoader, EmptyState, Btn } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { translateConditionText, translateActionText, translateRuleName } from '../utils'
import { api } from '../lib/api'
import styles from './Controls.module.css'

const DEVICE_INFO = {
  fan: { labelKey: 'controls.actuators.fan.label', icon: '🌀', color: 'var(--cyan)', exclusive: 'heater' },
  heater: { labelKey: 'controls.actuators.heater.label', icon: '🔥', color: 'var(--red)', exclusive: 'fan' },
  light: { labelKey: 'controls.actuators.light.label', icon: '💡', color: 'var(--amber)' },
}

// Evaluate a simple condition string against sensor readings
const evaluateCondition = (condition, reading) => {
  if (!reading || !condition) return false
  try {
    const m = condition.match(/^(\w+)\s*(>=|<=|>|<|==|!=)\s*(-?\d+\.?\d*)$/)
    if (!m) return false
    const actual = reading[m[1]]
    if (actual == null) return false
    const val = parseFloat(m[3])
    switch (m[2]) {
      case '>': return actual > val
      case '<': return actual < val
      case '>=': return actual >= val
      case '<=': return actual <= val
      case '==': return actual === val
      case '!=': return actual !== val
      default: return false
    }
  } catch { return false }
}

/* ── Sensor Metric Chips ─────────────────────────────────────────────────── */
function SensorMetrics({ reading, severity, minutesSince }) {
  const { t } = useTranslation()
  const metrics = reading ? [
    {
      label: t('sensors.temperature', 'TEMPERATURE'),
      value: reading.temperature != null ? `${reading.temperature.toFixed(1)}°C` : '—',
      tag: reading.temperature > 30 ? t('common.status.high', 'HIGH') : reading.temperature < 20 ? t('common.status.low', 'LOW') : null,
      warn: reading.temperature > 30 || reading.temperature < 20,
    },
    {
      label: t('sensors.humidity', 'HUMIDITY'),
      value: reading.humidity != null ? `${reading.humidity.toFixed(1)}%` : '—',
      tag: reading.humidity > 70 ? t('common.status.high', 'HIGH') : reading.humidity < 30 ? t('common.status.low', 'LOW') : null,
      warn: reading.humidity > 70 || reading.humidity < 30,
    },
    {
      label: t('sensors.lightLevel', 'LIGHT'),
      value: reading.light_level != null ? `${reading.light_level} lux` : '—',
      tag: reading.light_level > 4000 ? t('common.status.high', 'HIGH') : reading.light_level < 200 ? t('common.status.low', 'LOW') : null,
      warn: reading.light_level > 4000 || reading.light_level < 200,
    },
  ] : []

  const dotColor = severity === 'ok' ? 'var(--green)' : severity === 'warning' ? 'var(--amber)' : 'var(--red)'

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      {metrics.map(m => (
        <div key={m.label} style={{
          padding: '10px 16px', borderRadius: '8px',
          background: m.warn ? 'rgba(255,60,60,0.1)' : 'var(--bg-card)',
          border: `1px solid ${m.warn ? 'var(--red)' : 'var(--border-subtle)'}`,
          minWidth: 90,
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: m.warn ? 'var(--red)' : 'var(--text-main)', lineHeight: 1.2 }}>{m.value}</div>
          {m.tag && <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--red)', marginTop: 2 }}>{m.tag}</div>}
        </div>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: dotColor }}>
          {severity === 'ok' ? t('controls.live', 'LIVE') : severity === 'warning' ? t('controls.delayed', { minutes: minutesSince, defaultValue: `DELAYED (${minutesSince}m)` }) : t('dashboard.offline', 'OFFLINE')}
        </span>
      </div>
    </div>
  )
}

/* ── Slot Card ─────────────────────────────────────────────────────────────── */
function SlotCard({ slotNum, assignedDevice, onDeviceChange, isOn, isLoading, onToggle,
  isManual, automationRules, reading, otherSlotDevice, isBlocked, toggleDisabled }) {
  const { t } = useTranslation()
  const info = DEVICE_INFO[assignedDevice] || DEVICE_INFO.fan
  const allDevices = Object.keys(DEVICE_INFO) // always show all 3 pills

  const matchedRule = useMemo(() => {
    if (!automationRules || !reading) return null
    const prefix = assignedDevice + ':'
    return automationRules
      .filter(r => r.is_active && r.action?.startsWith(prefix))
      .sort((a, b) => (a.priority || 10) - (b.priority || 10))
      .find(r => evaluateCondition(r.trigger_condition, reading)) || null
  }, [automationRules, reading, assignedDevice])

  const autoDecisionText = matchedRule
    ? t('controls.autoDecisionMatched', {
      state: matchedRule.action?.split(':')[1]?.toLowerCase() === 'on' ? t('controls.on', 'ON') : t('controls.off', 'OFF'),
      action: translateActionText(matchedRule.action, t),
      defaultValue: `Turn ${matchedRule.action?.split(':')[1]?.toUpperCase()} (${matchedRule.action} rule matched)`
    })
    : t('controls.autoDecisionNoMatch', { state: isOn ? t('controls.on', 'ON') : t('controls.off', 'OFF'), defaultValue: `${isOn ? 'ON' : 'OFF'} (no rule matched)` })

  return (
    <Card className={`fade-up d${slotNum}`} style={{
      '--a-color': info.color,
      borderTop: `3px solid ${isOn ? info.color : 'var(--border-subtle)'}`,
      transition: 'border-color 0.3s',
      padding: '1.25rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
          {t('controls.actuatorSlot', 'Actuator Slot')} {slotNum}
        </span>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
          background: isOn ? `${info.color}22` : 'var(--bg-main)',
          color: isOn ? info.color : 'var(--text-muted)',
          border: `1px solid ${isOn ? info.color : 'var(--border-subtle)'}`,
          transition: 'all 0.3s'
        }}>
          {isOn ? `● ${t('controls.on', 'ON')}` : `○ ${t('controls.off', 'OFF')}`}
        </div>
      </div>

      {/* Device name + icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
        <span style={{ fontSize: '1.6rem' }}>{info.icon}</span>
        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: info.color }}>{t(info.labelKey)}</span>
      </div>
      {info.exclusive && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {t('controls.inverseOf', 'Inverse of')} {t(DEVICE_INFO[info.exclusive]?.labelKey, { defaultValue: info.exclusive })}
        </div>
      )}

      {/* Device selector pills */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          {t('controls.pluggedInDevice', 'Plugged-in device:')}
        </div>
        <div className={styles.slotPillRow} style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {allDevices.map(key => {
            const d = DEVICE_INFO[key]
            const selected = key === assignedDevice
            const takenByOther = key === otherSlotDevice
            return (
              <button
                key={key}
                onClick={() => !takenByOther && onDeviceChange(slotNum, key)}
                title={takenByOther ? t('controls.alreadyAssignedToSlot', { slot: slotNum === 1 ? 2 : 1, defaultValue: `Already assigned to Slot ${slotNum === 1 ? 2 : 1}` }) : ''}
                style={{
                  padding: '5px 13px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 600,
                  cursor: takenByOther ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  background: selected ? 'transparent' : 'transparent',
                  color: selected ? d.color : takenByOther ? 'var(--text-dim)' : 'var(--text-muted)',
                  border: `1.5px solid ${selected ? d.color : takenByOther ? 'var(--border-subtle)' : 'var(--border-subtle)'}`,
                  opacity: takenByOther ? 0.35 : 1,
                }}>
                {d.icon} {t(d.labelKey)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mutual exclusion warning */}
      {isBlocked && (
        <div style={{
          fontSize: '0.78rem', color: 'var(--red)', background: 'rgba(255,60,60,0.08)',
          borderRadius: '6px', padding: '6px 10px', marginBottom: '0.75rem',
        }}>
          {t('controls.blockedExclusive', { device: t(DEVICE_INFO[info.exclusive]?.labelKey), on: t('controls.on', 'ON'), defaultValue: `⚠️ Blocked — ${t(DEVICE_INFO[info.exclusive]?.labelKey)} is ON (mutually exclusive)` })}
        </div>
      )}

      {/* Manual control is always available (AUTO and MANUAL modes) */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)'
      }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('controls.manualState', 'Manual State')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Toggle on={isOn} loading={isLoading} onChange={onToggle} disabled={toggleDisabled || isBlocked} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 26, color: isOn ? info.color : 'var(--text-muted)' }}>
            {isOn ? t('controls.on', 'ON') : t('controls.off', 'OFF')}
          </span>
        </div>
      </div>

      {!isManual && (
        <div style={{
          borderRadius: '8px', padding: '0.75rem 1rem',
          background: 'var(--bg-main)', border: '1px solid var(--border-subtle)',
          marginTop: '0.5rem'
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
            {t('controls.automationDecision', 'Automation decision:')}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: matchedRule ? info.color : 'var(--text-muted)' }}>
            {autoDecisionText}
          </div>
        </div>
      )}
    </Card>
  )
}

/* ── Main Controls Page ────────────────────────────────────────────────────── */
export default function Controls({ addToast }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const userRole = user?.user_metadata?.role || 'viewer'
  const isAdminOrOwner = ['admin', 'owner', 'operator', 'user'].includes(userRole)

  const { devices, loading: devLoading, updateDeviceMode } = useDevices()
  const parents = useMemo(() => devices.filter(d => d.type === 'parent'), [devices])
  const parentIds = useMemo(() => parents.map(p => p.device_id), [parents])

  const [device, setDevice] = useState('')
  useEffect(() => { if (parentIds.length > 0 && !device) setDevice(parentIds[0]) }, [parentIds, device])

  const { controls, allActuators, loading: ctrlLoading, updating, toggle, refetch: refetchControls } = useControls()
  const { rules: automationRules, loading: rulesLoading, updateRule } = useAutomationRules(device)
  const sensorStatus = useSensorStatus(device)

  // Slot assignment state
  const [slots, setSlots] = useState({ slot_1_device: 'fan', slot_2_device: 'light' })
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [lastReason, setLastReason] = useState('')
  const [autoEvalRunning, setAutoEvalRunning] = useState(false)

  // Fetch slot assignment (backend first, localStorage as fallback)
  useEffect(() => {
    if (!device) return
    api.get(`/devices/${device}/slots`).then(r => {
      if (r?.data) {
        setSlots(r.data)
        localStorage.setItem(`bioscope_slots_${device}`, JSON.stringify(r.data))
      }
    }).catch(() => {
      const cached = localStorage.getItem(`bioscope_slots_${device}`)
      if (cached) try { setSlots(JSON.parse(cached)) } catch {}
    })
  }, [device])

  // Fetch latest control state (for auto mode display)
  useEffect(() => {
    if (!device) return
    api.get(`/devices/${device}/latest-state`).then(r => {
      if (r.data?.triggered_by) setLastReason(r.data.triggered_by)
    }).catch(() => { })
  }, [device])

  const dObj = parents.find(p => p.device_id === device)
  const isManual = dObj?.control_mode === 'manual'
  const ctrl = controls[device] ?? {}

  // Auto-evaluation cycle (every 30s in AUTO mode)
  useEffect(() => {
    if (!device || isManual) return
    const runEval = async () => {
      if (autoEvalRunning) return
      setAutoEvalRunning(true)
      try {
        const r = await api.post(`/automation/evaluate/${device}`)
        if (r.data?.resolved) {
          const res = r.data.resolved
          setLastReason(`fan:${res.fan} heater:${res.heater} light:${res.light}`)
          refetchControls() // sync actuator ON/OFF state immediately after automation
        }
      } catch (e) { /* silent */ }
      finally { setAutoEvalRunning(false) }
    }
    runEval()
    const timer = setInterval(runEval, 30_000)
    return () => clearInterval(timer)
  }, [device, isManual])

  const handleToggle = async (field) => {
    const { success, newVal, error } = await toggle(device, field)
    if (success) addToast(t('controls.toggleSuccess', { device: t(DEVICE_INFO[field]?.labelKey, { defaultValue: field }), state: newVal ? t('controls.on', 'ON') : t('controls.off', 'OFF'), defaultValue: `${field.charAt(0).toUpperCase() + field.slice(1)} ${newVal ? 'ON' : 'OFF'}` }), 'success')
    else addToast(error || t('controls.controlFailed', 'Control failed'), 'error')
  }

  const handleSlotChange = async (slotNum, newDevice) => {
    const key = `slot_${slotNum}_device`
    const other = slotNum === 1 ? slots.slot_2_device : slots.slot_1_device
    if (newDevice === other) { addToast(t('controls.cannotAssignSame', 'Cannot assign same device to both slots'), 'error'); return }
    const newSlots = { ...slots, [key]: newDevice }
    // Optimistic update + localStorage persistence (works even if API fails)
    setSlots(newSlots)
    localStorage.setItem(`bioscope_slots_${device}`, JSON.stringify(newSlots))
    setSlotsLoading(true)
    try {
      await api.patch(`/devices/${device}/slots`, { slot_1_device: newSlots.slot_1_device, slot_2_device: newSlots.slot_2_device })
    } catch { /* silently ignore — state already updated locally */ }
    finally {
      addToast(t('controls.slotAssigned', { slot: slotNum, device: t(DEVICE_INFO[newDevice]?.labelKey), defaultValue: `Slot ${slotNum} → ${t(DEVICE_INFO[newDevice]?.labelKey)}` }), 'success')
      setSlotsLoading(false)
    }
  }

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editPriority, setEditPriority] = useState(10)
  const [savingRule, setSavingRule] = useState(false)

  const openModal = r => { setEditingRule(r); setEditValue(r.trigger_condition); setEditPriority(r.priority || 10); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingRule(null) }

  const handleSaveRule = async (e) => {
    e.preventDefault(); setSavingRule(true)
    try {
      await updateRule(editingRule.rule_id, { trigger_condition: editValue, priority: editPriority })
      addToast(t('controls.ruleUpdated', 'Rule updated'), 'success'); closeModal()
    } catch (err) { addToast(t('controls.failedWithReason', { reason: err.message, defaultValue: `Failed: ${err.message}` }), 'error') }
    finally { setSavingRule(false) }
  }

  const switchMode = async (newMode) => {
    const { success, error } = await updateDeviceMode(device, newMode)
    if (success) addToast(t('controls.switchedToMode', { mode: newMode.toUpperCase(), defaultValue: `Switched to ${newMode.toUpperCase()}` }), 'success')
    else addToast(t('controls.failedWithReason', { reason: error, defaultValue: `Failed: ${error}` }), 'error')
  }

  const assignedDevices = [slots.slot_1_device, slots.slot_2_device].filter(Boolean)
  const unassignedDevices = Object.keys(DEVICE_INFO).filter(d => !assignedDevices.includes(d))

  if (devLoading) return <div className={styles.page}><PageLoader /></div>
  if (!devLoading && parentIds.length === 0) {
    return <div className={styles.page}><EmptyState title={t('controls.noParentUnits', 'No Parent Units')} sub={t('controls.noParentUnitsSub', 'Actuators can only be controlled on parent units.')} /></div>
  }


  return (
    <div className={styles.page}>
      <DeviceTabs devices={parents} active={device} onChange={setDevice} />

      {/* Offline Banner */}
      {sensorStatus.severity === 'offline' && (
        <div style={{
          background: 'rgba(255,60,60,0.12)', border: '1px solid var(--red)',
          borderRadius: '8px', padding: '0.75rem 1.25rem',
          color: 'var(--red)', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'center'
        }}>
          {t('controls.sensorOfflineBanner', { minutes: sensorStatus.minutesSince, defaultValue: `🔴 Sensor Offline — last reading ${sensorStatus.minutesSince} min ago. Manual control is still available.` })}
        </div>
      )}

      {/* Sensor Metric Chips */}
      <SensorMetrics
        reading={sensorStatus.reading}
        severity={sensorStatus.severity}
        minutesSince={sensorStatus.minutesSince}
      />

      {/* Control Mode Pill Selector */}
      <Card className="fade-up d1" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('controls.controlMode', 'Control Mode')}</span>
          <div className={styles.modeBtnRow} style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              onClick={() => switchMode('auto')}
              disabled={false}
              title=""
              style={{
                padding: '5px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                background: !isManual ? 'var(--cyan)' : 'transparent',
                color: !isManual ? '#fff' : 'var(--text-muted)',
                border: `1.5px solid ${!isManual ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                transition: 'all 0.2s', opacity: 1,
              }}>
              ⚡ {t('controls.modeAuto', 'AUTO')}
            </button>
            <button
              onClick={() => switchMode('manual')}
              disabled={false}
              style={{
                padding: '5px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                background: isManual ? 'var(--amber)' : 'transparent',
                color: isManual ? '#fff' : 'var(--text-muted)',
                border: `1.5px solid ${isManual ? 'var(--amber)' : 'var(--border-subtle)'}`,
                transition: 'all 0.2s',
              }}>
              🔥 {t('controls.modeManual', 'MANUAL')}
            </button>
          </div>
          {!isManual && autoEvalRunning && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('controls.evaluating', 'evaluating…')}</span>
          )}
        </div>
        {!isManual && (
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('controls.automationControlling', 'Automation rules are controlling actuators')}</span>
        )}
      </Card>

      {/* Two Slot Cards */}
      <div className={styles.controlGridGrouped}>
        {[1, 2].map(slotNum => {
          const slotKey = `slot_${slotNum}_device`
          const assigned = slots[slotKey] || (slotNum === 1 ? 'fan' : 'light')
          const otherKey = `slot_${slotNum === 1 ? 2 : 1}_device`
          const otherDev = slots[otherKey] || (slotNum === 1 ? 'light' : 'fan')
          const isOn = !!ctrl[assigned]
          const isLoading = updating === `${device}.${assigned}`
          const info = DEVICE_INFO[assigned]
          const isBlocked = !isOn && info?.exclusive && ctrl[info.exclusive]
          return (
            <SlotCard
              key={slotNum}
              slotNum={slotNum}
              assignedDevice={assigned}
              onDeviceChange={handleSlotChange}
              isOn={isOn}
              isLoading={isLoading}
              onToggle={() => handleToggle(assigned)}
              isManual={isManual}
              automationRules={automationRules}
              reading={sensorStatus.reading}
              otherSlotDevice={otherDev}
              isBlocked={!!isBlocked}
              toggleDisabled={!isAdminOrOwner}
            />
          )
        })}
      </div>

      {/* Unassigned device warnings */}
      {unassignedDevices.map(d => {
        const isStuckOn = !!ctrl[d]
        return (
          <div key={d} style={{
            background: isStuckOn ? 'rgba(255,60,60,0.1)' : 'rgba(255,160,0,0.08)',
            border: `1px solid ${isStuckOn ? 'var(--red)' : 'var(--amber)'}`,
            borderRadius: '8px', padding: '0.75rem 1.25rem',
            display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap'
          }}>
            <span style={{ color: isStuckOn ? 'var(--red)' : 'var(--amber)', fontWeight: 600, fontSize: '0.88rem', flex: 1 }}>
              {isStuckOn
                ? t('controls.unassignedOnWarning', { device: t(DEVICE_INFO[d]?.labelKey), on: t('controls.on', 'ON'), defaultValue: `⚠ ${t(DEVICE_INFO[d]?.labelKey)} is ON but not assigned to any slot — it is blocking other actuators!` })
                : t('controls.unassignedWarning', { device: t(DEVICE_INFO[d]?.labelKey), defaultValue: `⚠ ${t(DEVICE_INFO[d]?.labelKey)} not assigned to any slot — it won't be controlled.` })}
            </span>
            {isStuckOn && (
              <button
                onClick={async () => {
                  const { success, error } = await toggle(device, d)
                  if (success) addToast(t('controls.deviceTurnedOff', { device: t(DEVICE_INFO[d]?.labelKey), off: t('controls.off', 'OFF'), defaultValue: `${t(DEVICE_INFO[d]?.labelKey)} turned OFF` }), 'success')
                  else addToast(error || t('controls.failedTurnOff', 'Failed to turn off'), 'error')
                }}
                style={{
                  padding: '4px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem',
                  background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer',
                }}>
                {t('controls.turnOff', 'Turn OFF')}
              </button>
            )}
          </div>
        )
      })}

      {/* Automation Rules */}
      <Card className="fade-up d4">
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
          {t('controls.activeAutomationRules', 'Active Automation Rules')}
        </div>
        {rulesLoading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('controls.loadingRules', 'Loading rules...')}</div>
        ) : automationRules.length === 0 ? (
          <EmptyState icon="⚙️" title={t('controls.noRules', 'No automation rules')} sub={t('controls.createRule', 'Create a rule to automate hardware controls')} />
        ) : (
          <>
            <div className={styles.ruleList}>
              {automationRules.map(r => {
                const matched = r.is_active && evaluateCondition(r.trigger_condition, sensorStatus.reading)
                return (
                  <div key={r.rule_id} className={styles.ruleRow}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--text-main)', flex: 1 }}>
                      {translateConditionText(r.trigger_condition, t)}
                    </span>
                    <span style={{ color: 'var(--text-dim)', margin: '0 10px', fontSize: '0.9rem' }}>—</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--cyan)', marginRight: 8 }}>
                      {translateActionText(r.action, t)}
                    </span>
                    {matched && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ {t('controls.matched', 'matched')}</span>
                    )}
                    {isAdminOrOwner && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 12 }}>
                        <button onClick={() => updateRule(r.rule_id, { is_active: !r.is_active })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <Badge label={r.is_active ? t('controls.active', 'ACTIVE') : t('controls.off', 'OFF')} color={r.is_active ? 'green' : 'muted'} />
                        </button>
                        <Btn variant="secondary" onClick={() => openModal(r)}>{t('controls.edit', 'Edit')}</Btn>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              {t('controls.mutualExclusiveNote', '🔒 Fan and Heater are mutually exclusive — if both rules match, Fan takes priority.')}
            </div>
          </>
        )}
      </Card>

      {/* Edit Rule Modal */}
      {modalOpen && isAdminOrOwner && editingRule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '420px', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{t('controls.editThresholdTitle', 'Edit Automation Threshold')}</h2>
            <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <div><strong>{t('controls.rule', 'Rule')}:</strong> {translateRuleName(editingRule.name, t)}</div>
              <div><strong>{t('controls.action', 'Action')}:</strong> {translateActionText(editingRule.action, t)}</div>
            </div>
            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('controls.triggerCondition', 'Trigger Condition')}</label>
                <input required type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                  placeholder={t('controls.triggerPlaceholder', 'e.g. temperature > 30')} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('controls.priority', 'Priority (1 = highest)')}</label>
                <input required type="number" min="1" max="100" value={editPriority} onChange={e => setEditPriority(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <Btn variant="secondary" onClick={closeModal} type="button">{t('controls.cancel', 'Cancel')}</Btn>
                <Btn variant="primary" loading={savingRule} type="submit">{t('controls.updateRuleBtn', 'Update Rule')}</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
