import "dotenv/config"
import { db } from "../lib/db"

/**
 * Links the first mention of a place, a boat type or a wind to the page that
 * explains it.
 *
 * Five of the six articles had no link in the body at all. An article that
 * says "Fiskardo, Meganisi, catamaran" and leads nowhere wastes both the
 * reader's interest and the internal ranking weight the page has earned.
 *
 * Rules, because link-stuffing reads worse than no links:
 *   - the first mention only, once per target per article
 *   - never inside a heading, and never inside an existing link
 *   - never a link from an article to itself
 */
type Rule = { pattern: RegExp; href: string }

const RULES: Record<"en" | "el" | "de", Rule[]> = {
  en: [
    { pattern: /\bMeltemi\b/, href: "/news/why-the-ionian-and-not-the-cyclades" },
    { pattern: /\bMaistros\b/, href: "/news/reading-the-maistros" },
    { pattern: /\bMeganisi\b/, href: "/locations/katomeri" },
    { pattern: /\bLefkada\b/, href: "/locations/lef" },
    { pattern: /\bKefalonia\b/, href: "/locations" },
    { pattern: /\bcatamarans?\b/i, href: "/fleet" },
    { pattern: /\bbareboat\b/i, href: "/fleet" },
    { pattern: /\bskippers? school\b/i, href: "/services/skippers-school" },
  ],
  /* JavaScript's \b is ASCII-only, so it never matches beside a Greek letter.
     Unicode letter lookarounds do the same job for a Greek alphabet. */
  el: [
    { pattern: /(?<!\p{L})μελτέμι(?!\p{L})/u, href: "/news/why-the-ionian-and-not-the-cyclades" },
    { pattern: /(?<!\p{L})μαΐστρος(?!\p{L})/u, href: "/news/reading-the-maistros" },
    { pattern: /(?<!\p{L})Μεγανήσι(?!\p{L})/u, href: "/locations/katomeri" },
    { pattern: /(?<!\p{L})Λευκάδας(?!\p{L})/u, href: "/locations/lef" },
    { pattern: /(?<!\p{L})Κεφαλονιάς?(?!\p{L})/u, href: "/locations" },
    { pattern: /(?<!\p{L})καταμαράν(?!\p{L})/u, href: "/fleet" },
    { pattern: /(?<!\p{L})χωρίς πλήρωμα(?!\p{L})/u, href: "/fleet" },
    { pattern: /(?<!\p{L})σχολή κυβερνητών(?!\p{L})/u, href: "/services/skippers-school" },
  ],
  de: [
    { pattern: /\bMeltemi\b/, href: "/news/why-the-ionian-and-not-the-cyclades" },
    { pattern: /\bMaistros\b/, href: "/news/reading-the-maistros" },
    { pattern: /\bMeganisi\b/, href: "/locations/katomeri" },
    { pattern: /\bLefkada\b/, href: "/locations/lef" },
    { pattern: /\bKefalonia\b/, href: "/locations" },
    { pattern: /\bKatamarane?n?\b/, href: "/fleet" },
    { pattern: /\bBareboat\b/, href: "/fleet" },
    { pattern: /\bSkipperschule\b/, href: "/services/skippers-school" },
  ],
}

/** Walks only the text inside <p> and <li>, so headings and hrefs stay untouched. */
function linkify(html: string, rules: Rule[], selfHref: string): { html: string; added: string[] } {
  const used = new Set<string>()
  const added: string[] = []

  const out = html.replace(/<(p|li)>([\s\S]*?)<\/\1>/g, (block, tag, inner: string) => {
    // A block that already contains a link is left alone entirely.
    if (inner.includes("<a ")) return block

    let text = inner
    for (const rule of rules) {
      if (used.has(rule.href) || rule.href === selfHref) continue
      const m = text.match(rule.pattern)
      if (!m) continue
      text = text.replace(rule.pattern, `<a href="${rule.href}">${m[0]}</a>`)
      used.add(rule.href)
      added.push(`${m[0]} → ${rule.href}`)
    }
    return `<${tag}>${text}</${tag}>`
  })

  return { html: out, added }
}

async function main() {
  const articles = await db.article.findMany({ select: { id: true, slug: true, description: true } })

  for (const a of articles) {
    const desc = { ...(a.description as Record<string, string>) }
    let touched = false

    for (const lang of ["en", "el", "de"] as const) {
      const before = desc[lang]
      if (!before) continue
      if (/<a href="\//.test(before)) continue
      const { html, added } = linkify(before, RULES[lang], `/news/${a.slug}`)
      if (!added.length) continue
      desc[lang] = html
      touched = true
      console.log(`${a.slug} [${lang}] ${added.join("  |  ")}`)
    }

    if (touched) await db.article.update({ where: { id: a.id }, data: { description: desc } })
  }

  // Report the result rather than assume it.
  const after = await db.article.findMany({ select: { slug: true, description: true } })
  console.log("\n— links per article (en) —")
  for (const a of after) {
    const n = ((a.description as Record<string, string>).en?.match(/<a /g) ?? []).length
    console.log(`  ${a.slug.padEnd(42)} ${n}`)
  }
  await db.$disconnect()
}
main()
