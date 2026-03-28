import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lat = req.nextUrl.searchParams.get("lat")
    const lng = req.nextUrl.searchParams.get("lng")
    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 })
    }

    const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
    if (!record) return NextResponse.json({ error: "API keys not configured" }, { status: 500 })
    const keys = record.value as Record<string, string>

    // Try Google Maps reverse geocode first, fall back to geocode.maps.co
    if (keys.googleMapsKey) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${keys.googleMapsKey}&language=en`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        if (json.results?.length > 0) {
          const result = json.results[0]
          const components = result.address_components || []
          const get = (type: string) => components.find((c: { types: string[] }) => c.types.includes(type))?.long_name || ""

          return NextResponse.json({
            displayName: result.formatted_address,
            name: get("locality") || get("administrative_area_level_3") || get("sublocality") || get("neighborhood") || "",
            city: get("locality") || get("administrative_area_level_3") || "",
            municipality: get("administrative_area_level_2") || "",
            prefecture: get("administrative_area_level_1") || "",
          })
        }
      }
    }

    // Fallback: geocode.maps.co
    if (keys.geocodeKey) {
      const url = `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=${keys.geocodeKey}&accept-language=en`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        if (json.display_name) {
          const addr = json.address || {}
          return NextResponse.json({
            displayName: json.display_name,
            name: addr.city || addr.town || addr.village || addr.hamlet || "",
            city: addr.city || addr.town || addr.village || "",
            municipality: addr.municipality || addr.county || "",
            prefecture: addr.state || "",
          })
        }
      }
    }

    return NextResponse.json({ error: "No geocoding API key configured" }, { status: 500 })
  } catch (error) {
    console.error("[GET /api/admin/geocode/reverse]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
