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
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")))
    const search = searchParams.get("search") ?? ""

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.review.count({ where }),
    ])

    return NextResponse.json({ reviews, total })
  } catch (error) {
    console.error("[GET /api/admin/reviews]", error)
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
    const { name, email, date, content, rating, status, image } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Get max sortOrder to place new review at the end
    const maxOrder = await db.review.aggregate({ _max: { sortOrder: true } })
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

    const review = await db.review.create({
      data: {
        name,
        email: email ?? "",
        date: date ? new Date(date) : new Date(),
        content: content ?? {},
        rating: rating ?? 5,
        status: status ?? "draft",
        sortOrder: nextOrder,
        image: image ?? null,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/reviews]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()

    // Reorder endpoint: expects { orderedIds: string[] }
    if (body.orderedIds && Array.isArray(body.orderedIds)) {
      const updates = body.orderedIds.map((id: string, index: number) =>
        db.review.update({ where: { id }, data: { sortOrder: index } })
      )
      await db.$transaction(updates)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("[PATCH /api/admin/reviews]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
