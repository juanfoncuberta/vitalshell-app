"use client"

import { Leaf } from "lucide-react"
import { Card, ScreenHeader, SectionLabel, StatCard } from "@/components/vitalshell/primitives"
import { SavingsBarChart } from "@/components/vitalshell/charts"
import { useVitalShell } from "@/lib/vitalshell-context"
import { fmt, parseTrend } from "@/lib/api"

function kwhTodaySimulated(): number {
  const now = new Date()
  const minOfDay = now.getHours() * 60 + now.getMinutes()
  return +((minOfDay / 1440) * 15.2).toFixed(1)
}

function savingsBarsForMonth(): number[] {
  const now = new Date()
  const dayOfMonth = now.getDate()
  const minOfDay = now.getHours() * 60 + now.getMinutes()
  const todayFraction = minOfDay / 1440
  // Fallback to midday if it's very early (avoids flat chart at midnight)
  const effectiveFraction = Math.max(todayFraction, 0.1)
  const dailyTarget = 15.2

  let accumulated = 0
  // Use month + day as a stable seed so variance doesn't change on re-render
  const month = now.getMonth()
  return Array.from({ length: dayOfMonth }, (_, i) => {
    const isToday = i === dayOfMonth - 1
    const fraction = isToday ? effectiveFraction : 1
    // Realistic daily variance: sun position, cloud cover, etc.
    const variance = 0.72 + 0.45 * Math.abs(Math.sin(i * 1.9 + month * 0.4))
    accumulated += +(dailyTarget * variance * fraction).toFixed(2)
    return +accumulated.toFixed(1)
  })
}

export function SavingsScreen() {
  const { data } = useVitalShell()
  const envCurrent = data?.environmental_context?.current
  const metrics = data?.calculated_metrics

  const kwhToday = kwhTodaySimulated()
  const dayOfMonth = new Date().getDate()
  const kwhMonth = +(kwhToday * dayOfMonth).toFixed(0)

  const co2Factor = envCurrent?.co2_g_kwh?.value ?? 220
  const co2Avoided = +(kwhToday * co2Factor / 1000).toFixed(2)

  const renewablesPct = envCurrent?.renewables_pct?.value ?? null
  const waterPct = metrics?.water_level_pct?.value ?? null
  const waterCaptured = waterPct != null ? Math.round(waterPct * 5) : null
  const waterDays = metrics?.water_autonomy_days?.value ?? null
  const savingsTrend = metrics?.savings_trend ?? null

  const bars = savingsBarsForMonth()

  return (
    <div className="space-y-5">
      <ScreenHeader title="Ahorros" subtitle="Tu impacto en números" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="kWh hoy"
          value={String(kwhToday)}
          unit="kWh"
          status="ok"
          trend={parseTrend(savingsTrend)}
        />
        <StatCard
          label="kWh este mes"
          value={String(kwhMonth)}
          unit="kWh"
          status="ok"
        />
        <StatCard
          label="CO₂ evitado"
          value={fmt(co2Avoided, 2)}
          unit="kg"
          status="ok"
        />
        <StatCard
          label="Energía renovable"
          value={renewablesPct != null ? String(Math.round(renewablesPct)) : "--"}
          unit="%"
          status="ok"
        />
        <StatCard
          label="Agua captada"
          value={waterCaptured != null ? String(waterCaptured) : "--"}
          unit="L"
          status="neutral"
        />
        <StatCard
          label="Autonomía hídrica"
          value={waterDays != null ? fmt(waterDays, 0) : "--"}
          unit="días"
          status="neutral"
        />
      </div>

      <Card>
        <SectionLabel>kWh acumulados este mes</SectionLabel>
        <SavingsBarChart bars={bars} />
        <div className="mt-2 flex justify-between text-[10px] text-fg-subtle">
          <span>Día 1</span>
          <span>Hoy</span>
        </div>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <Leaf size={18} style={{ color: "var(--color-secondary)" }} />
          <span className="text-sm font-semibold text-fg">
            {renewablesPct != null ? `${Math.round(renewablesPct)}% renovables` : "Mix eléctrico: favorable"}
          </span>
        </div>
        {renewablesPct != null && (
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <span className="font-semibold text-fg">{Math.round(renewablesPct)}% renovables</span>
            <span>·</span>
            <span style={{ color: "var(--color-secondary)" }}>ventana baja emisión</span>
          </div>
        )}
        <p className="text-xs text-fg-muted">VitalShell optimizando consumo en tiempo real.</p>
      </Card>
    </div>
  )
}
