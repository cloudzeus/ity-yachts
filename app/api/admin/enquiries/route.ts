import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")))
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.customer = {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ],
      }
    }

    const [enquiries, total] = await Promise.all([
      db.enquiry.findMany({
        where,
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          assignedStaff: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.enquiry.count({ where }),
    ])

    return NextResponse.json({ enquiries, total })
  } catch (error) {
    console.error("[GET /api/admin/enquiries]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const {
      customerId, assignedStaffId, status, dateFrom, dateTo,
      guests, preferredCategory, preferredLength, budget, currency,
      baseFrom, baseTo, notes, source,
    } = body

    const enquiry = await db.enquiry.create({
      data: {
        customerId: customerId || null,
        assignedStaffId: assignedStaffId || null,
        status: status ?? "NEW",
        dateFrom: dateFrom ? new Date(dateFrom) : null,
        dateTo: dateTo ? new Date(dateTo) : null,
        guests: guests ? parseInt(guests) : null,
        preferredCategory: preferredCategory || null,
        preferredLength: preferredLength || null,
        budget: budget ? parseFloat(budget) : null,
        currency: currency ?? "EUR",
        baseFrom: baseFrom || null,
        baseTo: baseTo || null,
        notes: notes || null,
        source: source ?? "",
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        assignedStaff: { select: { name: true } },
      },
    })

    return NextResponse.json({ enquiry }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/enquiries]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
