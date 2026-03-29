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
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")))
    const search = searchParams.get("search") ?? ""

    const where = search
      ? {
          OR: [
            { slug: { contains: search } },
            { author: { contains: search } },
          ],
        }
      : {}

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.article.count({ where }),
    ])

    return NextResponse.json({ articles, total })
  } catch (error) {
    console.error("[GET /api/admin/articles]", error)
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
    const { title, slug, category, author, date, shortDesc, description, defaultMedia, defaultMediaType, media } = body

    const titleEn = title?.en
    if (!titleEn) {
      return NextResponse.json({ error: "Title (EN) is required" }, { status: 400 })
    }

    // Auto-generate slug if not provided
    const baseSlug = (slug || titleEn.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) || "article"

    let uniqueSlug = baseSlug
    const existing = await db.article.findUnique({ where: { slug: uniqueSlug } })
    if (existing) {
      let suffix = 2
      while (await db.article.findUnique({ where: { slug: `${baseSlug}-${suffix}` } })) {
        suffix++
      }
      uniqueSlug = `${baseSlug}-${suffix}`
    }

    const article = await db.article.create({
      data: {
        title: title ?? {},
        slug: uniqueSlug,
        category: category ?? {},
        author: author ?? "",
        date: date ? new Date(date) : new Date(),
        shortDesc: shortDesc ?? {},
        description: description ?? {},
        defaultMedia: defaultMedia ?? null,
        defaultMediaType: defaultMediaType ?? null,
        media: media ?? [],
      },
    })

    return NextResponse.json({ article }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/articles]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
