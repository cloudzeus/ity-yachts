import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

const BASE_URL = "https://api.weatherapi.com/v1"

async function getWeatherApiKey(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  if (!record) throw new Error("API keys not configured")
  const keys = record.value as Record<string, string>
  if (!keys.weatherApiKey) throw new Error("WeatherAPI key not configured")
  return keys.weatherApiKey
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = await getWeatherApiKey()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || "Lefkada, Greece"

    // Fetch forecast (has current + forecast) and marine (has wave data) in parallel
    const [forecastRes, marineRes] = await Promise.all([
      fetch(
        `${BASE_URL}/forecast.json?key=${apiKey}&q=${encodeURIComponent(q)}&days=1&aqi=no&alerts=no`,
        { next: { revalidate: 1800 } }
      ),
      fetch(
        `${BASE_URL}/marine.json?key=${apiKey}&q=${encodeURIComponent(q)}&days=1`,
        { next: { revalidate: 1800 } }
      ),
    ])

    if (!forecastRes.ok) {
      const err = await forecastRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: err?.error?.message || `WeatherAPI error: ${forecastRes.status}` },
        { status: 502 }
      )
    }

    const forecast = await forecastRes.json()
    const marine = marineRes.ok ? await marineRes.json() : null

    const current = forecast.current
    const day = forecast.forecast?.forecastday?.[0]?.day
    const marineHour = marine?.forecast?.forecastday?.[0]?.hour?.[12]

    return NextResponse.json({
      temp_c: Math.round(current?.temp_c ?? 0),
      condition: current?.condition?.text ?? "Clear",
      high_c: Math.round(day?.maxtemp_c ?? 0),
      low_c: Math.round(day?.mintemp_c ?? 0),
      wind_kph: Math.round(current?.wind_kph ?? 0),
      humidity: current?.humidity ?? 0,
      wave_height_m: marineHour?.sig_ht_mt ?? null,
    })
  } catch (error) {
    console.error("[GET /api/weather]", error)
    return NextResponse.json({ error: "Weather unavailable" }, { status: 500 })
  }
}
