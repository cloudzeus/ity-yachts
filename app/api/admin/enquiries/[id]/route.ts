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
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedStaff: { select: { id: true, name: true } },
      },
    })

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
    }

    return NextResponse.json({ enquiry })
  } catch (error) {
    console.error("[GET /api/admin/enquiries/[id]]", error)
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
      customerId, assignedStaffId, status, dateFrom, dateTo,
      guests, preferredCategory, preferredLength, budget, currency,
      baseFrom, baseTo, notes, source, bookingId,
    } = body

    const enquiry = await db.enquiry.update({
      where: { id },
      data: {
        ...(customerId !== undefined && { customerId: customerId || null }),
        ...(assignedStaffId !== undefined && { assignedStaffId: assignedStaffId || null }),
        ...(status !== undefined && { status }),
        ...(dateFrom !== undefined && { dateFrom: dateFrom ? new Date(dateFrom) : null }),
        ...(dateTo !== undefined && { dateTo: dateTo ? new Date(dateTo) : null }),
        ...(guests !== undefined && { guests: guests ? parseInt(guests) : null }),
        ...(preferredCategory !== undefined && { preferredCategory: preferredCategory || null }),
        ...(preferredLength !== undefined && { preferredLength: preferredLength || null }),
        ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
        ...(currency !== undefined && { currency }),
        ...(baseFrom !== undefined && { baseFrom: baseFrom || null }),
        ...(baseTo !== undefined && { baseTo: baseTo || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(source !== undefined && { source }),
        ...(bookingId !== undefined && { bookingId: bookingId || null }),
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedStaff: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ enquiry })
  } catch (error) {
    console.error("[PATCH /api/admin/enquiries/[id]]", error)
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
    await db.enquiry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/enquiries/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
