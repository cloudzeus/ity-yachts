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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10")))
    const search = searchParams.get("search") ?? ""

    const where = search
      ? {
          OR: [
            { slug: { contains: search } },
            { startFrom: { contains: search } },
          ],
        }
      : {}

    const [itineraries, total] = await Promise.all([
      db.itinerary.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { days: true } } },
      }),
      db.itinerary.count({ where }),
    ])

    return NextResponse.json({ itineraries, total })
  } catch (error) {
    console.error("[GET /api/admin/itineraries]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { name, slug, shortDesc, startFrom, startLatitude, startLongitude, places, totalDays, totalMiles } = body

    if (!name?.en) {
      return NextResponse.json({ error: "Name (EN) is required" }, { status: 400 })
    }

    const finalSlug = (slug || name.en.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) || "itinerary"

    let uniqueSlug = finalSlug
    const existing = await db.itinerary.findUnique({ where: { slug: uniqueSlug } })
    if (existing) {
      let suffix = 2
      while (await db.itinerary.findUnique({ where: { slug: `${finalSlug}-${suffix}` } })) {
        suffix++
      }
      uniqueSlug = `${finalSlug}-${suffix}`
    }

    const itinerary = await db.itinerary.create({
      data: {
        name: name ?? {},
        slug: uniqueSlug,
        shortDesc: shortDesc ?? {},
        startFrom: startFrom ?? "",
        startLatitude: startLatitude ?? null,
        startLongitude: startLongitude ?? null,
        places: places ?? [],
        totalDays: totalDays ?? 0,
        totalMiles: totalMiles ?? 0,
      },
    })

    return NextResponse.json({ itinerary }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/itineraries]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
