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
    const { equipmentId, equipmentName, quantity, unitPrice, totalPrice, currency } = body

    if (!equipmentId || !equipmentName || unitPrice === undefined || totalPrice === undefined) {
      return NextResponse.json(
        { error: "equipmentId, equipmentName, unitPrice, and totalPrice are required" },
        { status: 400 },
      )
    }

    const extra = await db.bookingExtra.create({
      data: {
        bookingId: id,
        equipmentId: parseInt(String(equipmentId)),
        equipmentName,
        quantity: quantity ? parseInt(String(quantity)) : 1,
        unitPrice: parseFloat(String(unitPrice)),
        totalPrice: parseFloat(String(totalPrice)),
        currency: currency ?? "EUR",
      },
    })

    // Recalculate booking extrasTotal
    const aggregate = await db.bookingExtra.aggregate({
      where: { bookingId: id },
      _sum: { totalPrice: true },
    })
    await db.booking.update({
      where: { id },
      data: { extrasTotal: aggregate._sum.totalPrice ?? 0 },
    })

    return NextResponse.json({ extra }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/bookings/[id]/extras]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { extraId } = body

    if (!extraId) {
      return NextResponse.json({ error: "extraId is required" }, { status: 400 })
    }

    await db.bookingExtra.delete({ where: { id: extraId } })

    // Recalculate booking extrasTotal
    const aggregate = await db.bookingExtra.aggregate({
      where: { bookingId: id },
      _sum: { totalPrice: true },
    })
    await db.booking.update({
      where: { id },
      data: { extrasTotal: aggregate._sum.totalPrice ?? 0 },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/bookings/[id]/extras]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
