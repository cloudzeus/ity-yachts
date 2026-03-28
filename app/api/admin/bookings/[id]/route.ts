import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

const bookingIncludes = {
  customer: true,
  yacht: {
    include: {
      model: { include: { category: true, builder: true } },
    },
  },
  extras: true,
  services: true,
  payments: true,
  statusHistory: { orderBy: { createdAt: "desc" as const } },
  documents: true,
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const booking = await db.booking.findUnique({
      where: { id },
      include: bookingIncludes,
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("[GET /api/admin/bookings/[id]]", error)
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
      status, dateFrom, dateTo, baseFromId, baseToId, guests, charterType,
      basePrice, discountAmount, discountPercent, extrasTotal, servicesTotal,
      totalPrice, currency, commission, deposit, depositDueDate, balanceDueDate,
      optionExpiresAt, internalNotes, clientNotes,
    } = body

    const existing = await db.booking.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // If status changed, create a status history entry
    if (status !== undefined && status !== existing.status) {
      await db.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: existing.status,
          toStatus: status,
          changedBy: session.user.id,
        },
      })
    }

    const booking = await db.booking.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(dateFrom !== undefined && { dateFrom: new Date(dateFrom) }),
        ...(dateTo !== undefined && { dateTo: new Date(dateTo) }),
        ...(baseFromId !== undefined && { baseFromId: baseFromId !== null ? parseInt(String(baseFromId)) : null }),
        ...(baseToId !== undefined && { baseToId: baseToId !== null ? parseInt(String(baseToId)) : null }),
        ...(guests !== undefined && { guests: parseInt(String(guests)) }),
        ...(charterType !== undefined && { charterType }),
        ...(basePrice !== undefined && { basePrice: parseFloat(String(basePrice)) }),
        ...(discountAmount !== undefined && { discountAmount: parseFloat(String(discountAmount)) }),
        ...(discountPercent !== undefined && { discountPercent: parseFloat(String(discountPercent)) }),
        ...(extrasTotal !== undefined && { extrasTotal: parseFloat(String(extrasTotal)) }),
        ...(servicesTotal !== undefined && { servicesTotal: parseFloat(String(servicesTotal)) }),
        ...(totalPrice !== undefined && { totalPrice: parseFloat(String(totalPrice)) }),
        ...(currency !== undefined && { currency }),
        ...(commission !== undefined && { commission: parseFloat(String(commission)) }),
        ...(deposit !== undefined && { deposit: parseFloat(String(deposit)) }),
        ...(depositDueDate !== undefined && { depositDueDate: depositDueDate ? new Date(depositDueDate) : null }),
        ...(balanceDueDate !== undefined && { balanceDueDate: balanceDueDate ? new Date(balanceDueDate) : null }),
        ...(optionExpiresAt !== undefined && { optionExpiresAt: optionExpiresAt ? new Date(optionExpiresAt) : null }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(clientNotes !== undefined && { clientNotes }),
      },
      include: bookingIncludes,
    })

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("[PATCH /api/admin/bookings/[id]]", error)
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
    await db.booking.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/bookings/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
