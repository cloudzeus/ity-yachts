import { getSession } from "@/lib/auth-session"
import { translate } from "@/lib/translate"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { text, languages } = await req.json()

    if (!text || !languages || !Array.isArray(languages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const translations: Record<string, string> = {}

    for (const lang of languages) {
      try {
        translations[lang] = await translate(text, lang, "en")
      } catch (err) {
        console.error(`[translate to ${lang}]`, err)
        throw err
      }
    }

    return NextResponse.json({ translations })
  } catch (error) {
    console.error("[POST /api/admin/translate]", error)
    return NextResponse.json({ error: "Translation failed" }, { status: 500 })
  }
}
