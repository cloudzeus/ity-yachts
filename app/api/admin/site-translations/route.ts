import { getSession } from "@/lib/auth-session"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const namespace = req.nextUrl.searchParams.get("namespace")

    const translations = await db.siteTranslation.findMany({
      where: namespace ? { namespace } : undefined,
      orderBy: [{ namespace: "asc" }, { key: "asc" }],
    })

    return NextResponse.json(translations)
  } catch (error) {
    console.error("[GET /api/admin/site-translations]", error)
    return NextResponse.json({ error: "Failed to fetch translations" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { key, namespace, en, el, de } = await req.json()

    if (!key || !en) {
      return NextResponse.json({ error: "Key and English text are required" }, { status: 400 })
    }

    const translation = await db.siteTranslation.upsert({
      where: { key },
      create: { key, namespace: namespace || "common", en, el: el || "", de: de || "" },
      update: { en, el: el || "", de: de || "", namespace: namespace || undefined },
    })

    return NextResponse.json(translation)
  } catch (error) {
    console.error("[POST /api/admin/site-translations]", error)
    return NextResponse.json({ error: "Failed to save translation" }, { status: 500 })
  }
}
