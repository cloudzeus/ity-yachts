import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { translate } from "@/lib/translate"
import { NextRequest, NextResponse } from "next/server"

async function getDeepSeekKey(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  if (!record) throw new Error("API keys not configured")
  const keys = record.value as Record<string, string>
  if (!keys.deepseekKey) throw new Error("DeepSeek API key not configured")
  return keys.deepseekKey
}

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

    const deepseekKey = await getDeepSeekKey()

    const prompt = `Write a professional bio (2-3 sentences) in English for a person named "${name}"${pos ? ` who works as ${pos}` : ""}${dept ? ` in the ${dept} department` : ""} at IYC Yachts, a luxury yacht charter company in Greece. Write in third person, professional and warm tone, as if for a travel industry company profile.`

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: "DeepSeek API error" }, { status: 502 })
    }

    const json = await res.json()
    const bioEn = json.choices?.[0]?.message?.content?.trim() || ""

    if (!bioEn) {
      return NextResponse.json({ error: "Empty response from DeepSeek" }, { status: 502 })
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
