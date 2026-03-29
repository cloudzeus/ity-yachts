import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const article = await db.article.findUnique({ where: { id } })
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error("[GET /api/admin/articles/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      title, slug, status, category, author, date,
      shortDesc, description,
      defaultMedia, defaultMediaType, media,
      metaTitle, metaDesc,
    } = body

    if (slug) {
      const existing = await db.article.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    const article = await db.article.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(status !== undefined && { status }),
        ...(category !== undefined && { category }),
        ...(author !== undefined && { author }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(description !== undefined && { description }),
        ...(defaultMedia !== undefined && { defaultMedia }),
        ...(defaultMediaType !== undefined && { defaultMediaType }),
        ...(media !== undefined && { media }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDesc !== undefined && { metaDesc }),
      },
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error("[PATCH /api/admin/articles/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    await db.article.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/articles/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
