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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const itinerary = await db.itinerary.findUnique({ where: { id } })
    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    const body = await req.json()
    const { name, startFrom, totalDays, totalMiles, places, days } = body

    // Build the itinerary summary for the AI
    const placeNames = (places || []).map((p: { name: string }) => p.name).join(", ")

    let daysSummary = ""
    for (const day of days || []) {
      daysSummary += `\nDay ${day.dayNumber}:`
      if (day.description) daysSummary += ` ${day.description}`
      for (const leg of day.legs || []) {
        if (leg.name) daysSummary += `\n  - ${leg.name}`
        if (leg.description) daysSummary += `: ${leg.description}`
      }
    }

    const prompt = `You are a luxury yacht charter marketing copywriter. For this sailing itinerary, generate:
1. A catchy, compelling TITLE (max 10 words, no quotes)
2. A vivid, engaging SHORT DESCRIPTION (2-3 sentences, max 200 words)

Itinerary details:
- Current Name: ${name || "Unnamed"}
- Starting From: ${startFrom || "N/A"}
- Duration: ${totalDays || 0} days
- Total Distance: ${totalMiles || 0} nautical miles
- Places Visited: ${placeNames || "N/A"}

Day-by-Day Details:${daysSummary || "\nNo details provided"}

Respond in EXACTLY this format (no markdown, no extra text):
TITLE: <your title here>
DESCRIPTION: <your description here>`

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
          {
            role: "system",
            content: "You are a professional luxury yacht charter copywriter. You write compelling, aspirational marketing content that makes readers dream of sailing.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[DeepSeek error]", err)
      return NextResponse.json({ error: "DeepSeek API error" }, { status: 502 })
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content?.trim() || ""

    // Parse TITLE: and DESCRIPTION: from response
    const titleMatch = content.match(/TITLE:\s*(.+)/i)
    const descMatch = content.match(/DESCRIPTION:\s*([\s\S]+)/i)

    const title = titleMatch?.[1]?.trim() || ""
    const shortDesc = descMatch?.[1]?.trim() || content

    return NextResponse.json({ title, shortDesc })
  } catch (error) {
    console.error("[POST /api/admin/itineraries/[id]/generate-story]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
