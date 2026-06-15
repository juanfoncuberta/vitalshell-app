export const API_URL = process.env.NEXT_PUBLIC_API_URL!
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY!
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL!

// All HTTP calls go through this proxy so HTTPS pages can reach the HTTP backend
export const PROXY = "/api/proxy"

export function fmt(v: number | null | undefined, decimals?: number): string {
  if (v == null || (typeof v === "number" && isNaN(v))) return "--"
  return decimals != null ? v.toFixed(decimals) : String(v)
}

type TrendRaw = string | { pct?: number | null; direction?: string | null } | null | undefined

export function parseTrend(
  t: TrendRaw,
): { dir: "up" | "down"; text: string; good: boolean } | undefined {
  if (!t) return undefined
  if (typeof t === "string") return { dir: "up", text: t, good: true }
  const dir: "up" | "down" = t.direction === "down" ? "down" : "up"
  const pct = t.pct != null && !isNaN(t.pct) ? Math.abs(t.pct).toFixed(1) : null
  if (!pct) return undefined
  return { dir, text: `${pct}% vs mes anterior`, good: dir === "up" }
}
