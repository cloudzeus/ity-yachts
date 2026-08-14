import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { translate } from "@/lib/translate"
import { NextRequest, NextResponse } from "next/server"
import { aiChat } from "@/lib/ai"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const member = await db.staff.findUnique({ where: { id } })
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const name = body.name || member.name
    const dept = body.department?.en || (member.department as Record<string, string>)?.en || ""
    const pos = body.position?.en || (member.position as Record<string, string>)?.en || ""


    const prompt = `Write a professional bio (2-3 sentences) in English for a person named "${name}"${pos ? ` who works as ${pos}` : ""}${dept ? ` in the ${dept} department` : ""} at IYC Yachts, a luxury yacht charter company in Greece. Write in third person, professional and warm tone, as if for a travel industry company profile.`

    let bioEn = ""
    try {
      bioEn = await aiChat({ messages: [{ role: "user", content: prompt }], maxTokens: 300 })
    } catch (err) {
      console.error("[generate-bio]", err)
      return NextResponse.json({ error: "AI request failed" }, { status: 502 })
    }

    // Translate to EL and DE
    let bioEl = ""
    let bioDe = ""
    try {
      bioEl = await translate(bioEn, "el", "en")
      bioDe = await translate(bioEn, "de", "en")
    } catch (err) {
      console.error("[generate-bio] translation error", err)
    }

    const bio = { en: bioEn, el: bioEl, de: bioDe }

    // Save to DB
    await db.staff.update({ where: { id }, data: { bio } })

    return NextResponse.json({ bio })
  } catch (error) {
    console.error("[POST /api/admin/staff/:id/generate-bio]", error)
    const msg = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
