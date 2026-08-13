import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { primaryName, slugify, type Taxonomy } from "@/lib/taxonomy"

export const dynamic = "force-dynamic"

const ROLES = ["ADMIN", "MANAGER", "EDITOR"]

function isTaxonomy(v: string): v is Taxonomy {
  return v === "categories" || v === "tags"
}

async function guard() {
  const session = await getSession()
  return Boolean(session.user && ROLES.includes(session.user.role))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { type, id } = await params
  if (!isTaxonomy(type)) return NextResponse.json({ error: "Unknown taxonomy" }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.name) {
    if (!primaryName(body.name)) return NextResponse.json({ error: "A name is required" }, { status: 400 })
    data.name = body.name
  }
  if (typeof body.status === "string") data.status = body.status
  if (type === "categories") {
    if (body.description !== undefined) data.description = body.description
    if (body.color !== undefined) data.color = body.color || null
  }
  /* The slug is what the public URL is built from, so it is only regenerated
     when explicitly sent — renaming a category should not silently break every
     link that already points at it. */
  if (typeof body.slug === "string" && body.slug.trim()) {
    data.slug = slugify(body.slug)
  }

  try {
    const item =
      type === "categories"
        ? await db.articleCategory.update({ where: { id }, data })
        : await db.articleTag.update({ where: { id }, data })
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: "Could not update" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { type, id } = await params
  if (!isTaxonomy(type)) return NextResponse.json({ error: "Unknown taxonomy" }, { status: 404 })

  /* A category in use is not deleted out from under its articles. Retiring it
     keeps them intact and takes it out of the pickers; the caller can force a
     delete once it is genuinely empty. */
  if (type === "categories") {
    const used = await db.article.count({ where: { categoryId: id } })
    if (used > 0) {
      const item = await db.articleCategory.update({ where: { id }, data: { status: "retired" } })
      return NextResponse.json({ item, retired: true, articleCount: used })
    }
    await db.articleCategory.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  // A tag carries no content of its own; unlinking it loses nothing.
  await db.articleTag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
