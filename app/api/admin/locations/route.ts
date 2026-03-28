import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { generateLocationSeo } from "@/lib/generate-location-seo"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10")))
    const search = searchParams.get("search") ?? ""

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { slug: { contains: search } },
            { city: { contains: search } },
          ],
        }
      : {}

    const [locations, total] = await Promise.all([
      db.location.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.location.count({ where }),
    ])

    return NextResponse.json({ locations, total })
  } catch (error) {
    console.error("[GET /api/admin/locations]", error)
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
    const { name, slug, nameTranslations, shortDesc, description, prefecture, city, municipality, latitude, longitude, defaultMedia, defaultMediaType, images } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const finalSlug = (slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) || "location"

    // Ensure unique slug — append suffix if needed
    let uniqueSlug = finalSlug
    const existing = await db.location.findUnique({ where: { slug: uniqueSlug } })
    if (existing) {
      let suffix = 2
      while (await db.location.findUnique({ where: { slug: `${finalSlug}-${suffix}` } })) {
        suffix++
      }
      uniqueSlug = `${finalSlug}-${suffix}`
    }

    const location = await db.location.create({
      data: {
        name,
        slug: uniqueSlug,
        nameTranslations: nameTranslations ?? {},
        shortDesc: shortDesc ?? {},
        description: description ?? {},
        prefecture: prefecture ?? {},
        city: city ?? "",
        municipality: municipality ?? "",
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        defaultMedia: defaultMedia ?? null,
        defaultMediaType: defaultMediaType ?? null,
        images: images ?? [],
      },
    })

    // Fire-and-forget: generate SEO meta in the background
    generateLocationSeo(location.id).catch(() => {})

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/locations]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
