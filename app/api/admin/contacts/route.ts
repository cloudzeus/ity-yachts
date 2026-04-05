import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")))
    const search = searchParams.get("search")?.trim() ?? ""
    const contactType = searchParams.get("contactType") ?? ""

    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    if (contactType) {
      where.contactType = contactType
    }

    const [contacts, total] = await Promise.all([
      db.nausysContact.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.nausysContact.count({ where }),
    ])

    return NextResponse.json({ contacts, total })
  } catch (error: any) {
    console.error("[GET /api/admin/contacts]", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    // Auto-generate an ID for manual contacts (negative range to avoid collision with NAUSYS IDs)
    const lastManual = await db.nausysContact.findFirst({
      where: { id: { lt: 0 } },
      orderBy: { id: "asc" },
    })
    const newId = lastManual ? lastManual.id - 1 : -1

    const contact = await db.nausysContact.create({
      data: {
        id: newId,
        contactType: body.contactType || "CLIENT",
        title: body.title || "",
        firstName: body.firstName,
        lastName: body.lastName,
        company: body.company || "",
        email: body.email || "",
        phone: body.phone || "",
        mobile: body.mobile || "",
        fax: body.fax || "",
        address: body.address || "",
        city: body.city || "",
        country: body.country || "",
        postcode: body.postcode || "",
        nationality: body.nationality || "",
        passportNumber: body.passportNumber || "",
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        language: body.language || "",
        taxNumber: body.taxNumber || "",
        remarks: body.remarks || null,
      },
    })

    return NextResponse.json({ contact })
  } catch (error: any) {
    console.error("[POST /api/admin/contacts]", error)
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    const contact = await db.nausysContact.update({
      where: { id: parseInt(body.id) },
      data: {
        contactType: body.contactType || "CLIENT",
        title: body.title || "",
        firstName: body.firstName,
        lastName: body.lastName,
        company: body.company || "",
        email: body.email || "",
        phone: body.phone || "",
        mobile: body.mobile || "",
        fax: body.fax || "",
        address: body.address || "",
        city: body.city || "",
        country: body.country || "",
        postcode: body.postcode || "",
        nationality: body.nationality || "",
        passportNumber: body.passportNumber || "",
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        language: body.language || "",
        taxNumber: body.taxNumber || "",
        remarks: body.remarks || null,
      },
    })

    return NextResponse.json({ contact })
  } catch (error: any) {
    console.error("[PUT /api/admin/contacts]", error)
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    await db.nausysContact.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("[DELETE /api/admin/contacts]", error)
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 })
  }
}
