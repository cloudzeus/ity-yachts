import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"
import { PageSection } from "@/types/page"

async function getDeepSeekKey(): Promise<string> {
  const { db } = await import("@/lib/db")
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  if (!record) throw new Error("AI keys not configured")
  const keys = record.value as Record<string, string>
  if (!keys.deepseekKey) throw new Error("DeepSeek API key not configured")
  return keys.deepseekKey
}

function extractPageText(sections: PageSection[]): string {
  const texts: string[] = []

  for (const section of sections) {
    for (const area of section.areas) {
      for (const block of area.blocks) {
        if ("content" in block && block.content) {
          texts.push(block.content)
        } else if (block.type === "image" && "alt" in block && block.alt) {
          texts.push(block.alt)
        }
      }
    }
  }

  return texts.join("\n").slice(0, 2000) // Limit to 2000 chars
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

    const { content, slug } = await req.json()
    if (!Array.isArray(content)) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 })
    }

    const apiKey = await getDeepSeekKey()
    const pageText = extractPageText(content)

    if (!pageText.trim()) {
      return NextResponse.json({ error: "No content to analyze" }, { status: 400 })
    }

    const prompt = `You are an SEO expert for a luxury yacht charter website (Greek, English, German markets).
Generate comprehensive SEO metadata for a page with the following content:

${pageText}

Return a JSON object with these fields:
- metaTitle (max 60 chars): compelling page title
- metaDesc (max 160 chars): engaging description
- metaKeywords (comma-separated, 5-8 keywords related to yacht charters)
- metaOgTitle (max 60 chars, for social media)
- metaOgDesc (max 160 chars, for social media)
- metaRobots (e.g., "index, follow")
- metaCanonical: /${slug}

Return ONLY valid JSON with these exact field names. No markdown code blocks.`

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
            content: "You are a JSON-only API. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[DeepSeek error]", res.status, err)
      return NextResponse.json({ error: "DeepSeek API error" }, { status: 500 })
    }

    const json = await res.json()
    const message = json.choices?.[0]?.message?.content
    if (!message) {
      return NextResponse.json({ error: "No response from DeepSeek" }, { status: 500 })
    }

    // Parse the JSON response
    let metas: Record<string, string>
    try {
      metas = JSON.parse(message)
    } catch {
      // Try to extract JSON from markdown code blocks
      const match = message.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        metas = JSON.parse(match[1])
      } else {
        throw new Error("Invalid JSON response")
      }
    }

    return NextResponse.json({
      metaTitle: metas.metaTitle || "",
      metaDesc: metas.metaDesc || "",
      metaKeywords: metas.metaKeywords || "",
      metaOgTitle: metas.metaOgTitle || "",
      metaOgDesc: metas.metaOgDesc || "",
      metaRobots: metas.metaRobots || "index, follow",
      metaCanonical: metas.metaCanonical || `/${slug}`,
    })
  } catch (error) {
    console.error("[POST /api/admin/pages/[id]/generate-meta]", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
