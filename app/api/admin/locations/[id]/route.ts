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
    const location = await db.location.findUnique({ where: { id } })
    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json({ location })
  } catch (error) {
    console.error("[GET /api/admin/locations/[id]]", error)
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
      name, slug, status, nameTranslations, shortDesc, description,
      prefecture, city, municipality, latitude, longitude,
      defaultMedia, defaultMediaType, images, metaTitle, metaDesc,
    } = body

    if (slug) {
      const existing = await db.location.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    const location = await db.location.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(status !== undefined && { status }),
        ...(nameTranslations !== undefined && { nameTranslations }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(description !== undefined && { description }),
        ...(prefecture !== undefined && { prefecture }),
        ...(city !== undefined && { city }),
        ...(municipality !== undefined && { municipality }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(defaultMedia !== undefined && { defaultMedia }),
        ...(defaultMediaType !== undefined && { defaultMediaType }),
        ...(images !== undefined && { images }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDesc !== undefined && { metaDesc }),
      },
    })

    return NextResponse.json({ location })
  } catch (error) {
    console.error("[PATCH /api/admin/locations/[id]]", error)
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
    await db.location.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/locations/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
