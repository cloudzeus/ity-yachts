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
            { name: { contains: search } },
            { slug: { contains: search } },
          ],
        }
      : {}

    const [pages, total] = await Promise.all([
      db.page.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          isHomePage: true,
          showInMenu: true,
          centralMenu: true,
          menuOrder: true,
          translations: true,
          sortOrder: true,
          updatedAt: true,
        },
      }),
      db.page.count({ where }),
    ])

    return NextResponse.json({ pages, total, page, pageSize })
  } catch (error) {
    console.error("[GET /api/admin/pages]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, slug, translations } = await req.json()
    if (!name || !slug) {
      return NextResponse.json({ error: "Missing name or slug" }, { status: 400 })
    }

    // Check slug uniqueness
    const existing = await db.page.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    }

    const page = await db.page.create({
      data: {
        name,
        slug,
        status: "draft",
        content: [],
        translations: translations || { el: "", en: "", de: "" },
      },
    })

    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/pages]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
