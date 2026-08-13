import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { primaryName, slugify, type Taxonomy } from "@/lib/taxonomy"

export const dynamic = "force-dynamic"

const ROLES = ["ADMIN", "MANAGER", "EDITOR"]

/**
 * Article categories and tags.
 *
 * One route for both: they differ only in which table they sit in, and giving
 * them separate near-identical handlers is how the two slowly stop behaving
 * the same.
 */
function isTaxonomy(v: string): v is Taxonomy {
  return v === "categories" || v === "tags"
}

async function guard() {
  const session = await getSession()
  if (!session.user || !ROLES.includes(session.user.role)) return false
  return true
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { type } = await params
  if (!isTaxonomy(type)) return NextResponse.json({ error: "Unknown taxonomy" }, { status: 404 })

  if (type === "categories") {
    const rows = await db.articleCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { articles: true } } },
    })
    return NextResponse.json({
      items: rows.map(({ _count, ...r }) => ({ ...r, articleCount: _count.articles })),
    })
  }

  const rows = await db.articleTag.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { articles: true } } },
  })
  return NextResponse.json({
    items: rows.map(({ _count, ...r }) => ({ ...r, articleCount: _count.articles })),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { type } = await params
  if (!isTaxonomy(type)) return NextResponse.json({ error: "Unknown taxonomy" }, { status: 404 })

  const body = await req.json()
  const name = (body.name ?? {}) as Record<string, string>
  const label = primaryName(name)
  if (!label) return NextResponse.json({ error: "A name is required" }, { status: 400 })

  // New rows go to the end, so adding one never reshuffles what is there.
  const last =
    type === "categories"
      ? await db.articleCategory.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } })
      : await db.articleTag.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } })
  const sortOrder = (last?.sortOrder ?? -1) + 1

  const slug = await uniqueSlug(type, body.slug?.trim() || slugify(label))

  try {
    if (type === "categories") {
      const row = await db.articleCategory.create({
        data: {
          slug, name, sortOrder, status: body.status || "active",
          description: body.description ?? undefined,
          color: body.color ?? null,
        },
      })
      return NextResponse.json({ item: row })
    }
    const row = await db.articleTag.create({
      data: { slug, name, sortOrder, status: body.status || "active" },
    })
    return NextResponse.json({ item: row })
  } catch {
    return NextResponse.json({ error: "Could not create" }, { status: 500 })
  }
}

/**
 * Reorder. The whole order arrives at once rather than as a pair of swapped
 * indices — a drag can move an item across many positions, and rewriting the
 * list is the only version that cannot drift out of step with the screen.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { type } = await params
  if (!isTaxonomy(type)) return NextResponse.json({ error: "Unknown taxonomy" }, { status: 404 })

  const { order } = (await req.json()) as { order: string[] }
  if (!Array.isArray(order)) return NextResponse.json({ error: "order[] required" }, { status: 400 })

  await db.$transaction(
    order.map((id, i) =>
      type === "categories"
        ? db.articleCategory.update({ where: { id }, data: { sortOrder: i } })
        : db.articleTag.update({ where: { id }, data: { sortOrder: i } })
    )
  )
  return NextResponse.json({ ok: true })
}

async function uniqueSlug(type: Taxonomy, base: string) {
  let slug = base
  for (let n = 2; n < 50; n++) {
    const taken =
      type === "categories"
        ? await db.articleCategory.findUnique({ where: { slug }, select: { id: true } })
        : await db.articleTag.findUnique({ where: { slug }, select: { id: true } })
    if (!taken) return slug
    slug = `${base}-${n}`
  }
  return `${base}-${Date.now()}`
}
