"use client"

import { Wind, Zap, Droplet, BatteryCharging } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, InfoBanner, ScreenHeader } from "@/components/vitalshell/primitives"
import { useVitalShell, type Rule } from "@/lib/vitalshell-context"

type PlanStatus = "active" | "pending" | "completed" | "disabled"

export const ACTION_ICON: Record<string, LucideIcon> = {
  activate_ventilation: Wind,
  alert_low_water: Droplet,
  shift_load_to_now: Zap,
  activate_dehumidifier: Droplet,
  alert_low_battery: BatteryCharging,
}

export const ACTION_EMOJI: Record<string, string> = {
  activate_ventilation: "💨",
  alert_low_water: "💧",
  shift_load_to_now: "⚡",
  activate_dehumidifier: "💧",
  alert_low_battery: "🔋",
}

const STATUS_STYLE: Record<PlanStatus, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(0,128,128,0.2)", color: "var(--color-secondary)", label: "Activo" },
  pending: { bg: "rgba(102,178,178,0.15)", color: "#66b2b2", label: "Pendiente" },
  completed: { bg: "rgba(148,163,184,0.12)", color: "var(--color-fg-muted)", label: "Completado" },
  disabled: { bg: "rgba(226,75,74,0.15)", color: "var(--color-danger)", label: "Desactivado" },
}

function PlanBadge({ status }: { status: PlanStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

export function PlanCard({ rule }: { rule: Rule }) {
  const action = rule.action ?? ""
  const status = (rule.status ?? "pending") as PlanStatus
  const Icon = ACTION_ICON[action] ?? Zap
  const emoji = ACTION_EMOJI[action]
  const iconColor =
    status === "active"
      ? "var(--color-secondary)"
      : status === "disabled"
        ? "var(--color-danger)"
        : "#66b2b2"
  // description is the human-readable title; condition shows the trigger detail
  const title = rule.description ?? action.replace(/_/g, " ")
  const body = rule.condition

  return (
    <Card className="flex gap-3">
      <div
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", color: iconColor }}
      >
        {emoji ? <span>{emoji}</span> : <Icon size={20} />}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          <PlanBadge status={status} />
        </div>
        {body ? <p className="text-xs leading-relaxed text-fg-muted">{body}</p> : null}
      </div>
    </Card>
  )
}

export function PlansScreen() {
  const { rules } = useVitalShell()

  return (
    <div className="space-y-5">
      <ScreenHeader title="Planes VitalShell" subtitle="Decisiones activas del sistema" />

      <div className="space-y-3">
        {rules.length === 0 ? (
          <p className="px-1 text-sm text-fg-muted">Sin planes activos.</p>
        ) : (
          rules.map((rule) => <PlanCard key={rule.id} rule={rule} />)
        )}
      </div>

      <InfoBanner>
        VitalShell genera planes automáticamente basándose en datos en tiempo real.
      </InfoBanner>
    </div>
  )
}
