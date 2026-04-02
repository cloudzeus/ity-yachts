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
            { slug: { contains: search } },
          ],
        }
      : {}

    const [services, total] = await Promise.all([
      db.service.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.service.count({ where }),
    ])

    return NextResponse.json({ services, total })
  } catch (error) {
    console.error("[GET /api/admin/services]", error)
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
    const { title, slug, label, header, shortDesc, description, status, defaultMedia, defaultMediaType, icon, link, showOnHomepage } = body

    const nameEn = (title as Record<string, string>)?.en
    if (!nameEn) {
      return NextResponse.json({ error: "English title is required" }, { status: 400 })
    }

    // Generate slug
    const baseSlug = (slug || nameEn.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) || "service"
    let uniqueSlug = baseSlug
    const existing = await db.service.findUnique({ where: { slug: uniqueSlug } })
    if (existing) {
      let suffix = 2
      while (await db.service.findUnique({ where: { slug: `${baseSlug}-${suffix}` } })) {
        suffix++
      }
      uniqueSlug = `${baseSlug}-${suffix}`
    }

    // Get max sortOrder
    const maxOrder = await db.service.aggregate({ _max: { sortOrder: true } })
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

    const service = await db.service.create({
      data: {
        title: title ?? {},
        slug: uniqueSlug,
        label: label ?? {},
        header: header ?? {},
        shortDesc: shortDesc ?? {},
        description: description ?? {},
        status: status ?? "draft",
        defaultMedia: defaultMedia ?? null,
        defaultMediaType: defaultMediaType ?? null,
        icon: icon ?? null,
        link: link ?? null,
        showOnHomepage: showOnHomepage ?? false,
        sortOrder: nextOrder,
      },
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/services]", error)
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
        db.service.update({ where: { id }, data: { sortOrder: index } })
      )
      await db.$transaction(updates)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("[PATCH /api/admin/services]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
