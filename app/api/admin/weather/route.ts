import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

const BASE_URL = "https://api.weatherapi.com/v1"

async function getWeatherApiKey(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  if (!record) throw new Error("API keys not configured")
  const keys = record.value as Record<string, string>
  if (!keys.weatherApiKey) throw new Error("WeatherAPI key not configured in Settings > AI Keys")
  return keys.weatherApiKey
}

async function getCompanyAddress(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "company" } })
  if (!record) return "Athens, Greece"
  const company = record.value as Record<string, string>
  return company.address || "Athens, Greece"
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const apiKey = await getWeatherApiKey()
    const { searchParams } = new URL(req.url)

    const endpoint = searchParams.get("endpoint") || "forecast"
    const q = searchParams.get("q") || (await getCompanyAddress())
    const days = searchParams.get("days") || "3"

    let url: string
    switch (endpoint) {
      case "current":
        url = `${BASE_URL}/current.json?key=${apiKey}&q=${encodeURIComponent(q)}&aqi=no`
        break
      case "forecast":
        url = `${BASE_URL}/forecast.json?key=${apiKey}&q=${encodeURIComponent(q)}&days=${days}&aqi=no&alerts=no`
        break
      case "marine":
        url = `${BASE_URL}/marine.json?key=${apiKey}&q=${encodeURIComponent(q)}&days=${days}`
        break
      default:
        url = `${BASE_URL}/forecast.json?key=${apiKey}&q=${encodeURIComponent(q)}&days=${days}&aqi=no&alerts=no`
    }

    const res = await fetch(url, { next: { revalidate: 1800 } }) // cache 30 min
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: err?.error?.message || `WeatherAPI error: ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/admin/weather]", error)
    const msg = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
