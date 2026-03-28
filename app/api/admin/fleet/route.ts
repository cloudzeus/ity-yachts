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
    const search = searchParams.get("search") ?? ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")))

    const where = search
      ? { name: { contains: search } }
      : {}

    const [yachts, total] = await Promise.all([
      db.nausysYacht.findMany({
        where,
        include: {
          model: { include: { category: true, builder: true } },
          base: { include: { location: true } },
          prices: { orderBy: { dateFrom: "asc" } },
          _count: { select: { equipment: true, cabinDefinitions: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.nausysYacht.count({ where }),
    ])

    return NextResponse.json({ yachts, total })
  } catch (error) {
    console.error("[GET /api/admin/fleet]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
