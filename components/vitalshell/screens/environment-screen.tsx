"use client"

import { Card, ScreenHeader, SectionLabel } from "@/components/vitalshell/primitives"
import { useVitalShell, type EnvCurrent, type ForecastPoint, type SensorVal } from "@/lib/vitalshell-context"
import { fmt } from "@/lib/api"

const STATUS_COLOR: Record<string, string> = {
  ok: "var(--color-ok)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
}

function statusColor(s?: string | null): string {
  return STATUS_COLOR[s ?? ""] ?? "var(--color-fg)"
}

function envRow(label: string, sv?: SensorVal, suffix = "") {
  if (!sv) return null
  const v = sv.value
  const value = v != null ? `${fmt(v, 1)} ${suffix}`.trim() : "--"
  return { label, value, color: statusColor(sv.status) }
}

function buildRows(current?: EnvCurrent) {
  if (!current) return []
  return [
    envRow("Temperatura exterior", current.ext_temperature, "°C"),
    envRow("Humedad exterior", current.ext_humidity, "%"),
    envRow("Viento", current.wind_kmh, "km/h"),
    envRow("Índice UV", current.uv_index),
    envRow("Renovables", current.renewables_pct, "%"),
    envRow("Riesgo incendio (FWI)", current.fire_risk_fwi),
    envRow("Balance hídrico", current.water_balance_mm, "mm"),
  ].filter(Boolean) as { label: string; value: string; color: string }[]
}

// WMO weather codes (Open-Meteo) → emoji
function weatherEmoji(code?: number | null): string {
  if (code == null) return "🌡️"
  if (code === 0) return "☀️"
  if (code <= 2) return "🌤️"
  if (code === 3) return "⛅"
  if (code <= 48) return "🌫️"
  if (code <= 55) return "🌦️"
  if (code <= 65) return "🌧️"
  if (code <= 77) return "❄️"
  if (code <= 82) return "🌧️"
  if (code <= 99) return "⛈️"
  return "🌡️"
}

function forecastHour(f: ForecastPoint): string {
  if (f.hour) return f.hour
  if (f.time) return f.time
  if (f.timestamp) return f.timestamp.slice(11, 16) // "2026-06-15T23:00" → "23:00"
  return ""
}

function Donut({ pct, color, label }: { pct: number | null; color: string; label: string }) {
  const R = 28
  const circ = 2 * Math.PI * R
  const fill = pct != null ? (Math.min(Math.max(pct, 0), 100) / 100) * circ : 0
  const display = pct != null ? `${Math.round(pct)}%` : "--"

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={72} height={72} viewBox="-36 -36 72 72" aria-hidden="true">
        <circle r={R} fill="none" stroke="var(--color-edge)" strokeWidth={8} />
        <circle
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90)"
        />
        <text textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="11" fontWeight="bold">
          {display}
        </text>
      </svg>
      <span className="text-center text-[11px] text-fg-muted">{label}</span>
    </div>
  )
}

export function EnvironmentScreen() {
  const { data } = useVitalShell()
  const current = data?.environmental_context?.current
  const forecast = data?.environmental_context?.forecast ?? []
  const airQuality = data?.air_quality
  const rows = buildRows(current)
  const renewablesPct = current?.renewables_pct?.value ?? null
  const co2GKwh = current?.co2_g_kwh?.value ?? null

  return (
    <div className="space-y-5">
      <ScreenHeader title="Entorno" subtitle="Barcelona" />

      <Card className="divide-y divide-edge p-0">
        {rows.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-fg-muted">{label}</span>
            <span className="text-sm font-semibold" style={{ color }}>{value}</span>
          </div>
        ))}
        {airQuality?.aqi && (
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-fg-muted">Calidad del aire (AQI)</span>
            <span className="text-sm font-semibold" style={{ color: statusColor(airQuality.aqi.status) }}>
              {airQuality.aqi.value != null ? String(airQuality.aqi.value) : "--"}
            </span>
          </div>
        )}
        {airQuality?.pm25 && (
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-fg-muted">PM2.5</span>
            <span className="text-sm font-semibold" style={{ color: statusColor(airQuality.pm25.status) }}>
              {airQuality.pm25.value != null ? `${fmt(airQuality.pm25.value, 1)} µg/m³` : "--"}
            </span>
          </div>
        )}
      </Card>

      <div className="flex justify-around px-4">
        <Donut pct={renewablesPct} color="var(--color-secondary)" label="Renovables" />
        <Donut
          pct={co2GKwh != null ? Math.min(co2GKwh / 5, 100) : null}
          color="var(--color-warning)"
          label={co2GKwh != null ? `CO₂ ${Math.round(co2GKwh)} g/kWh` : "CO₂ g/kWh"}
        />
      </div>

      {forecast.length > 0 && (
        <div>
          <SectionLabel>Previsión horaria</SectionLabel>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {forecast.map((f, i) => {
              const hour = forecastHour(f)
              const temp = f.temperature ?? f.temp
              const hum = f.humidity ?? f.hum
              const rain = f.precipitation_prob ?? f.rain
              const wind = f.wind_kmh ?? f.wind
              const emoji = f.emoji ?? weatherEmoji(f.weather_code)
              return (
                <div
                  key={`${hour}-${i}`}
                  className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-xl border bg-card p-3"
                  style={{ borderColor: i === 0 ? "var(--color-primary)" : "var(--color-edge)" }}
                >
                  <span className="text-xs font-medium text-fg-muted">{hour}</span>
                  <span className="text-xl leading-none" aria-hidden="true">{emoji}</span>
                  <span className="text-sm font-bold text-fg">
                    {temp != null ? `${Math.round(temp)}°` : "--"}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--color-water)" }}>
                    {hum != null ? `${Math.round(hum)}%` : "--"}
                  </span>
                  <span className="text-[10px] text-fg-muted">
                    {rain != null ? `${Math.round(rain)}%` : "--"}
                  </span>
                  <span className="text-[10px] text-fg-muted">
                    {wind != null ? `${Math.round(wind)}km/h` : "--"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
