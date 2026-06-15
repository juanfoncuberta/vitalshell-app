"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, InfoBanner, ScreenHeader, SectionLabel, StatCard } from "@/components/vitalshell/primitives"
import { TempLineChart, type TempPoint } from "@/components/vitalshell/charts"
import { useVitalShell } from "@/lib/vitalshell-context"
import { fmt, PROXY } from "@/lib/api"

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-fg-muted">{label}</span>
        <span className="font-semibold text-fg">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="vs-slider w-full"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <div className="flex justify-between text-[10px] text-fg-subtle">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

type StatStatus = "ok" | "warning" | "danger" | "neutral"
function apiStatus(s?: string | null): StatStatus {
  if (s === "ok" || s === "warning" || s === "danger") return s
  return "neutral"
}

// API returns { temperature_min, temperature_max, humidity_min, humidity_max }
interface ComfortPrefs {
  temperature_min?: number
  temperature_max?: number
  humidity_min?: number
  humidity_max?: number
  target_temperature?: number
  target_humidity?: number
}

export function ComfortScreen() {
  const { data } = useVitalShell()
  const sensors = data?.sensors
  const envCtx = data?.environmental_context

  const interiorTemp = sensors?.temperature?.value ?? null
  const interiorTempStatus = apiStatus(sensors?.temperature?.status)
  const interiorHum = sensors?.humidity?.value ?? null
  const interiorHumStatus = apiStatus(sensors?.humidity?.status)
  const extTemp = envCtx?.current?.ext_temperature?.value ?? null

  const [temp, setTemp] = useState(22)
  const [humidity, setHumidity] = useState(50)
  const [series, setSeries] = useState<TempPoint[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefLoaded = useRef(false)

  // Load comfort preferences once
  useEffect(() => {
    if (prefLoaded.current) return
    prefLoaded.current = true
    fetch(`${PROXY}/comfort`)
      .then((r) => r.json())
      .then((json: ComfortPrefs) => {
        // Handle both field name formats
        const t = json?.target_temperature ?? json?.temperature_max ?? json?.temperature_min
        const h = json?.target_humidity ?? json?.humidity_max ?? json?.humidity_min
        if (t != null) setTemp(Math.round(t))
        if (h != null) setHumidity(Math.round(h))
      })
      .catch(() => {})
  }, [])

  // Fetch sensor history — API only accepts 1h, 24h, 7d
  useEffect(() => {
    fetch(`${PROXY}/sensors/history?period=24h`)
      .then((r) => r.json())
      .then((json: unknown) => {
        const raw = Array.isArray(json)
          ? json
          : Array.isArray((json as Record<string, unknown>)?.data)
            ? ((json as Record<string, unknown>).data as unknown[])
            : null
        if (!raw) return

        const pts: TempPoint[] = raw.map((p: unknown, i: number) => {
          const point = p as Record<string, unknown>
          const interior =
            (point.temperature as number | null) ??
            ((point.sensors as Record<string, unknown>)?.temperature as Record<string, unknown>)
              ?.value as number | null ??
            null
          const exterior =
            (point.ext_temperature as number | null) ??
            (point.exterior_temperature as number | null) ??
            null
          const label = i === 0 ? "-24h" : i === raw.length - 1 ? "Ahora" : ""
          return { label, interior, exterior }
        })
        setSeries(pts)
      })
      .catch(() => {})
  }, [])

  const savePrefs = useCallback((t: number, h: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(`${PROXY}/comfort`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature_min: t - 2,
          temperature_max: t,
          humidity_min: h - 10,
          humidity_max: h,
        }),
      }).catch(() => {})
    }, 600)
  }, [])

  function handleTemp(v: number) { setTemp(v); savePrefs(v, humidity) }
  function handleHum(v: number) { setHumidity(v); savePrefs(temp, v) }

  return (
    <div className="space-y-5">
      <ScreenHeader title="Comfort" subtitle="Condiciones interiores · En vivo" />

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

      {extTemp != null && (
        <Card className="flex items-center justify-between">
          <span className="text-sm text-fg-muted">Temperatura exterior</span>
          <span className="text-sm font-semibold text-fg">{fmt(extTemp, 1)} °C</span>
        </Card>
      )}

      <Card>
        <SectionLabel>Temperatura · últimas 24h</SectionLabel>
        <TempLineChart series={series} />
      </Card>

      <Card className="space-y-5">
        <SectionLabel>Tu preferencia</SectionLabel>
        <Slider label="Temperatura" value={temp} min={18} max={30} unit="°C" onChange={handleTemp} />
        <Slider label="Humedad" value={humidity} min={30} max={70} unit="%" onChange={handleHum} />
      </Card>

      <InfoBanner>VitalShell ajustará el edificio para alcanzar tu comfort de forma sostenible.</InfoBanner>
    </div>
  )
}
