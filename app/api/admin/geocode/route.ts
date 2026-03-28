import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

async function getGeocodeKey(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  if (!record) throw new Error("API keys not configured")
  const keys = record.value as Record<string, string>
  if (!keys.geocodeKey) throw new Error("Geocode API key not configured")
  return keys.geocodeKey
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const q = req.nextUrl.searchParams.get("q")
    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const apiKey = await getGeocodeKey()
    const url = `https://geocode.maps.co/search?q=${encodeURIComponent(q + ", Greece")}&api_key=${apiKey}&limit=5&accept-language=en`
    const res = await fetch(url)

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] })
    }

    const results = await res.json()
    if (!Array.isArray(results)) {
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = results.slice(0, 5).map((r: Record<string, string>) => ({
      displayName: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    }))

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("[GET /api/admin/geocode]", error)
    return NextResponse.json({ suggestions: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { address } = body

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    const apiKey = await getGeocodeKey()
    const url = `https://geocode.maps.co/search?q=${encodeURIComponent(address)}&api_key=${apiKey}`
    const res = await fetch(url)

    if (!res.ok) {
      return NextResponse.json({ error: `Geocode API error: ${res.status}` }, { status: 502 })
    }

    const results = await res.json()

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "No results found" }, { status: 404 })
    }

    const best = results[0]
    return NextResponse.json({
      latitude: parseFloat(best.lat),
      longitude: parseFloat(best.lon),
      displayName: best.display_name,
    })
  } catch (error) {
    console.error("[POST /api/admin/geocode]", error)
    const msg = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
