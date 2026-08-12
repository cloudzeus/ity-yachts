import { getSession } from "@/lib/auth-session"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

const EMPTY = { en: "", el: "", de: "" }

/** "Since 1979, our family…" → "since-1979-our-family". */
function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "motto"
  )
}

export async function GET() {
  const session = await getSession()
  if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const mottos = await db.motto.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  })
  return NextResponse.json({ mottos })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const heading = { ...EMPTY, ...(body.heading ?? {}) }

    // Derive the slug from the English heading, then make it unique — the slug
    // is how pages reference a motto, so a collision would silently repoint one.
    const base = slugify(body.slug || heading.en || heading.el || "motto")
    let slug = base
    for (let n = 2; await db.motto.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`

    const last = await db.motto.findFirst({
      where: { category: body.category ?? "hero" },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    })

    const motto = await db.motto.create({
      data: {
        slug,
        category: body.category ?? "hero",
        heading,
        subheading: { ...EMPTY, ...(body.subheading ?? {}) },
        subtext: { ...EMPTY, ...(body.subtext ?? {}) },
        isActive: body.isActive ?? true,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    })
    return NextResponse.json(motto)
  } catch (error) {
    console.error("[POST /api/admin/mottos]", error)
    return NextResponse.json({ error: "Failed to create motto" }, { status: 500 })
  }
}
