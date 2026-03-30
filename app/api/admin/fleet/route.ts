import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "25")))

    // Filters
    const categoryId = searchParams.get("categoryId")
    const baseId = searchParams.get("baseId")
    const cabinsMin = searchParams.get("cabinsMin")
    const cabinsMax = searchParams.get("cabinsMax")
    const yearMin = searchParams.get("yearMin")
    const yearMax = searchParams.get("yearMax")
    const loaMin = searchParams.get("loaMin")
    const loaMax = searchParams.get("loaMax")
    const berthsMin = searchParams.get("berthsMin")
    const isOwnFleet = searchParams.get("isOwnFleet")

    const where: Prisma.NausysYachtWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { model: { name: { contains: search } } },
        { model: { builder: { name: { contains: search } } } },
      ]
    }
    if (categoryId) where.categoryId = parseInt(categoryId)
    if (baseId) where.baseId = parseInt(baseId)
    if (cabinsMin || cabinsMax) {
      where.cabins = {}
      if (cabinsMin) where.cabins.gte = parseInt(cabinsMin)
      if (cabinsMax) where.cabins.lte = parseInt(cabinsMax)
    }
    if (yearMin || yearMax) {
      where.buildYear = {}
      if (yearMin) where.buildYear.gte = parseInt(yearMin)
      if (yearMax) where.buildYear.lte = parseInt(yearMax)
    }
    if (loaMin || loaMax) {
      where.loa = {}
      if (loaMin) where.loa.gte = parseFloat(loaMin)
      if (loaMax) where.loa.lte = parseFloat(loaMax)
    }
    if (berthsMin) {
      where.berthsTotal = { gte: parseInt(berthsMin) }
    }
    if (isOwnFleet === "true") where.isOwnFleet = true

    const [yachts, total] = await Promise.all([
      db.nausysYacht.findMany({
        where,
        include: {
          model: { include: { category: true, builder: true } },
          base: { include: { location: true } },
          _count: { select: { equipment: true, cabinDefinitions: true, prices: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.nausysYacht.count({ where }),
    ])

    return NextResponse.json({ yachts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (error) {
    console.error("[GET /api/admin/fleet]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
