import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10")))
    const search = searchParams.get("search") ?? ""
    const sortBy = searchParams.get("sortBy") ?? "createdAt"
    const sortDir = (searchParams.get("sortDir") ?? "desc") as "asc" | "desc"

    const allowedSort = ["name", "email", "role", "createdAt"]
    const orderBy = allowedSort.includes(sortBy) ? sortBy : "createdAt"

    // Build where clause — skip role filter if search doesn't match a valid enum
    const validRoles = ["ADMIN", "MANAGER", "EDITOR", "CUSTOMER", "EMPLOYEE"]
    const searchUpper = search.toUpperCase()
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            ...(validRoles.includes(searchUpper) ? [{ role: { equals: searchUpper as any } }] : []),
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { [orderBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, pageSize })
  } catch (error) {
    console.error("[GET /api/admin/users]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { name, email, password, role } = body

  if (!email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: { name, email, password: hashedPassword, role },
    select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
  })

  return NextResponse.json({ user }, { status: 201 })
}
