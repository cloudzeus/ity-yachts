import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { aiChat } from "@/lib/ai"
import { primaryName } from "@/lib/taxonomy"

export const dynamic = "force-dynamic"
export const maxDuration = 120

/**
 * Draft an article from a brief.
 *
 * Writes all three languages in one pass rather than writing English and
 * translating it: a translated article reads like a translated article. Each
 * language is written for its own reader, from the same brief.
 *
 * The result is a draft for an editor to work on — never published directly.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { topic, categoryId, tagIds, tone, length } = (await req.json()) as {
      topic: string
      categoryId?: string
      tagIds?: string[]
      tone?: string
      length?: "short" | "standard" | "long"
    }

    if (!topic?.trim()) {
      return NextResponse.json({ error: "A topic is required" }, { status: 400 })
    }

    // Give the model the taxonomy it must write inside, so the piece lands in
    // the section it was asked for rather than inventing its own framing.
    const [category, tags] = await Promise.all([
      categoryId ? db.articleCategory.findUnique({ where: { id: categoryId } }) : null,
      tagIds?.length ? db.articleTag.findMany({ where: { id: { in: tagIds } } }) : [],
    ])

    const words = length === "short" ? "350–500" : length === "long" ? "1100–1500" : "700–900"

    let raw: string
    try {
      raw = await aiChat({
        temperature: 0.75,
        maxTokens: 6000,
        messages: [
          {
            role: "system",
            content: `You write for Ionische Yacht Charter — a German-Greek family business on its own pontoon in Lefkada harbour, chartering sailing yachts and catamarans in the Ionian Sea since 1979.

Voice: plain, specific, and written by someone who has actually sailed these waters. Name real places, winds and distances. No superlatives stacked on superlatives, no "nestled", no "gem", no "unforgettable". A reader should finish knowing something they did not know.

Facts you may rely on: every charter starts and finishes in Lefkada; the prevailing summer wind is the Maistros, a north-westerly that gets up late morning and rarely passes 5 Bft; nothing in the Ionian is more than about 30 nautical miles from a protected harbour. Do not invent prices, dates, yacht names or availability.

Write the article three times over — English, Greek and German — each for its own reader, not translated from the others. Greek uses sentence case: only the first word and proper nouns take a capital.

Reply with a JSON object and nothing else:
{
  "title":     {"en":"","el":"","de":""},
  "shortDesc": {"en":"","el":"","de":""},
  "description": {"en":"","el":"","de":""},
  "metaTitle": "",
  "metaDesc":  "",
  "suggestedTags": ["lowercase-slug", ...],
  "readMinutes": 0
}

"shortDesc" is one or two sentences for a listing card. "description" is the article body as simple HTML — <h2>, <p>, <ul>/<li>, <blockquote> only, no inline styles, no <h1>. Aim for ${words} words per language. "metaTitle" is at most 60 characters and "metaDesc" at most 155, both in English. "suggestedTags" is up to six lowercase hyphenated slugs.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              topic: topic.trim(),
              category: category ? primaryName(category.name as Record<string, string>) : null,
              existingTags: tags.map((t) => primaryName(t.name as Record<string, string>)),
              tone: tone?.trim() || "informative, warm, first-hand",
            }),
          },
        ],
      })
    } catch (err) {
      console.error("[articles/generate]", err)
      return NextResponse.json({ error: "The writer did not answer" }, { status: 502 })
    }

    return NextResponse.json({ draft: parseDraft(raw) })
  } catch (err) {
    console.error("[articles/generate]", err)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}

interface Draft {
  title: Record<string, string>
  shortDesc: Record<string, string>
  description: Record<string, string>
  metaTitle: string
  metaDesc: string
  suggestedTags: string[]
  readMinutes: number | null
}

/** Tolerant of a code fence or a sentence either side of the object. */
function parseDraft(raw: string): Draft {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(text)
  } catch {
    const a = text.indexOf("{")
    const b = text.lastIndexOf("}")
    if (a === -1 || b <= a) throw new Error("no JSON object in reply")
    parsed = JSON.parse(text.slice(a, b + 1))
  }

  const i18n = (v: unknown): Record<string, string> => {
    const o = (v ?? {}) as Record<string, unknown>
    return { en: String(o.en ?? ""), el: String(o.el ?? ""), de: String(o.de ?? "") }
  }

  const description = i18n(parsed.description)
  const minutes = Number(parsed.readMinutes)

  return {
    title: i18n(parsed.title),
    shortDesc: i18n(parsed.shortDesc),
    description,
    metaTitle: String(parsed.metaTitle ?? "").slice(0, 70),
    metaDesc: String(parsed.metaDesc ?? "").slice(0, 170),
    suggestedTags: Array.isArray(parsed.suggestedTags)
      ? parsed.suggestedTags.map(String).slice(0, 6)
      : [],
    // Trust the count only if it is plausible; otherwise measure the text.
    readMinutes:
      Number.isFinite(minutes) && minutes > 0 && minutes < 60
        ? Math.round(minutes)
        : estimateMinutes(description.en || description.el || description.de),
  }
}

/** 200 words a minute, on the text with the markup stripped. */
function estimateMinutes(html: string): number | null {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length
  return words ? Math.max(1, Math.round(words / 200)) : null
}
