import { Sun, Zap, BatteryCharging, House } from "lucide-react"
import type { ReactNode } from "react"

const VW = 320
const VH = 230

const HOUSE = { x: 160, y: 130 }
const SOLAR = { x: 160, y: 30 }
const GRID = { x: 40, y: 196 }
const BATTERY = { x: 280, y: 196 }

function FlowNode({
  cx,
  cy,
  color,
  icon,
  label,
  pct,
}: {
  cx: number
  cy: number
  color: string
  icon: ReactNode
  label: string
  pct: string
}) {
  return (
    <div
      className="absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: `${(cx / VW) * 100}%`, top: `${(cy / VH) * 100}%` }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full border"
        style={{ backgroundColor: "var(--color-card)", borderColor: color, color }}
      >
        {icon}
      </div>
      <span className="text-[11px] font-medium text-fg leading-none">{label}</span>
      <span className="text-[11px] font-bold leading-none" style={{ color }}>
        {pct}
      </span>
    </div>
  )
}

interface Props {
  solarPct?: number | null
  batteryPct?: number | null
  gridPct?: number | null
}

export function EnergyFlow({ solarPct, batteryPct, gridPct }: Props) {
  const f = (v?: number | null) => (v != null ? `${Math.round(v)}%` : "--")

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VW} / ${VH}` }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <line
          className="flow-line"
          x1={SOLAR.x}
          y1={SOLAR.y}
          x2={HOUSE.x}
          y2={HOUSE.y}
          stroke="var(--color-solar)"
          strokeWidth={2.5}
        />
        <line
          className="flow-line"
          x1={GRID.x}
          y1={GRID.y}
          x2={HOUSE.x}
          y2={HOUSE.y}
          stroke="var(--color-grid-energy)"
          strokeWidth={2.5}
        />
        <line
          className="flow-line"
          x1={BATTERY.x}
          y1={BATTERY.y}
          x2={HOUSE.x}
          y2={HOUSE.y}
          stroke="var(--color-battery)"
          strokeWidth={2.5}
        />
      </svg>

      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
        style={{ left: `${(HOUSE.x / VW) * 100}%`, top: `${(HOUSE.y / VH) * 100}%` }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border-2"
          style={{
            backgroundColor: "rgba(0,128,128,0.18)",
            borderColor: "var(--color-primary)",
            color: "var(--color-secondary)",
          }}
        >
          <House size={28} strokeWidth={2} />
        </div>
        <span className="text-[11px] font-semibold text-fg">Casa</span>
      </div>

      <FlowNode
        cx={SOLAR.x}
        cy={SOLAR.y}
        color="var(--color-solar)"
        icon={<Sun size={20} />}
        label="Solar"
        pct={f(solarPct)}
      />
      <FlowNode
        cx={GRID.x}
        cy={GRID.y}
        color="var(--color-grid-energy)"
        icon={<Zap size={20} />}
        label="Red"
        pct={f(gridPct)}
      />
      <FlowNode
        cx={BATTERY.x}
        cy={BATTERY.y}
        color="var(--color-battery)"
        icon={<BatteryCharging size={20} />}
        label="Batería"
        pct={f(batteryPct)}
      />
    </div>
  )
}
