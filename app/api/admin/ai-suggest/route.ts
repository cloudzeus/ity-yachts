import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

async function getDeepSeekKey(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  if (!record) throw new Error("AI keys not configured")
  const keys = record.value as Record<string, string>
  if (!keys.deepseekKey) throw new Error("DeepSeek API key not configured")
  return keys.deepseekKey
}

async function askDeepSeek(system: string, user: string): Promise<string> {
  const apiKey = await getDeepSeekKey()
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek error ${res.status}: ${err}`)
  }
  const json = await res.json()
  return json.choices[0].message.content.trim()
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { type, name } = await req.json()

    if (!type || !name) {
      return NextResponse.json({ error: "Missing type or name" }, { status: 400 })
    }

    if (type === "icon") {
      // Suggest react-icons for a yacht category
      const result = await askDeepSeek(
        `You are a UI/UX expert for a luxury yacht charter website. You know the react-icons library thoroughly, especially the Font Awesome (Fa), Material Design (Md), and Game Icons (Gi) sets. Given a yacht category name, suggest the 5 best matching icon names from react-icons. Return ONLY a JSON array of strings with icon names, no explanation. Example: ["FaSailboat","FaShip","GiSailboat","MdDirectionsBoat","FaAnchor"]`,
        `Yacht category: "${name}"`
      )
      const icons = JSON.parse(result)
      return NextResponse.json({ icons })
    }

    if (type === "logo") {
      // Find the official logo/website for a yacht or engine builder
      const result = await askDeepSeek(
        `You are a maritime industry expert. Given the name of a yacht manufacturer or marine engine manufacturer, provide information to help find their official logo. Return ONLY a JSON object with these fields:
- "officialName": the full official company name
- "website": the official website URL (best guess based on your knowledge)
- "logoSearchQuery": a Google image search query that would find their official SVG/vector logo
- "wikipediaName": the Wikipedia article name if one exists, or null
- "notes": any helpful notes about the company (e.g. "acquired by X in 2020", "also known as Y")
Do not invent URLs you are not confident about. If unsure, set website to null.`,
        `Company name: "${name}"`
      )
      const info = JSON.parse(result)
      return NextResponse.json({ info })
    }

    return NextResponse.json({ error: "Invalid type. Use 'icon' or 'logo'" }, { status: 400 })
  } catch (error) {
    console.error("[POST /api/admin/ai-suggest]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI suggestion failed" },
      { status: 500 }
    )
  }
}
