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
    /* Length, not the alphabet. A charter fleet is browsed by size — how many
       it sleeps, how it handles — and a list running Aiolos, Anemos, Asteri
       tells a visitor nothing about which boat suits them. */
    const sortBy = searchParams.get("sortBy") ?? "loa_desc"

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
    /* Berths filter. It read `maxPersons`, which NAUSYS leaves null on every
       one of our yachts — so any guest filter returned an empty fleet, always.
       Berths live in `berthsTotal`; `maxPersons` is only a fallback, which is
       how the cards and the detail page have always read it.

       Goes in AND, not OR: `search` already owns `where.OR`, and assigning
       over it would have widened the search instead of narrowing it. */
    if (guestsMin) {
      const min = parseInt(guestsMin)
      if (Number.isFinite(min)) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          {
            OR: [
              { berthsTotal: { gte: min } },
              { berthsTotal: null, maxPersons: { gte: min } },
            ],
          },
        ]
      }
    }
    if (charterType) where.charterType = charterType

    /* Every sort carries the name as a tiebreaker. Four boats share 9.99 m and
       three other lengths are duplicated, so without it their order is
       whatever the database returns and can differ between two identical
       requests — the same page, reshuffled, on a reload. */
    const SORTS: Record<string, Prisma.NausysYachtOrderByWithRelationInput[]> = {
      loa_desc: [{ loa: "desc" }, { name: "asc" }],
      loa_asc: [{ loa: "asc" }, { name: "asc" }],
      year_desc: [{ buildYear: "desc" }, { name: "asc" }],
      year_asc: [{ buildYear: "asc" }, { name: "asc" }],
      cabins_desc: [{ cabins: "desc" }, { loa: "desc" }, { name: "asc" }],
      newest: [{ updatedAt: "desc" }, { name: "asc" }],
      name: [{ name: "asc" }],
    }
    const orderBy = SORTS[sortBy] ?? SORTS.loa_desc

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
