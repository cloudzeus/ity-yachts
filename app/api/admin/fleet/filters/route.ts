import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [categories, bases, years] = await Promise.all([
      db.nausysYachtCategory.findMany({ select: { id: true, name: true }, orderBy: { id: "asc" } }),
      db.nausysCharterBase.findMany({
        select: { id: true, location: { select: { name: true } } },
        orderBy: { id: "asc" },
      }),
      db.nausysYacht.findMany({
        where: { buildYear: { not: null } },
        select: { buildYear: true },
        distinct: ["buildYear"],
        orderBy: { buildYear: "desc" },
      }),
    ])

    return NextResponse.json({
      categories: categories.map((c) => ({ id: c.id, name: (c.name as Record<string, string>)?.en || `Category ${c.id}` })),
      bases: bases.map((b) => ({ id: b.id, name: (b.location?.name as Record<string, string>)?.en || `Base ${b.id}` })),
      years: years.map((y) => y.buildYear).filter(Boolean) as number[],
    })
  } catch (error) {
    console.error("[GET /api/admin/fleet/filters]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
