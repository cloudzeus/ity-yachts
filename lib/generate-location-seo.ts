import { db } from "@/lib/db"

async function getDeepSeekKey(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  if (!record) throw new Error("AI keys not configured")
  const keys = record.value as Record<string, string>
  if (!keys.deepseekKey) throw new Error("DeepSeek API key not configured")
  return keys.deepseekKey
}

/**
 * Generates SEO meta title and description for a location and saves them
 * directly to the database. Designed to run in the background — no user
 * interaction required.
 */
export async function generateLocationSeo(locationId: string) {
  try {
    const location = await db.location.findUnique({ where: { id: locationId } })
    if (!location) return

    // Skip if already has SEO meta
    if (location.metaTitle && location.metaDesc) return

    const apiKey = await getDeepSeekKey()

    const context = [
      `Location: ${location.name}`,
      location.city && `City: ${location.city}`,
      location.municipality && `Municipality: ${location.municipality}`,
      location.latitude && location.longitude && `Coordinates: ${location.latitude}, ${location.longitude}`,
    ].filter(Boolean).join("\n")

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
            content: `You are an SEO specialist for a luxury yacht charter company in Greece. Generate optimized SEO metadata for a location page.

Return ONLY a valid JSON object with these fields:
{
  "metaTitle": "SEO page title (50-60 characters). Format: '[Location] Yacht Charter | Sailing & Cruising Guide'. Must include location name and a yacht/sailing keyword.",
  "metaDesc": "Meta description (150-160 characters). Compelling summary with location name, yacht charter keyword, and call to action. Must entice clicks from search results."
}

No markdown, no code fences, just JSON.`,
          },
          {
            role: "user",
            content: `Generate SEO metadata for this Greek yacht charter destination:\n\n${context}`,
          },
        ],
        temperature: 0.5,
      }),
    })

    if (!res.ok) return

    const json = await res.json()
    const raw: string = json.choices[0].message.content.trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
    const seo = JSON.parse(cleaned)

    await db.location.update({
      where: { id: locationId },
      data: {
        metaTitle: seo.metaTitle || null,
        metaDesc: seo.metaDesc || null,
      },
    })

    console.log(`[SEO] Generated meta for location "${location.name}" (${locationId})`)
  } catch (error) {
    console.error(`[SEO] Failed to generate meta for location ${locationId}:`, error)
  }
}
