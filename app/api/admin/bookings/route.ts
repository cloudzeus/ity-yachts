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
    const customerId = searchParams.get("customerId") ?? ""
    const yachtId = searchParams.get("yachtId") ?? ""

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { bookingNumber: { contains: search } },
        { customer: { firstName: { contains: search } } },
        { customer: { lastName: { contains: search } } },
        { customer: { email: { contains: search } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (yachtId) {
      where.yachtId = parseInt(yachtId)
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true },
          },
          yacht: {
            select: {
              name: true,
              modelId: true,
              model: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.booking.count({ where }),
    ])

    return NextResponse.json({ bookings, total })
  } catch (error) {
    console.error("[GET /api/admin/bookings]", error)
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
      customerId, yachtId, dateFrom, dateTo, basePrice, totalPrice,
      status, baseFromId, baseToId, guests, charterType,
      discountAmount, discountPercent, extrasTotal, servicesTotal,
      currency, commission, deposit, depositDueDate, balanceDueDate,
      optionExpiresAt, internalNotes, clientNotes,
    } = body

    if (!customerId || !yachtId || !dateFrom || !dateTo || basePrice === undefined || totalPrice === undefined) {
      return NextResponse.json(
        { error: "customerId, yachtId, dateFrom, dateTo, basePrice, and totalPrice are required" },
        { status: 400 },
      )
    }

    // Generate booking number
    const year = new Date().getFullYear()
    const lastBooking = await db.booking.findFirst({
      where: { bookingNumber: { startsWith: `IYC-${year}-` } },
      orderBy: { bookingNumber: "desc" },
    })
    const nextNum = lastBooking
      ? parseInt(lastBooking.bookingNumber.split("-")[2]) + 1
      : 1
    const bookingNumber = `IYC-${year}-${String(nextNum).padStart(4, "0")}`

    const initialStatus = status ?? "OPTION"

    const booking = await db.booking.create({
      data: {
        bookingNumber,
        customerId,
        yachtId: parseInt(String(yachtId)),
        status: initialStatus,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        ...(baseFromId !== undefined && { baseFromId: parseInt(String(baseFromId)) }),
        ...(baseToId !== undefined && { baseToId: parseInt(String(baseToId)) }),
        ...(guests !== undefined && { guests: parseInt(String(guests)) }),
        ...(charterType !== undefined && { charterType }),
        basePrice: parseFloat(String(basePrice)),
        ...(discountAmount !== undefined && { discountAmount: parseFloat(String(discountAmount)) }),
        ...(discountPercent !== undefined && { discountPercent: parseFloat(String(discountPercent)) }),
        ...(extrasTotal !== undefined && { extrasTotal: parseFloat(String(extrasTotal)) }),
        ...(servicesTotal !== undefined && { servicesTotal: parseFloat(String(servicesTotal)) }),
        totalPrice: parseFloat(String(totalPrice)),
        ...(currency !== undefined && { currency }),
        ...(commission !== undefined && { commission: parseFloat(String(commission)) }),
        ...(deposit !== undefined && { deposit: parseFloat(String(deposit)) }),
        ...(depositDueDate !== undefined && { depositDueDate: depositDueDate ? new Date(depositDueDate) : null }),
        ...(balanceDueDate !== undefined && { balanceDueDate: balanceDueDate ? new Date(balanceDueDate) : null }),
        ...(optionExpiresAt !== undefined && { optionExpiresAt: optionExpiresAt ? new Date(optionExpiresAt) : null }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(clientNotes !== undefined && { clientNotes }),
        statusHistory: {
          create: {
            toStatus: initialStatus,
            changedBy: session.user.id,
          },
        },
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        yacht: { select: { name: true, modelId: true, model: { select: { name: true } } } },
        statusHistory: true,
      },
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/bookings]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
