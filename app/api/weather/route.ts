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

    const url = `${BASE_URL}/marine.json?key=${apiKey}&q=${encodeURIComponent(q)}&days=1`
    const res = await fetch(url, { next: { revalidate: 1800 } })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: err?.error?.message || `WeatherAPI error: ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()

    // Return only what the widget needs
    const current = data.current
    const forecastDay = data.forecast?.forecastday?.[0]?.day
    const marine = data.forecast?.forecastday?.[0]?.hour?.[12] // midday marine data

    return NextResponse.json({
      temp_c: Math.round(current?.temp_c ?? 0),
      condition: current?.condition?.text ?? "Clear",
      high_c: Math.round(forecastDay?.maxtemp_c ?? 0),
      low_c: Math.round(forecastDay?.mintemp_c ?? 0),
      wind_kph: Math.round(current?.wind_kph ?? 0),
      humidity: current?.humidity ?? 0,
      wave_height_m: marine?.sig_ht_mt ?? null,
    })
  } catch (error) {
    console.error("[GET /api/weather]", error)
    return NextResponse.json({ error: "Weather unavailable" }, { status: 500 })
  }
}
