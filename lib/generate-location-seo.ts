import { db } from "@/lib/db"
import { aiChat } from "@/lib/ai"

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

    const context = [
      `Location: ${location.name}`,
      location.city && `City: ${location.city}`,
      location.municipality && `Municipality: ${location.municipality}`,
      location.latitude && location.longitude && `Coordinates: ${location.latitude}, ${location.longitude}`,
    ].filter(Boolean).join("\n")

    const cleaned = await aiChat({
      messages: [
        { role: "system", content: `You are an SEO specialist for a luxury yacht charter company in Greece. Generate optimized SEO metadata for a location page.

Return ONLY a valid JSON object with these fields:
{
  "metaTitle": "SEO page title (50-60 characters). Format: '[Location] Yacht Charter | Sailing & Cruising Guide'. Must include location name and a yacht/sailing keyword.",
  "metaDesc": "Meta description (150-160 characters). Compelling summary with location name, yacht charter keyword, and call to action. Must entice clicks from search results."
}

No markdown, no code fences, just JSON.` },
        { role: "user", content: `Generate SEO metadata for this Greek yacht charter destination:\n\n${context}` },
      ],
      temperature: 0.5,
      maxTokens: 600,
      json: true,
    })
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
