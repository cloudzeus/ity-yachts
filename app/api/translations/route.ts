import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const namespace = req.nextUrl.searchParams.get("namespace")

    const rows = await db.siteTranslation.findMany({
      where: namespace ? { namespace } : undefined,
      select: { key: true, en: true, el: true, de: true },
    })

    // Return all languages keyed by locale: { en: { key: value }, el: { key: value }, de: { key: value } }
    const all: Record<string, Record<string, string>> = { en: {}, el: {}, de: {} }

    for (const row of rows) {
      all.en[row.key] = row.en || row.key
      all.el[row.key] = row.el || row.en || row.key
      all.de[row.key] = row.de || row.en || row.key
    }

    return NextResponse.json(all, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    })
  } catch (error) {
    console.error("[GET /api/translations]", error)
    return NextResponse.json({ en: {}, el: {}, de: {} }, { status: 500 })
  }
}
