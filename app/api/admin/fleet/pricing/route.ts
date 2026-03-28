import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const yachtId = searchParams.get("yachtId")
    const seasonId = searchParams.get("seasonId")

    const where: Record<string, unknown> = {}
    if (yachtId) where.yachtId = parseInt(yachtId)

    const [prices, seasons, yachts] = await Promise.all([
      db.nausysYachtPrice.findMany({
        where,
        include: { yacht: { select: { id: true, name: true } } },
        orderBy: [{ yachtId: "asc" }, { dateFrom: "asc" }],
      }),
      db.nausysSeason.findMany({ orderBy: { dateFrom: "asc" } }),
      db.nausysYacht.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ])

    return NextResponse.json({ prices, seasons, yachts })
  } catch (error) {
    console.error("[GET /api/admin/fleet/pricing]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
