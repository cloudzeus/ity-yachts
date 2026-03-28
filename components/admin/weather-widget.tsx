"use client"

import { useState, useEffect } from "react"
import { Cloud, Droplets, Wind, Thermometer, Eye, Sun, Loader2 } from "lucide-react"

interface CurrentWeather {
  temp_c: number
  feelslike_c: number
  humidity: number
  wind_kph: number
  wind_dir: string
  vis_km: number
  uv: number
  condition: { text: string; icon: string }
}

interface ForecastDay {
  date: string
  day: {
    maxtemp_c: number
    mintemp_c: number
    avgtemp_c: number
    daily_chance_of_rain: number
    condition: { text: string; icon: string }
    maxwind_kph: number
    uv: number
  }
}

interface WeatherData {
  location: { name: string; region: string; country: string; localtime: string }
  current: CurrentWeather
  forecast?: { forecastday: ForecastDay[] }
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/weather?endpoint=forecast&days=3")
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setError(json.error || "Failed to load weather")
          return
        }
        setData(await res.json())
      } catch {
        setError("Failed to load weather")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col" style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)" }}>
        <div className="px-6 py-4" style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}>
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Weather</h3>
        </div>
        <div className="flex items-center justify-center px-6 py-12">
          <Loader2 className="size-5 animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col" style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)" }}>
        <div className="px-6 py-4" style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}>
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Weather</h3>
        </div>
        <div className="flex items-center justify-center px-6 py-12">
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{error || "No data"}</p>
        </div>
      </div>
    )
  }

  const { current, location, forecast } = data
  const days = forecast?.forecastday || []
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex flex-col" style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)" }}>
      {/* Header */}
      <div className="px-6 py-4" style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
          Weather — {location.name}
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: "var(--on-surface-variant)" }}>
          {location.region}, {location.country}
        </p>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        {/* Current conditions */}
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https:${current.condition.icon}`} alt={current.condition.text} className="size-16" />
          <div className="flex-1">
            <p className="text-3xl font-bold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.02em" }}>
              {Math.round(current.temp_c)}°C
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--on-surface-variant)" }}>
              {current.condition.text}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              Feels like {Math.round(current.feelslike_c)}°C
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col items-center gap-1 py-2 rounded-md" style={{ background: "var(--surface-container-low)" }}>
            <Wind className="size-3.5" style={{ color: "var(--secondary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{Math.round(current.wind_kph)} km/h</span>
            <span className="text-[9px]" style={{ color: "var(--on-surface-variant)" }}>{current.wind_dir}</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-2 rounded-md" style={{ background: "var(--surface-container-low)" }}>
            <Droplets className="size-3.5" style={{ color: "var(--secondary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{current.humidity}%</span>
            <span className="text-[9px]" style={{ color: "var(--on-surface-variant)" }}>Humidity</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-2 rounded-md" style={{ background: "var(--surface-container-low)" }}>
            <Eye className="size-3.5" style={{ color: "var(--secondary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{current.vis_km} km</span>
            <span className="text-[9px]" style={{ color: "var(--on-surface-variant)" }}>Visibility</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-2 rounded-md" style={{ background: "var(--surface-container-low)" }}>
            <Sun className="size-3.5" style={{ color: "var(--secondary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{current.uv}</span>
            <span className="text-[9px]" style={{ color: "var(--on-surface-variant)" }}>UV Index</span>
          </div>
        </div>

        {/* 3-day forecast */}
        {days.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--on-surface-variant)" }}>3-Day Forecast</p>
            <div className="flex gap-2">
              {days.map((day) => {
                const d = new Date(day.date + "T00:00:00")
                const isToday = d.toDateString() === new Date().toDateString()
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-md" style={{ background: "var(--surface-container-low)" }}>
                    <span className="text-[10px] font-medium" style={{ color: "var(--on-surface-variant)" }}>
                      {isToday ? "Today" : dayNames[d.getDay()]}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https:${day.day.condition.icon}`} alt={day.day.condition.text} className="size-8" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold" style={{ color: "var(--on-surface)" }}>{Math.round(day.day.maxtemp_c)}°</span>
                      <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>{Math.round(day.day.mintemp_c)}°</span>
                    </div>
                    {day.day.daily_chance_of_rain > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Droplets className="size-2.5" style={{ color: "var(--secondary)" }} />
                        <span className="text-[9px]" style={{ color: "var(--secondary)" }}>{day.day.daily_chance_of_rain}%</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
