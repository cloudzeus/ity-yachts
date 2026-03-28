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
    const { type, amount, currency, method, status, reference, paidAt, notes } = body

    if (!type || amount === undefined) {
      return NextResponse.json(
        { error: "type and amount are required" },
        { status: 400 },
      )
    }

    const payment = await db.bookingPayment.create({
      data: {
        bookingId: id,
        type,
        amount: parseFloat(String(amount)),
        currency: currency ?? "EUR",
        method: method ?? "",
        status: status ?? "PENDING",
        reference: reference ?? "",
        paidAt: paidAt ? new Date(paidAt) : null,
        notes: notes ?? null,
      },
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/bookings/[id]/payments]", error)
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
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 })
    }

    await db.bookingPayment.delete({ where: { id: paymentId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/bookings/[id]/payments]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
