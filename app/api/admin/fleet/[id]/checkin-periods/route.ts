import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const yachtId = parseInt(id)
    const body = await req.json()

    const item = await db.nausysYachtCheckInPeriod.create({
      data: {
        yachtId,
        dateFrom: new Date(body.dateFrom),
        dateTo: new Date(body.dateTo),
        minReservationDuration: body.minReservationDuration ?? 7,
        checkInMonday: body.checkInMonday ?? false,
        checkInTuesday: body.checkInTuesday ?? false,
        checkInWednesday: body.checkInWednesday ?? false,
        checkInThursday: body.checkInThursday ?? false,
        checkInFriday: body.checkInFriday ?? false,
        checkInSaturday: body.checkInSaturday ?? true,
        checkInSunday: body.checkInSunday ?? false,
        checkOutMonday: body.checkOutMonday ?? false,
        checkOutTuesday: body.checkOutTuesday ?? false,
        checkOutWednesday: body.checkOutWednesday ?? false,
        checkOutThursday: body.checkOutThursday ?? false,
        checkOutFriday: body.checkOutFriday ?? false,
        checkOutSaturday: body.checkOutSaturday ?? true,
        checkOutSunday: body.checkOutSunday ?? false,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/fleet/[id]/checkin-periods]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get("itemId")
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 })

    await db.nausysYachtCheckInPeriod.delete({ where: { id: itemId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/fleet/[id]/checkin-periods]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
