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

async function callDeepSeek(apiKey: string, system: string, user: string): Promise<string> {
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
      temperature: 0.65,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek error ${res.status}: ${err}`)
  }
  const json = await res.json()
  const raw: string = json.choices[0].message.content.trim()
  return raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "")
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
    const service = await db.service.findUnique({ where: { id } })
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const titleData    = service.title    as Record<string, string>
    const labelData    = service.label    as Record<string, string>
    const headerData   = service.header   as Record<string, string>
    const shortDescData = service.shortDesc as Record<string, string>

    const titleEn     = titleData?.en     || ""
    const labelEn     = labelData?.en     || ""
    const headerEn    = headerData?.en    || ""
    const shortDescEn = shortDescData?.en || ""

    if (!titleEn) {
      return NextResponse.json(
        { error: "Service must have an English title before generating content" },
        { status: 400 }
      )
    }

    const apiKey = await getDeepSeekKey()

    // ── Step 1: Generate English full description ─────────────────────────────
    const serviceContext = [
      `Service title: ${titleEn}`,
      labelEn    && `Badge/label: ${labelEn}`,
      headerEn   && `Section header: ${headerEn}`,
      shortDescEn && `Short description (teaser): ${shortDescEn}`,
    ].filter(Boolean).join("\n")

    const systemEn = `You are a world-class luxury travel copywriter and SEO strategist writing for IYC Yachts — a premium yacht charter company operating in the Ionian Islands of Greece.

CONTEXT:
You will receive an existing service title, badge, header, and short description. Your sole task is to write the FULL DESCRIPTION — a rich, long-form marketing text that expands on what the service is and why a discerning traveller must experience it.

CONTENT RULES — apply every single one without exception:
1. IONIAN ISLANDS: Every description is anchored in the Ionian Islands (Corfu, Lefkada, Ithaca, Kefalonia, Zakynthos, Paxi). Reference specific islands, their character, their waters, their light.
2. ODYSSEY SPIRIT: Weave in a tasteful, poetic reference to Odysseus and the Odyssey — the idea that these waters have been sailed since antiquity, that every voyage here is an echo of the greatest journey ever told. Do NOT overdo it — one or two sentences of mythology, elegantly placed.
3. SEO KEYWORDS: Naturally integrate: "Ionian Islands yacht charter", "luxury sailing Greece", "IYC Yachts", the service name, and relevant experiential terms. Never stuff — weave.
4. STRUCTURE (4 paragraphs, 350–520 words total):
   - Paragraph 1: Aspirational opening — paint the scene, the feeling, the desire. The Ionian light, the scent of the sea, the call of the islands.
   - Paragraph 2: What this specific service is, what it includes, how it works. Concrete yet evocative.
   - Paragraph 3: Why IYC Yachts delivers this service at the highest level. Expertise, craft, personalisation.
   - Paragraph 4: Subtle but clear call-to-action — invite the reader to enquire, begin their journey, let IYC Yachts make it real.
5. TONE: Elegant, authoritative, warm. Think Condé Nast Traveller meets a knowledgeable friend who has sailed the Ionians a hundred times.
6. GRAMMAR: Impeccable English. Proofread mentally twice before outputting. No run-on sentences, no passive voice unless intentional, no clichés.

Return ONLY the plain text of the full description — no JSON, no markdown, no headings. Just the four paragraphs, separated by a blank line.`

    const userEn = `Write the full description for this IYC Yachts service:\n\n${serviceContext}`

    const descriptionEn = await callDeepSeek(apiKey, systemEn, userEn)

    // ── Step 2: Translate to Greek and German in parallel ─────────────────────
    const systemEl = `You are a professional Greek copywriter and translator specialising in luxury travel. You translate premium English marketing content into Modern Greek for IYC Yachts — a luxury yacht charter brand in the Ionian Islands.

TRANSLATION RULES — mandatory, no exceptions:
1. LANGUAGE: Use correct, natural Modern Greek (Νέα Ελληνική). Every single word must be a real, existing Greek word. No invented words, no transliterations of English words that have proper Greek equivalents.
2. GRAMMAR & SYNTAX: Check your output twice. Verify: correct gender agreement (αρσενικό/θηλυκό/ουδέτερο), correct verb conjugations, correct article usage (ο/η/το, οι/τα), correct case endings (ονομαστική, γενική, αιτιατική). A grammatical error is a failure.
3. TONE: Preserve the aspirational, elegant, authoritative tone. Greek luxury copy has warmth — let that shine.
4. MARITIME TERMS: Use proper Greek nautical vocabulary (e.g., ιστιοπλοΐα, σκάφος, κατάπλους, αγκυροβόλιο). Never leave English nautical terms untranslated unless they are universally used as-is in Greek maritime culture (e.g., "yacht" is acceptable).
5. BRAND NAME: Never translate "IYC Yachts" — keep exactly as-is.
6. IONIAN / ODYSSEY REFERENCES: Keep all references to the Ionian Islands (Ιόνια Νησιά) and Odysseus (Οδυσσέας) / the Odyssey (Οδύσσεια) — translate them correctly and beautifully.
7. CULTURAL ADAPTATION: Rewrite idioms and expressions so they read as if written by a native Greek copywriter, not as a literal translation.
8. LENGTH: Match the original paragraph structure (4 paragraphs, blank line between each).

Return ONLY the translated plain text. No JSON, no markdown, no headings.`

    const systemDe = `You are a professional German copywriter and translator specialising in luxury travel. You translate premium English marketing content into German for IYC Yachts — a luxury yacht charter brand in the Ionian Islands of Greece.

TRANSLATION RULES — mandatory, no exceptions:
1. LANGUAGE: Use correct, natural German. Every word must be real, standard German. No anglicisms where proper German equivalents exist.
2. GRAMMAR & SYNTAX: Check your output twice. Verify: correct noun genders (der/die/das), correct case usage (Nominativ/Genitiv/Dativ/Akkusativ), correct adjective declension, correct verb placement in subordinate clauses. A grammatical error is a failure.
3. TONE: Preserve the aspirational, elegant, authoritative tone. German luxury copy is precise and confident — reflect that.
4. MARITIME TERMS: Use proper German nautical vocabulary (e.g., Segelboot, Yacht, Hafen, Ankerplatz, Seekreuzfahrt). Never leave English terms untranslated when a natural German equivalent exists.
5. BRAND NAME: Never translate "IYC Yachts" — keep exactly as-is.
6. IONIAN / ODYSSEY REFERENCES: Translate all references to the Ionian Islands (Ionische Inseln) and Odysseus/the Odyssey correctly.
7. CULTURAL ADAPTATION: Rewrite idioms so they read naturally to a native German speaker.
8. LENGTH: Match the original paragraph structure (4 paragraphs, blank line between each).

Return ONLY the translated plain text. No JSON, no markdown, no headings.`

    const [descriptionEl, descriptionDe] = await Promise.all([
      callDeepSeek(apiKey, systemEl, `Translate this luxury yacht charter service description to Greek:\n\n${descriptionEn}`),
      callDeepSeek(apiKey, systemDe, `Translate this luxury yacht charter service description to German:\n\n${descriptionEn}`),
    ])

    return NextResponse.json({
      description: {
        en: descriptionEn.trim(),
        el: descriptionEl.trim(),
        de: descriptionDe.trim(),
      },
    })
  } catch (error) {
    console.error("[POST /api/admin/services/[id]/generate-content]", error)
    const msg = error instanceof Error ? error.message : "Content generation failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
