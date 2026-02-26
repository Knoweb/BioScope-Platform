import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-mid)',
      borderRadius: 8, padding: '10px 14px',
      fontFamily: 'var(--font-mono)', fontSize: 11, minWidth: 160
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 10 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color, marginBottom: 2 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 700 }}>{Number(p.value).toFixed(1)}{p.unit ?? ''}</span>
        </div>
      ))}
    </div>
  )
}

const GRID_PROPS = { strokeDasharray: '3 4', stroke: 'var(--border-subtle)', vertical: false }
const XAXIS_PROPS = {
  stroke: 'transparent', tick: { fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' },
  tickLine: false, interval: 'preserveStartEnd'
}
const YAXIS_PROPS = {
  stroke: 'transparent', tick: { fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' },
  tickLine: false, width: 36, axisLine: false
}

// ── TempHumChart ───────────────────────────────────────────────────────────
export function TempHumChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--red)"  stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--red)"  stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gHum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--cyan)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="time" {...XAXIS_PROPS} />
        <YAxis {...YAXIS_PROPS} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 12 }} />
        <ReferenceLine y={30} stroke="var(--red)" strokeDasharray="4 4" strokeOpacity={0.4} />
        <ReferenceLine y={20} stroke="var(--amber)" strokeDasharray="4 4" strokeOpacity={0.4} />
        <Area type="monotone" dataKey="temperature" name="Temp (°C)"  stroke="var(--red)"  fill="url(#gTemp)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--red)' }} />
        <Area type="monotone" dataKey="humidity"    name="Humidity (%)" stroke="var(--cyan)" fill="url(#gHum)"  strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--cyan)' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── LightChart ─────────────────────────────────────────────────────────────
export function LightChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--amber)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--amber)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="time" {...XAXIS_PROPS} />
        <YAxis {...YAXIS_PROPS} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="light" name="Light (lux)" stroke="var(--amber)" fill="url(#gLight)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--amber)' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── MultiDeviceChart ───────────────────────────────────────────────────────
export function MultiDeviceChart({ data, metric }) {
  const colors = { C1: 'var(--green)', C2: 'var(--cyan)' }
  const devices = Object.keys(colors)
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="time" {...XAXIS_PROPS} />
        <YAxis {...YAXIS_PROPS} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 12 }} />
        {devices.map(d => (
          <Line key={d} type="monotone" dataKey={`${d}_${metric}`} name={`${d} ${metric}`}
            stroke={colors[d]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
