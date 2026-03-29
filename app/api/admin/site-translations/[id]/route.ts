import { getSession } from "@/lib/auth-session"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { key, namespace, en, el, de } = await req.json()

    const translation = await db.siteTranslation.update({
      where: { id },
      data: {
        ...(key && { key }),
        ...(namespace && { namespace }),
        ...(en !== undefined && { en }),
        ...(el !== undefined && { el }),
        ...(de !== undefined && { de }),
      },
    })

    return NextResponse.json(translation)
  } catch (error) {
    console.error("[PUT /api/admin/site-translations/[id]]", error)
    return NextResponse.json({ error: "Failed to update translation" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    await db.siteTranslation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/site-translations/[id]]", error)
    return NextResponse.json({ error: "Failed to delete translation" }, { status: 500 })
  }
}
