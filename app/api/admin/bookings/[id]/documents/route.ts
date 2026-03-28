import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, type, url, mimeType, size } = body

    if (!name || !url) {
      return NextResponse.json(
        { error: "name and url are required" },
        { status: 400 },
      )
    }

    const document = await db.bookingDocument.create({
      data: {
        bookingId: id,
        name,
        type: type ?? "",
        url,
        mimeType: mimeType ?? "",
        size: size ? parseInt(String(size)) : 0,
      },
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/bookings/[id]/documents]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await params
    const body = await req.json()
    const { documentId } = body

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 })
    }

    await db.bookingDocument.delete({ where: { id: documentId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/bookings/[id]/documents]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
