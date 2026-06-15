"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { API_KEY, PROXY, WS_URL } from "./api"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SensorVal {
  value?: number | null
  unit?: string
  status?: "ok" | "warning" | "danger"
}

export interface EnergySource {
  solar_pct?: number | null
  battery_pct?: number | null
  grid_pct?: number | null
}

export interface CalculatedMetrics {
  energy_source?: EnergySource
  water_level_pct?: SensorVal
  water_autonomy_days?: SensorVal
  comfort_score?: SensorVal
  savings_trend?: string | { pct?: number | null; direction?: string | null } | null
  savings_eur_today?: SensorVal
}

export interface EnvCurrent {
  ext_temperature?: SensorVal
  ext_humidity?: SensorVal
  // API returns wind_kmh (not wind_speed)
  wind_kmh?: SensorVal
  uv_index?: SensorVal
  renewables_pct?: SensorVal
  // API returns fire_risk_fwi (not fire_risk_index)
  fire_risk_fwi?: SensorVal
  co2_g_kwh?: SensorVal
  water_balance_mm?: SensorVal
}

export interface AirQuality {
  pm25?: SensorVal
  pm10?: SensorVal
  co?: SensorVal
  no2?: SensorVal
  o3?: SensorVal
  aqi?: SensorVal
}

export interface ForecastPoint {
  // API returns timestamp like "2026-06-15T23:00"
  timestamp?: string
  // kept for backwards compat if server adds these
  hour?: string
  time?: string
  // weather_code follows WMO standard (Open-Meteo)
  weather_code?: number | null
  emoji?: string
  temperature?: number | null
  temp?: number | null
  humidity?: number | null
  hum?: number | null
  precipitation_prob?: number | null
  rain?: number | null
  wind_kmh?: number | null
  wind?: number | null
}

export interface EnvironmentalContext {
  current?: EnvCurrent
  forecast?: ForecastPoint[]
}

export interface Sensors {
  temperature?: SensorVal
  humidity?: SensorVal
  water_level?: SensorVal
  battery_level?: SensorVal
  [key: string]: SensorVal | undefined
}

export interface ApiData {
  sensors?: Sensors
  calculated_metrics?: CalculatedMetrics
  // air_quality is at root level in the real API (not inside environmental_context)
  air_quality?: AirQuality
  environmental_context?: EnvironmentalContext
}

export interface Rule {
  id: number | string
  condition?: string
  action?: string
  description?: string
  affected_layer?: string
  status?: "active" | "pending" | "completed" | "disabled"
  duration_hours?: number | null
  trigger_source?: string
  created_at?: string
  updated_at?: string
}

export interface Toast {
  id: number
  message: string
  level: "danger" | "warning"
}

// ── Context ───────────────────────────────────────────────────────────────────

interface VitalShellCtx {
  data: ApiData | null
  rules: Rule[]
  loading: boolean
  wsConnected: boolean
  toasts: Toast[]
  dismissToast: (id: number) => void
}

const Ctx = createContext<VitalShellCtx | null>(null)

export function useVitalShell(): VitalShellCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useVitalShell must be inside VitalShellProvider")
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function VitalShellProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ApiData | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const wsLive = useRef(false)
  const mounted = useRef(true)

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback((message: string, level: "danger" | "warning") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, level }])
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      level === "danger" ? 8000 : 5000,
    )
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${PROXY}/data`)
      if (res.ok && mounted.current) {
        const json = (await res.json()) as ApiData
        setData(json)
      }
    } catch {
      // silent — WS or next poll will update
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch(`${PROXY}/rules?limit=20`)
      if (res.ok && mounted.current) {
        const json = (await res.json()) as Rule[] | { data?: Rule[]; rules?: Rule[] }
        setRules(Array.isArray(json) ? json : (json?.data ?? json?.rules ?? []))
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    let retries = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let pollInterval: ReturnType<typeof setInterval> | null = null

    function startPolling() {
      if (pollInterval) return
      pollInterval = setInterval(() => {
        if (!wsLive.current) void fetchData()
      }, 30_000)
    }

    function stopPolling() {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    function mergeSensors(prev: ApiData | null, flatPayload: Record<string, unknown>): Sensors {
      const base: Sensors = { ...(prev?.sensors ?? {}) }
      for (const [k, v] of Object.entries(flatPayload)) {
        if (typeof v === "number" || v == null) {
          // WS sends flat numbers: { battery_level: 11 } — wrap in SensorVal
          base[k] = { ...(base[k] ?? {}), value: typeof v === "number" ? v : null }
        } else if (typeof v === "object") {
          // Already a SensorVal shape
          base[k] = v as SensorVal
        }
      }
      return base
    }

    function handleWsMessage(raw: unknown) {
      const msg = raw as { type?: string; payload?: unknown; data?: unknown }
      const type = msg.type
      // Server uses "payload" key; fall back to "data" for compatibility
      const payload = (msg.payload ?? msg.data ?? {}) as Record<string, unknown>

      if (type === "sensor_update") {
        setData((prev) => ({ ...prev, sensors: mergeSensors(prev, payload) }))
      } else if (type === "environmental_update") {
        setData((prev) => ({
          ...prev,
          environmental_context: {
            ...prev?.environmental_context,
            ...(payload as Partial<EnvironmentalContext>),
          },
        }))
      } else if (type === "metrics_update") {
        setData((prev) => ({
          ...prev,
          calculated_metrics: {
            ...prev?.calculated_metrics,
            ...(payload as Partial<CalculatedMetrics>),
          },
        }))
      } else if (type === "rule_update") {
        void fetchRules()
      } else if (type === "alert") {
        const p = payload as { message?: string; level?: string }
        pushToast(p?.message ?? "Alerta de VitalShell", p?.level === "danger" ? "danger" : "warning")
      }
      // "connected" and "health_update" → informational, no state change
    }

    function connect() {
      const ws = new WebSocket(`${WS_URL}?apiKey=${API_KEY}`)
      wsRef.current = ws

      ws.onopen = () => {
        retries = 0
        wsLive.current = true
        if (mounted.current) setWsConnected(true)
        stopPolling()
      }

      ws.onmessage = (e: MessageEvent<string>) => {
        try {
          handleWsMessage(JSON.parse(e.data))
        } catch {
          // ignore malformed frames
        }
      }

      ws.onclose = () => {
        wsLive.current = false
        if (mounted.current) setWsConnected(false)
        startPolling()
        const delay = Math.min(1000 * Math.pow(2, retries), 30_000)
        retries = Math.min(retries + 1, 10)
        retryTimer = setTimeout(connect, delay)
      }

      ws.onerror = () => ws.close()
    }

    void fetchData()
    void fetchRules()
    connect()

    return () => {
      mounted.current = false
      if (retryTimer) clearTimeout(retryTimer)
      stopPolling()
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [fetchData, fetchRules, pushToast])

  return (
    <Ctx.Provider value={{ data, rules, loading, wsConnected, toasts, dismissToast }}>
      {children}
    </Ctx.Provider>
  )
}
