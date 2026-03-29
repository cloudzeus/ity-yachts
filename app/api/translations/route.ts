import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get("locale") || "en"
    const namespace = req.nextUrl.searchParams.get("namespace")

    const rows = await db.siteTranslation.findMany({
      where: namespace ? { namespace } : undefined,
      select: { key: true, en: true, el: true, de: true },
    })

    const lang = ["en", "el", "de"].includes(locale) ? locale : "en"
    const dict: Record<string, string> = {}

    for (const row of rows) {
      const value = (row as Record<string, string>)[lang]
      dict[row.key] = value || row.en
    }

    return NextResponse.json(dict, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    })
  } catch (error) {
    console.error("[GET /api/translations]", error)
    return NextResponse.json({}, { status: 500 })
  }
}
