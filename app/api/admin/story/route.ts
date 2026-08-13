import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

/**
 * The "Our story" page, as one document.
 *
 * The copy is stored as the page's text_components, which the generic page
 * editor can also reach — but that editor is a flat list of keys, and this
 * page has nine chapters in three languages plus a photograph each. So it
 * gets its own endpoint, keyed rather than id-based.
 */
const SLUG = "about-us"

const ALLOWED = ["ADMIN", "MANAGER", "EDITOR"]

async function guard() {
  const session = await getSession()
  if (!session.user || !ALLOWED.includes(session.user.role)) return null
  return session
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const page = await db.page.findUnique({
    where: { slug: SLUG },
    select: { id: true, textComponents: { select: { key: true, translations: true } } },
  })
  if (!page) return NextResponse.json({ error: "Story page not found" }, { status: 404 })

  const copy: Record<string, Record<string, string>> = {}
  for (const c of page.textComponents) {
    copy[c.key] = (c.translations ?? {}) as Record<string, string>
  }

  return NextResponse.json({ copy })
}

export async function PUT(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const page = await db.page.findUnique({ where: { slug: SLUG }, select: { id: true } })
  if (!page) return NextResponse.json({ error: "Story page not found" }, { status: 404 })

  const body = (await req.json()) as { copy?: Record<string, Record<string, string>> }
  const copy = body.copy
  if (!copy || typeof copy !== "object") {
    return NextResponse.json({ error: "Missing copy" }, { status: 400 })
  }

  /* Only the keys sent are touched, so two people editing different chapters
     do not overwrite each other's work. */
  for (const [key, translations] of Object.entries(copy)) {
    if (!key.startsWith("story.")) continue
    await db.textComponent.upsert({
      where: { pageId_key: { pageId: page.id, key } },
      create: { pageId: page.id, key, translations },
      update: { translations },
    })
  }

  return NextResponse.json({ ok: true, saved: Object.keys(copy).length })
}
