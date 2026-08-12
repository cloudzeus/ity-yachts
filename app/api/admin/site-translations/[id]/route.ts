import { getSession } from "@/lib/auth-session"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { parseCatalogueId, updateCatalogueTranslation } from "@/lib/catalogue-translations"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { key, namespace, en, el, de } = await req.json()

    // Catalogue rows carry a synthetic id and are written back to their own
    // NAUSYS table, one locale key at a time, so the locales NAUSYS owns
    // survive the edit.
    if (parseCatalogueId(id)) {
      const ok = await updateCatalogueTranslation(id, { en, el, de })
      if (!ok) return NextResponse.json({ error: "Unknown catalogue row" }, { status: 400 })
      return NextResponse.json({ id, key, namespace, en, el, de })
    }

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
    // Catalogue names are owned by NAUSYS; deleting one here would only be
    // undone by the next sync.
    if (parseCatalogueId(id)) {
      return NextResponse.json({ error: "Catalogue entries cannot be deleted" }, { status: 400 })
    }
    await db.siteTranslation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/site-translations/[id]]", error)
    return NextResponse.json({ error: "Failed to delete translation" }, { status: 500 })
  }
}
