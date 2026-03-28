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
    const member = await db.staff.findUnique({ where: { id } })
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ member })
  } catch (error) {
    console.error("[GET /api/admin/staff/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      userId, name, email, phone, mobile, address,
      city, latitude, longitude, department, position, bio, image, status, sortOrder,
    } = body

    const member = await db.staff.update({
      where: { id },
      data: {
        ...(userId !== undefined && { userId: userId || null }),
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(mobile !== undefined && { mobile }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(department !== undefined && { department }),
        ...(position !== undefined && { position }),
        ...(bio !== undefined && { bio }),
        ...(image !== undefined && { image }),
        ...(status !== undefined && { status }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error("[PUT /api/admin/staff/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export { PUT as PATCH }

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    await db.staff.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/staff/:id]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
