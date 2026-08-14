import "dotenv/config"
import { db } from "../lib/db"

/**
 * Which translatable fields are missing a language.
 *
 * Driven off the schema's Json columns rather than a hand-written list, so a
 * field added later cannot quietly escape the audit. A field counts as
 * translated when the language key holds non-empty text; fields that hold no
 * language at all are skipped, since there is nothing to translate from.
 */
const L = ["en", "el", "de"] as const
type Lang = (typeof L)[number]

const isLangMap = (v: unknown) =>
  !!v && typeof v === "object" && !Array.isArray(v) &&
  L.some((l) => l in (v as Record<string, unknown>))

const filled = (v: unknown, l: Lang) => {
  const s = (v as Record<string, unknown>)?.[l]
  return typeof s === "string" && s.replace(/<[^>]+>/g, "").trim().length > 0
}

const TARGETS: { model: string; fields: string[]; label: (r: Record<string, unknown>) => string }[] = [
  { model: "page", fields: ["content", "heroSection", "translations"], label: (r) => String(r.slug ?? r.id) },
  { model: "textComponent", fields: ["translations"], label: (r) => String(r.name ?? r.id) },
  { model: "location", fields: ["nameTranslations", "shortDesc", "description", "prefecture"], label: (r) => String(r.slug) },
  { model: "itinerary", fields: ["name", "shortDesc"], label: (r) => String(r.slug) },
  { model: "itineraryDay", fields: ["description"], label: (r) => `day ${r.dayNumber ?? String(r.id).slice(0, 6)}` },
  { model: "itineraryLeg", fields: ["name", "description"], label: (r) => String(r.id).slice(0, 8) },
  { model: "review", fields: ["content"], label: (r) => String(r.name) },
  { model: "staff", fields: ["city", "department", "position", "bio"], label: (r) => String(r.name) },
  { model: "article", fields: ["title", "shortDesc", "description"], label: (r) => String(r.slug) },
  { model: "articleCategory", fields: ["name", "description"], label: (r) => String(r.slug) },
  { model: "articleTag", fields: ["name"], label: (r) => String(r.slug) },
  { model: "service", fields: ["title", "label", "header", "shortDesc", "description"], label: (r) => String(r.slug) },
  { model: "motto", fields: ["heading", "subheading", "subtext"], label: (r) => String(r.slug) },
  { model: "faq", fields: ["question", "answer"], label: (r) => String((r.question as Record<string, string>)?.en ?? "").slice(0, 40) },
]

async function main() {
  let grand = 0
  for (const t of TARGETS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: Record<string, unknown>[] = await (db as any)[t.model].findMany()
    const gaps: string[] = []
    for (const r of rows) {
      const missing: string[] = []
      for (const f of t.fields) {
        const v = r[f]
        if (!isLangMap(v)) continue
        if (!L.some((l) => filled(v, l))) continue
        const miss = L.filter((l) => !filled(v, l))
        if (miss.length) { missing.push(`${f}[${miss.join("/")}]`); grand += miss.length }
      }
      if (missing.length) gaps.push(`    ${t.label(r)}: ${missing.join(" ")}`)
    }
    console.log(`${t.model} — ${rows.length} records, ${gaps.length} with gaps`)
    gaps.slice(0, 8).forEach((x) => console.log(x))
    if (gaps.length > 8) console.log(`    … and ${gaps.length - 8} more`)
  }

  const st = await db.siteTranslation.findMany()
  const stGaps = st.filter((x) => L.some((l) => !(x as unknown as Record<string, string>)[l]?.trim()))
  console.log(`\nsiteTranslation — ${st.length} keys, ${stGaps.length} with gaps`)
  stGaps.slice(0, 15).forEach((x) =>
    console.log(`    ${x.key}: missing ${L.filter((l) => !(x as unknown as Record<string, string>)[l]?.trim()).join("/")}`))
  if (stGaps.length > 15) console.log(`    … and ${stGaps.length - 15} more`)

  console.log(`\nTOTAL content field-language gaps: ${grand} | siteTranslation gaps: ${stGaps.length}`)
  await db.$disconnect()
}
main()
