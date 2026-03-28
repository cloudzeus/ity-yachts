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

async function callDeepSeek(apiKey: string, system: string, user: string) {
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
      temperature: 0.7,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek error ${res.status}: ${err}`)
  }
  const json = await res.json()
  const raw: string = json.choices[0].message.content.trim()
  return raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const location = await db.location.findUnique({ where: { id } })
    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    const apiKey = await getDeepSeekKey()

    const locationContext = [
      `Location: ${location.name}`,
      location.city && `City: ${location.city}`,
      location.municipality && `Municipality: ${location.municipality}`,
      location.latitude && location.longitude && `Coordinates: ${location.latitude}, ${location.longitude}`,
    ].filter(Boolean).join("\n")

    // Generate content + SEO in one call
    const raw = await callDeepSeek(
      apiKey,
      `You are a world-class travel content creator working for Lonely Planet, specializing in luxury yacht charter destinations in Greece. You write compelling, vivid, and informative travel content that inspires affluent travelers to visit these destinations by sea.

Your writing style is:
- Evocative and sensory — paint a picture with words
- Authoritative yet warm — you know these places intimately
- Focused on what makes each destination special for yacht visitors (harbors, anchorages, coastal scenery, local cuisine, cultural highlights)
- Professional and polished — suitable for a luxury yacht charter brand

You must return a JSON object with exactly these fields:
{
  "shortDesc": "A captivating 1-2 sentence summary (max 160 characters) that hooks the reader",
  "description": "A rich 2-3 paragraph description (300-500 words) covering geography, sailing highlights, cultural attractions, dining, and what makes this destination unmissable for yacht visitors",
  "metaTitle": "SEO-optimized page title (50-60 characters). Format: '[Location] Yacht Charter | Sailing & Cruising Guide'. Must include the location name and a yacht/sailing keyword.",
  "metaDesc": "SEO meta description (150-160 characters). Compelling summary that includes location name, yacht charter, and a call to action. Must entice clicks from search results."
}

Return ONLY valid JSON, no markdown, no code fences.`,
      `Write travel content and SEO metadata for this Greek destination:\n\n${locationContext}`
    )

    const content = JSON.parse(raw)

    // Save SEO meta directly to database — user doesn't need to do anything
    await db.location.update({
      where: { id },
      data: {
        metaTitle: content.metaTitle || null,
        metaDesc: content.metaDesc || null,
      },
    })

    return NextResponse.json({
      shortDesc: content.shortDesc || "",
      description: content.description || "",
      metaTitle: content.metaTitle || "",
      metaDesc: content.metaDesc || "",
    })
  } catch (error) {
    console.error("[POST /api/admin/locations/[id]/generate-content]", error)
    const msg = error instanceof Error ? error.message : "Content generation failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
