"use client"

const W = 326
const H = 120

const ENERGY_COLORS = {
  solar: "#97c459",
  battery: "#5dcaa5",
  grid: "#94a3b8",
}

// ── Energy origin: horizontal bars with real current percentages ──────────────

interface EnergyOriginProps {
  solarPct?: number | null
  batteryPct?: number | null
  gridPct?: number | null
}

export function EnergyOriginChart({ solarPct, batteryPct, gridPct }: EnergyOriginProps) {
  const hasData = solarPct != null || batteryPct != null || gridPct != null
  const items = [
    { label: "Solar", pct: solarPct ?? 0, color: ENERGY_COLORS.solar },
    { label: "Batería", pct: batteryPct ?? 0, color: ENERGY_COLORS.battery },
    { label: "Red", pct: gridPct ?? 0, color: ENERGY_COLORS.grid },
  ]

  return (
    <div className="space-y-3">
      {items.map(({ label, pct, color }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-fg-muted">{label}</span>
            </div>
            <span className="font-semibold tabular-nums" style={{ color }}>
              {hasData ? `${Math.round(pct)}%` : "--"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-edge)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: hasData ? `${pct}%` : "0%", backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Temperature line chart ────────────────────────────────────────────────────

export interface TempPoint {
  label: string
  interior?: number | null
  exterior?: number | null
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-fg-muted">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  )
}

export function TempLineChart({ series = [] }: { series?: TempPoint[] }) {
  const interiorVals = series.map((p) => p.interior).filter((v): v is number => v != null)
  const exteriorVals = series.map((p) => p.exterior).filter((v): v is number => v != null)
  const allVals = [...interiorVals, ...exteriorVals]

  if (series.length < 2 || allVals.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height: H }}>
        <span className="text-sm text-fg-muted">Sin datos</span>
      </div>
    )
  }

  const min = Math.min(...allVals) - 1
  const max = Math.max(...allVals) + 1
  const n = series.length
  const stepX = W / (n - 1)
  const y = (v: number) => H - ((v - min) / (max - min)) * H

  const buildLine = (key: "interior" | "exterior") => {
    const pts = series
      .map((p, i) => ({ i, v: p[key] }))
      .filter((pt): pt is { i: number; v: number } => pt.v != null)
    if (pts.length < 2) return ""
    return pts
      .map((pt, j) => `${j === 0 ? "M" : "L"}${(pt.i * stepX).toFixed(1)},${y(pt.v).toFixed(1)}`)
      .join(" ")
  }

  const hasExterior = exteriorVals.length >= 2
  const firstLabel = series[0]?.label || "-1h"

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Temperatura interior y exterior"
      >
        {hasExterior && (
          <path
            d={buildLine("exterior")}
            fill="none"
            stroke="var(--color-danger)"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path
          d={buildLine("interior")}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] text-fg-subtle">
        <span>{firstLabel}</span>
        <span>Ahora</span>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs">
        <LegendDot color="var(--color-primary)" label="Interior" />
        {hasExterior && <LegendDot color="var(--color-danger)" label="Exterior" />}
      </div>
    </div>
  )
}

// ── Savings bar chart ─────────────────────────────────────────────────────────

export function SavingsBarChart({ bars }: { bars: number[] }) {
  if (!bars.length) return null
  const max = Math.max(...bars) * 1.1 || 1
  return (
    <div className="flex h-32 items-end justify-between gap-1.5">
      {bars.map((v, i) => {
        const isLast = i === bars.length - 1
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end">
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${(v / max) * 100}%`,
                backgroundColor: isLast ? "var(--color-secondary)" : "var(--color-primary)",
                opacity: isLast ? 1 : 0.55,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
