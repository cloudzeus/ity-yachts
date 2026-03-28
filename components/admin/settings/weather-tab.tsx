"use client"

import { useState, useEffect } from "react"
import { Cloud, Droplets, Wind, Thermometer, Eye, Sun, Sunrise, Sunset, Loader2, RefreshCw, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CurrentWeather {
  temp_c: number
  feelslike_c: number
  humidity: number
  wind_kph: number
  wind_dir: string
  vis_km: number
  uv: number
  pressure_mb: number
  precip_mm: number
  cloud: number
  condition: { text: string; icon: string }
  last_updated: string
}

interface HourData {
  time: string
  temp_c: number
  condition: { text: string; icon: string }
  chance_of_rain: number
  wind_kph: number
  humidity: number
}

interface ForecastDay {
  date: string
  day: {
    maxtemp_c: number
    mintemp_c: number
    avgtemp_c: number
    avghumidity: number
    daily_chance_of_rain: number
    condition: { text: string; icon: string }
    maxwind_kph: number
    uv: number
    totalprecip_mm: number
  }
  astro: {
    sunrise: string
    sunset: string
    moonrise: string
    moonset: string
    moon_phase: string
    moon_illumination: number
  }
  hour: HourData[]
}

interface WeatherData {
  location: { name: string; region: string; country: string; localtime: string; lat: number; lon: number }
  current: CurrentWeather
  forecast?: { forecastday: ForecastDay[] }
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg" style={{ background: "var(--surface-container-low)" }}>
      <Icon className="size-4" style={{ color: "var(--secondary)" }} />
      <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{value}</span>
      <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>{label}</span>
      {sub && <span className="text-[9px]" style={{ color: "var(--on-surface-variant)" }}>{sub}</span>}
    </div>
  )
}

