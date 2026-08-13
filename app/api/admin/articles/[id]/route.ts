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
      title, slug, status, category, categoryId, tagIds, author, date, publishedAt,
      shortDesc, description, readMinutes,
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
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(readMinutes !== undefined && { readMinutes: readMinutes ?? null }),
        ...(publishedAt !== undefined && {
          publishedAt: publishedAt ? new Date(publishedAt) : null,
        }),
      },
    })

    /* Publishing stamps the moment it went live, once — and only when the
       editor did not set a date itself. Re-saving a published article must
       not move that date. */
    if (status === "published" && !article.publishedAt) {
      await db.article.update({ where: { id }, data: { publishedAt: new Date() } })
    }

    // Tags arrive as the full set; replacing is simpler than diffing and
    // cannot leave a link behind.
    if (Array.isArray(tagIds)) {
      await db.$transaction([
        db.articleTagLink.deleteMany({ where: { articleId: id } }),
        db.articleTagLink.createMany({
          data: tagIds.map((tagId: string) => ({ articleId: id, tagId })),
          skipDuplicates: true,
        }),
      ])
    }

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
