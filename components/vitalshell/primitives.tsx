import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { HeaderAvatar } from "@/components/vitalshell/avatar"

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-edge bg-card p-4", className)}>{children}</div>
  )
}

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-1">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-fg text-balance">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p> : null}
      </div>
      <HeaderAvatar />
    </header>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">
      {children}
    </h2>
  )
}

type StatStatus = "ok" | "warning" | "danger" | "neutral"

const statusColor: Record<StatStatus, string> = {
  ok: "var(--color-ok)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  neutral: "var(--color-fg)",
}

export function StatCard({
  label,
  value,
  unit,
  status = "neutral",
  trend,
  icon,
}: {
  label: string
  value: string
  unit?: string
  status?: StatStatus
  trend?: { dir: "up" | "down"; text: string; good?: boolean }
  icon?: ReactNode
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-fg-muted">{label}</span>
        {icon ? <span className="text-fg-muted">{icon}</span> : null}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color: statusColor[status] }}>
          {value}
        </span>
        {unit ? <span className="text-sm text-fg-muted">{unit}</span> : null}
      </div>
      {trend ? (
        <span
          className="text-xs font-medium"
          style={{ color: trend.good ?? trend.dir === "up" ? "var(--color-ok)" : "var(--color-danger)" }}
        >
          {trend.dir === "up" ? "↑" : "↓"} {trend.text}
        </span>
      ) : null}
    </Card>
  )
}

export function ProgressBar({
  value,
  color = "var(--color-water)",
}: {
  value: number
  color?: string
}) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-edge">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  )
}

export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-xl border p-3.5 text-sm leading-relaxed"
      style={{
        backgroundColor: "rgba(0, 128, 128, 0.14)",
        borderColor: "rgba(0, 128, 128, 0.4)",
        color: "var(--color-fg)",
      }}
    >
      {children}
    </div>
  )
}