export function WeatherTab() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedDay, setSelectedDay] = useState(0)

  async function loadWeather() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/weather?endpoint=forecast&days=3")
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || "Failed to load weather data")
        return
      }
      setData(await res.json())
    } catch {
      setError("Failed to connect to weather service")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWeather() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Cloud className="size-10" style={{ color: "var(--outline-variant)" }} />
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{error || "No weather data available"}</p>
        <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
          Make sure your WeatherAPI key is configured in the AI Keys tab and your company address is set.
        </p>
        <Button variant="outline" size="sm" onClick={loadWeather} className="h-8 text-xs gap-1.5">
          <RefreshCw className="size-3" /> Retry
        </Button>
      </div>
    )
  }

  const { current, location, forecast } = data
  const days = forecast?.forecastday || []
  const activeDay = days[selectedDay]

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Location header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="size-4" style={{ color: "var(--secondary)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--on-surface)", fontFamily: "var(--font-display)" }}>
              {location.name}, {location.region}
            </p>
            <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
              {location.country} · {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}° · Local time: {location.localtime}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadWeather} className="h-7 text-[10px] gap-1" style={{ borderColor: "var(--outline-variant)" }}>
          <RefreshCw className="size-3" /> Refresh
        </Button>
      </div>

      {/* Current weather card */}
      <div className="rounded-lg border p-6" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
        <div className="flex items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https:${current.condition.icon}`} alt={current.condition.text} className="size-24" />
          <div className="flex-1">
            <p className="text-5xl font-bold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.03em" }}>
              {Math.round(current.temp_c)}°C
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--on-surface)" }}>{current.condition.text}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              Feels like {Math.round(current.feelslike_c)}°C · Updated {current.last_updated}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3 mt-6">
          <StatCard icon={Wind} label="Wind" value={`${Math.round(current.wind_kph)} km/h`} sub={current.wind_dir} />
          <StatCard icon={Droplets} label="Humidity" value={`${current.humidity}%`} />
          <StatCard icon={Eye} label="Visibility" value={`${current.vis_km} km`} />
          <StatCard icon={Sun} label="UV Index" value={String(current.uv)} />
          <StatCard icon={Cloud} label="Cloud" value={`${current.cloud}%`} />
          <StatCard icon={Thermometer} label="Pressure" value={`${current.pressure_mb}`} sub="hPa" />
        </div>
      </div>

      {/* 3-day forecast tabs */}
      {days.length > 0 && (
        <div className="rounded-lg border" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
          {/* Day tabs */}
          <div className="flex border-b" style={{ borderColor: "var(--outline-variant)" }}>
            {days.map((day, i) => {
              const d = new Date(day.date + "T00:00:00")
              const isToday = d.toDateString() === new Date().toDateString()
              const isActive = selectedDay === i
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(i)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-colors relative"
                  style={{ color: isActive ? "var(--primary)" : "var(--on-surface-variant)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https:${day.day.condition.icon}`} alt="" className="size-8" />
                  <div className="text-left">
                    <p className="text-xs font-medium">{isToday ? "Today" : DAY_NAMES[d.getDay()]}</p>
                    <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                      {Math.round(day.day.maxtemp_c)}° / {Math.round(day.day.mintemp_c)}°
                    </p>
                  </div>
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--primary)" }} />}
                </button>
              )
            })}
          </div>

          {/* Selected day detail */}
          {activeDay && (
            <div className="p-5 flex flex-col gap-5">
              {/* Day summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--on-surface-variant)" }}>Conditions</p>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https:${activeDay.day.condition.icon}`} alt="" className="size-12" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>{activeDay.day.condition.text}</p>
                      <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        High {Math.round(activeDay.day.maxtemp_c)}° · Low {Math.round(activeDay.day.mintemp_c)}° · Avg {Math.round(activeDay.day.avgtemp_c)}°
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Droplets className="size-3" style={{ color: "var(--secondary)" }} />
                      <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Rain {activeDay.day.daily_chance_of_rain}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wind className="size-3" style={{ color: "var(--secondary)" }} />
                      <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>{Math.round(activeDay.day.maxwind_kph)} km/h</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sun className="size-3" style={{ color: "var(--secondary)" }} />
                      <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>UV {activeDay.day.uv}</span>
                    </div>
                  </div>
                </div>

                {/* Astronomy */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--on-surface-variant)" }}>Sun & Moon</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 py-2 px-3 rounded-md" style={{ background: "var(--surface-container-low)" }}>
                      <Sunrise className="size-3.5" style={{ color: "#F59E0B" }} />
                      <div>
                        <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>Sunrise</p>
                        <p className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{activeDay.astro.sunrise}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 py-2 px-3 rounded-md" style={{ background: "var(--surface-container-low)" }}>
                      <Sunset className="size-3.5" style={{ color: "#EF4444" }} />
                      <div>
                        <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>Sunset</p>
                        <p className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{activeDay.astro.sunset}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 py-2 px-3 rounded-md" style={{ background: "var(--surface-container-low)" }}>
                    <span className="text-sm">🌙</span>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{activeDay.astro.moon_phase}</p>
                      <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                        Illumination {activeDay.astro.moon_illumination}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly forecast */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--on-surface-variant)" }}>Hourly Forecast</p>
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {activeDay.hour.filter((_, i) => i % 3 === 0).map((h) => {
                    const time = h.time.split(" ")[1]?.slice(0, 5) || ""
                    return (
                      <div key={h.time} className="flex flex-col items-center gap-1 py-2 px-3 rounded-md shrink-0 min-w-[60px]" style={{ background: "var(--surface-container-low)" }}>
                        <span className="text-[10px] font-medium" style={{ color: "var(--on-surface-variant)" }}>{time}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https:${h.condition.icon}`} alt={h.condition.text} className="size-7" />
                        <span className="text-xs font-semibold" style={{ color: "var(--on-surface)" }}>{Math.round(h.temp_c)}°</span>
                        {h.chance_of_rain > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Droplets className="size-2" style={{ color: "var(--secondary)" }} />
                            <span className="text-[8px]" style={{ color: "var(--secondary)" }}>{h.chance_of_rain}%</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
