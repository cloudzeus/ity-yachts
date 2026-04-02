import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })
    }

    // Delete in order: bookings referencing yachts first (no cascade), then yachts (cascade handles the rest)
    const [bookingCount, yachtCount] = await db.$transaction(async (tx) => {
      // Delete booking child records first
      await tx.bookingExtra.deleteMany({})
      await tx.bookingService.deleteMany({})
      await tx.bookingPayment.deleteMany({})
      await tx.bookingStatusHistory.deleteMany({})
      await tx.bookingDocument.deleteMany({})
      const b = await tx.booking.deleteMany({})

      // Delete all yachts — cascade handles equipment, services, prices, cabins, crew, seasons, areas, availability, etc.
      const y = await tx.nausysYacht.deleteMany({})

      return [b.count, y.count]
    })

    return NextResponse.json({
      success: true,
      deleted: { yachts: yachtCount, bookings: bookingCount },
    })
  } catch (error) {
    console.error("[DELETE /api/admin/fleet/delete-all]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
