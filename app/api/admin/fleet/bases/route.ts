import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [countries, regions, locations, bases] = await Promise.all([
      db.nausysCountry.findMany({ orderBy: { id: "asc" } }),
      db.nausysRegion.findMany({ orderBy: { id: "asc" } }),
      db.nausysLocation.findMany({ orderBy: { id: "asc" } }),
      db.nausysCharterBase.findMany({
        include: { location: true },
        orderBy: { id: "asc" },
      }),
    ])

    return NextResponse.json({ countries, regions, locations, bases })
  } catch (error) {
    console.error("[GET /api/admin/fleet/bases]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
