"use client"

import { Droplets, Zap } from "lucide-react"
import { Card, ProgressBar, SectionLabel, StatCard } from "@/components/vitalshell/primitives"
import { HeaderAvatar } from "@/components/vitalshell/avatar"
import { EnergyFlow } from "@/components/vitalshell/energy-flow"
import { useVitalShell, type Rule } from "@/lib/vitalshell-context"
import { fmt, parseTrend } from "@/lib/api"
import { ACTION_EMOJI, ACTION_ICON } from "@/components/vitalshell/screens/plans-screen"

function kwhTodaySimulated(): number {
  const now = new Date()
  const minOfDay = now.getHours() * 60 + now.getMinutes()
  return +((minOfDay / 1440) * 15.2).toFixed(1)
}

type StatStatus = "ok" | "warning" | "danger" | "neutral"
function apiStatus(s?: string | null): StatStatus {
  if (s === "ok" || s === "warning" || s === "danger") return s
  return "neutral"
}

function PlansRow({ rule }: { rule: Rule }) {
  const action = rule.action ?? ""
  const Icon = ACTION_ICON[action] ?? Zap
  const emoji = ACTION_EMOJI[action]
  const title = rule.description ?? action.replace(/_/g, " ")

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "var(--color-secondary)" }}
      >
        {emoji ?? <Icon size={14} />}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-fg">{title}</span>
    </div>
  )
}

function PlansCard({ rules }: { rules: Rule[] }) {
  if (rules.length === 0) return null
  const active = rules.filter((r) => r.status === "active" || !r.status)
  const preview = active.slice(0, 3)

  return (
    <Card className="space-y-1">
      <div className="flex items-center justify-between">
        <SectionLabel>Planes activos</SectionLabel>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: "rgba(0,128,128,0.2)", color: "var(--color-secondary)" }}
        >
          {active.length}
        </span>
      </div>
      <div className="divide-y divide-edge">
        {preview.map((rule) => (
          <PlansRow key={rule.id} rule={rule} />
        ))}
      </div>
      {active.length > 3 && (
        <p className="pt-1 text-[10px] text-fg-muted">+{active.length - 3} más en Planes</p>
      )}
    </Card>
  )
}

export function HomeScreen() {
  const { data, rules } = useVitalShell()
  const metrics = data?.calculated_metrics
  const sensors = data?.sensors
  const energy = metrics?.energy_source
  const waterPct = metrics?.water_level_pct?.value ?? null
  const waterDays = metrics?.water_autonomy_days?.value ?? null
  const comfortScore = metrics?.comfort_score?.value ?? null
  const savingsTrend = metrics?.savings_trend ?? null
  const kwhToday = kwhTodaySimulated()

  const interiorTemp = sensors?.temperature?.value ?? null
  const interiorTempStatus = apiStatus(sensors?.temperature?.status)
  const interiorHum = sensors?.humidity?.value ?? null
  const interiorHumStatus = apiStatus(sensors?.humidity?.status)

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-fg">VitalShell</h1>
          <p className="mt-0.5 text-sm text-fg-muted">Barcelona · Ahora</p>
        </div>
        <HeaderAvatar />
      </header>

      <Card>
        <SectionLabel>Flujo de energía</SectionLabel>
        <EnergyFlow
          solarPct={energy?.solar_pct}
          batteryPct={energy?.battery_pct}
          gridPct={energy?.grid_pct}
        />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Temperatura interior"
          value={interiorTemp != null ? fmt(interiorTemp, 1) : "--"}
          unit="°C"
          status={interiorTempStatus}
        />
        <StatCard
          label="Humedad interior"
          value={interiorHum != null ? fmt(interiorHum, 0) : "--"}
          unit="%"
          status={interiorHumStatus}
        />
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-fg">
            <Droplets size={18} style={{ color: "var(--color-water)" }} />
            Reserva de agua
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--color-water)" }}>
            {waterPct != null ? `${Math.round(waterPct)}%` : "--"}
          </span>
        </div>
        <ProgressBar value={waterPct ?? 0} />
        <p className="text-xs text-fg-muted">
          Autonomía: {waterDays != null ? `${fmt(waterDays, 0)} días` : "--"}
        </p>
      </Card>

      <PlansCard rules={rules} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Comfort score"
          value={comfortScore != null ? String(Math.round(comfortScore)) : "--"}
          unit="%"
          status="ok"
        />
        <StatCard
          label="kWh hoy"
          value={String(kwhToday)}
          unit="kWh"
          status="ok"
          trend={parseTrend(savingsTrend)}
        />
      </div>
    </div>
  )
}
