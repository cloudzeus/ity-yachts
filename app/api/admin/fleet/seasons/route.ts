import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [seasons, yachtSeasonCounts] = await Promise.all([
      db.nausysSeason.findMany({
        include: { _count: { select: { yachtSeasons: true } } },
        orderBy: { dateFrom: "asc" },
      }),
      db.nausysYachtSeason.groupBy({
        by: ["seasonId"],
        _count: true,
      }),
    ])

    return NextResponse.json({ seasons, yachtSeasonCounts })
  } catch (error) {
    console.error("[GET /api/admin/fleet/seasons]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
