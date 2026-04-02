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
    const page = await db.page.findUnique({
      where: { id },
      include: { textComponents: { orderBy: { createdAt: "asc" } } },
    })
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error("[GET /api/admin/pages/[id]]", error)
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
    const { name, slug, status, content, heroSection, translations, metaTitle, metaDesc, metaKeywords, metaOgTitle, metaOgDesc, metaOgImage, metaRobots, metaCanonical, isHomePage, showInMenu, centralMenu, menuOrder, menuLabel } = body

    // If slug is being changed, check uniqueness
    if (slug) {
      const existing = await db.page.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    // If setting this page as home, unset any other home page first
    if (isHomePage === true) {
      await db.page.updateMany({
        where: { isHomePage: true, id: { not: id } },
        data: { isHomePage: false },
      })
    }

    const page = await db.page.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(status !== undefined && { status }),
        ...(content !== undefined && { content }),
        ...(heroSection !== undefined && { heroSection }),
        ...(translations !== undefined && { translations }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDesc !== undefined && { metaDesc }),
        ...(metaKeywords !== undefined && { metaKeywords }),
        ...(metaOgTitle !== undefined && { metaOgTitle }),
        ...(metaOgDesc !== undefined && { metaOgDesc }),
        ...(metaOgImage !== undefined && { metaOgImage }),
        ...(metaRobots !== undefined && { metaRobots }),
        ...(metaCanonical !== undefined && { metaCanonical }),
        ...(isHomePage !== undefined && { isHomePage }),
        ...(showInMenu !== undefined && { showInMenu }),
        ...(centralMenu !== undefined && { centralMenu }),
        ...(menuOrder !== undefined && { menuOrder }),
        ...(menuLabel !== undefined && { menuLabel }),
      },
    })

    return NextResponse.json({ page })
  } catch (error) {
    console.error("[PATCH /api/admin/pages/[id]]", error)
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
    await db.page.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/pages/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
