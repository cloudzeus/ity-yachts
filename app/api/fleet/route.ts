import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const pageSize = Math.min(48, Math.max(1, parseInt(searchParams.get("pageSize") ?? "12")))

    // Filters
    const categoryId = searchParams.get("categoryId")
    const baseId = searchParams.get("baseId")
    const builderId = searchParams.get("builderId")
    const cabinsMin = searchParams.get("cabinsMin")
    const cabinsMax = searchParams.get("cabinsMax")
    const yearMin = searchParams.get("yearMin")
    const yearMax = searchParams.get("yearMax")
    const loaMin = searchParams.get("loaMin")
    const loaMax = searchParams.get("loaMax")
    const guestsMin = searchParams.get("guestsMin")
    const charterType = searchParams.get("charterType")
    const sortBy = searchParams.get("sortBy") ?? "name"

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
    if (builderId) where.builderId = parseInt(builderId)
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
    if (guestsMin) {
      where.OR = [
        ...(where.OR ? (where.OR as Prisma.NausysYachtWhereInput[]) : []),
      ]
      where.maxPersons = { gte: parseInt(guestsMin) }
    }
    if (charterType) where.charterType = charterType

    // Sort
    let orderBy: Prisma.NausysYachtOrderByWithRelationInput = { name: "asc" }
    if (sortBy === "loa_desc") orderBy = { loa: "desc" }
    else if (sortBy === "loa_asc") orderBy = { loa: "asc" }
    else if (sortBy === "year_desc") orderBy = { buildYear: "desc" }
    else if (sortBy === "year_asc") orderBy = { buildYear: "asc" }
    else if (sortBy === "cabins_desc") orderBy = { cabins: "desc" }
    else if (sortBy === "newest") orderBy = { updatedAt: "desc" }

    const [yachts, total] = await Promise.all([
      db.nausysYacht.findMany({
        where,
        include: {
          category: true,
          model: { include: { builder: true } },
          base: { include: { location: true } },
          builder: true,
          prices: {
            where: { priceType: "WEEKLY" },
            orderBy: { price: "asc" },
            take: 1,
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.nausysYacht.count({ where }),
    ])

    return NextResponse.json({
      yachts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error("[GET /api/fleet]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
