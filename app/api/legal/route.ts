import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * The legal pages, for the footer.
 *
 * Titles and slugs only — the bodies run to tens of thousands of characters
 * and the footer needs a list of links, not the documents themselves.
 */
export async function GET() {
  try {
    const row = await db.setting.findUnique({ where: { key: "legal" } })
    const pages = ((row?.value as { pages?: { slug: string; title: Record<string, string>; content: Record<string, string> }[] } | null)?.pages ?? [])
      .filter((p) => p.slug && Object.values(p.content ?? {}).some((v) => v?.trim()))
      .map((p) => ({ slug: p.slug, title: p.title }))

    return NextResponse.json({ pages })
  } catch (error) {
    console.error("[GET /api/legal]", error)
    return NextResponse.json({ pages: [] })
  }
}
