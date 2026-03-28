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
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true } },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error("[GET /api/admin/customers/[id]]", error)
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
      firstName, lastName, email, phone, mobile, nationality,
      passportNumber, passportExpiry, dateOfBirth,
      address, city, country, postcode,
      sailingExperience, certifications,
      emergencyName, emergencyPhone, notes,
    } = body

    const customer = await db.customer.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(mobile !== undefined && { mobile }),
        ...(nationality !== undefined && { nationality }),
        ...(passportNumber !== undefined && { passportNumber }),
        ...(passportExpiry !== undefined && { passportExpiry: passportExpiry ? new Date(passportExpiry) : null }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(postcode !== undefined && { postcode }),
        ...(sailingExperience !== undefined && { sailingExperience }),
        ...(certifications !== undefined && { certifications }),
        ...(emergencyName !== undefined && { emergencyName }),
        ...(emergencyPhone !== undefined && { emergencyPhone }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error("[PATCH /api/admin/customers/[id]]", error)
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
    await db.customer.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/customers/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
