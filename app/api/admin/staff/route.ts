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
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")))
    const search = searchParams.get("search") ?? ""

    const where = search
      ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
      : {}

    const [staff, total] = await Promise.all([
      db.staff.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.staff.count({ where }),
    ])

    return NextResponse.json({ staff, total })
  } catch (error) {
    console.error("[GET /api/admin/staff]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const {
      userId, name, email, phone, mobile, address,
      city, latitude, longitude, department, position, bio, image,
    } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const member = await db.staff.create({
      data: {
        userId: userId || null,
        name,
        email: email ?? "",
        phone: phone ?? "",
        mobile: mobile ?? "",
        address: address ?? "",
        city: city ?? {},
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        department: department ?? {},
        position: position ?? {},
        bio: bio ?? {},
        image: image ?? null,
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/staff]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
