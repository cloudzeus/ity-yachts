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
    const service = await db.service.findUnique({ where: { id } })
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error("[GET /api/admin/services/[id]]", error)
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
    const { title, slug, label, header, shortDesc, description, status, defaultMedia, defaultMediaType, icon, link, showOnHomepage } = body

    // Slug uniqueness
    if (slug) {
      const existing = await db.service.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    const service = await db.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(label !== undefined && { label }),
        ...(header !== undefined && { header }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(defaultMedia !== undefined && { defaultMedia }),
        ...(defaultMediaType !== undefined && { defaultMediaType }),
        ...(icon !== undefined && { icon }),
        ...(link !== undefined && { link }),
        ...(showOnHomepage !== undefined && { showOnHomepage }),
      },
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error("[PATCH /api/admin/services/[id]]", error)
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
    await db.service.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/services/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
