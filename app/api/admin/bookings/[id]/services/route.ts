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
    const { serviceId, serviceName, unitPrice, totalPrice, currency, obligatory } = body

    if (!serviceId || !serviceName || unitPrice === undefined || totalPrice === undefined) {
      return NextResponse.json(
        { error: "serviceId, serviceName, unitPrice, and totalPrice are required" },
        { status: 400 },
      )
    }

    const service = await db.bookingService.create({
      data: {
        bookingId: id,
        serviceId: parseInt(String(serviceId)),
        serviceName,
        unitPrice: parseFloat(String(unitPrice)),
        totalPrice: parseFloat(String(totalPrice)),
        currency: currency ?? "EUR",
        obligatory: obligatory ?? false,
      },
    })

    // Recalculate booking servicesTotal
    const aggregate = await db.bookingService.aggregate({
      where: { bookingId: id },
      _sum: { totalPrice: true },
    })
    await db.booking.update({
      where: { id },
      data: { servicesTotal: aggregate._sum.totalPrice ?? 0 },
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/bookings/[id]/services]", error)
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
    const { serviceId } = body

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId is required" }, { status: 400 })
    }

    await db.bookingService.delete({ where: { id: serviceId } })

    // Recalculate booking servicesTotal
    const aggregate = await db.bookingService.aggregate({
      where: { bookingId: id },
      _sum: { totalPrice: true },
    })
    await db.booking.update({
      where: { id },
      data: { servicesTotal: aggregate._sum.totalPrice ?? 0 },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/bookings/[id]/services]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
