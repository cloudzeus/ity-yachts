import { getSession } from "@/lib/auth-session"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

const EMPTY = { en: "", el: "", de: "" }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    // The slug is deliberately not editable here: pages reference mottos by
    // slug, so renaming one would quietly detach it from everywhere it is used.
    const motto = await db.motto.update({
      where: { id },
      data: {
        ...(body.category && { category: body.category }),
        ...(body.heading && { heading: { ...EMPTY, ...body.heading } }),
        ...(body.subheading && { subheading: { ...EMPTY, ...body.subheading } }),
        ...(body.subtext && { subtext: { ...EMPTY, ...body.subtext } }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    })
    return NextResponse.json(motto)
  } catch (error) {
    console.error("[PUT /api/admin/mottos/[id]]", error)
    return NextResponse.json({ error: "Failed to update motto" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params
    await db.motto.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/mottos/[id]]", error)
    return NextResponse.json({ error: "Failed to delete motto" }, { status: 500 })
  }
}
