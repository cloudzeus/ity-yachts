import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { aiChat } from "@/lib/ai"

export const dynamic = "force-dynamic"

/**
 * Write the search title and description for an article.
 *
 * Takes the text rather than an id, so it works on a draft that has not been
 * saved yet — which is when you actually want it.
 *
 * Both fields are hard-limited: a meta title over 60 characters and a
 * description over 155 get cut off in the results page, and a truncated
 * sentence reads worse than a shorter one written to fit.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { title, shortDesc, description } = (await req.json()) as {
      title?: string
      shortDesc?: string
      description?: string
    }

    const body = (description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    const source = [title, shortDesc, body].filter(Boolean).join("\n\n").slice(0, 4000)
    if (!source.trim()) {
      return NextResponse.json({ error: "Nothing to work from" }, { status: 400 })
    }

    let raw: string
    try {
      raw = await aiChat({
        temperature: 0.5,
        maxTokens: 400,
        messages: [
          {
            role: "system",
            content: `You write search listings for Ionische Yacht Charter, a German-Greek yacht charter business sailing the Ionian from Lefkada.

Write a title of at most 60 characters and a description of at most 155, both in English, both about the article given to you. Say what the reader will get, in plain words. No "discover", no "ultimate guide", no exclamation marks, no stuffing the same phrase twice. Do not invent prices, dates or yacht names.

Reply with a JSON object and nothing else:
{"metaTitle": "", "metaDesc": ""}`,
          },
          { role: "user", content: source },
        ],
      })
    } catch (err) {
      console.error("[articles/generate-meta]", err)
      return NextResponse.json({ error: "It did not come back" }, { status: 502 })
    }

    const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim()
    let parsed: { metaTitle?: unknown; metaDesc?: unknown }
    try {
      parsed = JSON.parse(text)
    } catch {
      const a = text.indexOf("{")
      const b = text.lastIndexOf("}")
      if (a === -1 || b <= a) return NextResponse.json({ error: "Unreadable reply" }, { status: 502 })
      parsed = JSON.parse(text.slice(a, b + 1))
    }

    return NextResponse.json({
      metaTitle: clamp(String(parsed.metaTitle ?? ""), 60),
      metaDesc: clamp(String(parsed.metaDesc ?? ""), 155),
    })
  } catch (err) {
    console.error("[articles/generate-meta]", err)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}

/** Trim to the limit on a word boundary rather than mid-word. */
function clamp(s: string, max: number) {
  const t = s.trim().replace(/\s+/g, " ")
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const space = cut.lastIndexOf(" ")
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, "")
}
