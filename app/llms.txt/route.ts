import { db } from "@/lib/db"
import { getSiteSettings } from "@/lib/site-settings"
import { en } from "@/lib/seo"

export const dynamic = "force-dynamic"

/**
 * llms.txt — a plain-text brief for AI answer engines.
 *
 * An emerging convention: a single readable file stating who a site belongs
 * to, what it actually offers, and where the substantive pages are, so a model
 * summarising the business does not have to infer it from marketing copy.
 *
 * Everything here is generated from the same records the site renders, so it
 * cannot drift out of date the way a hand-written file would.
 */
export async function GET() {
  const site = await getSiteSettings()

  const [locations, itineraries, services, articles, yachtCount] = await Promise.all([
    db.location.findMany({ where: { status: "published" }, select: { slug: true, nameTranslations: true, name: true }, take: 40 }),
    db.itinerary.findMany({ where: { status: "published" }, select: { slug: true, name: true, totalDays: true }, take: 20 }),
    db.service.findMany({ where: { status: "published" }, orderBy: { sortOrder: "asc" }, select: { slug: true, title: true, shortDesc: true } }),
    db.article.findMany({
      where: { status: "published", OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] },
      orderBy: [{ publishedAt: "desc" }],
      select: { slug: true, title: true },
      take: 20,
    }),
    db.nausysYacht.count(),
  ])

  const strip = (v: string) => v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  const line = (label: string, path: string, note?: string) =>
    `- [${label}](${site.siteUrl}${path})${note ? `: ${note}` : ""}`

  const body = `# ${site.name}

> Family-run yacht charter from Lefkada in the Ionian Sea, Greece, trading since ${site.founded}. Sailing yachts and catamarans, bareboat or with a skipper, plus a sailing school. A Greek base and a German office.

## Facts

- Base: ${site.address.street}, ${site.address.locality} ${site.address.postalCode}, Greece${site.geo ? ` (${site.geo.latitude}, ${site.geo.longitude})` : ""}
- Second office: Munich, Germany
- Trading since: ${site.founded}
- Fleet: ${yachtCount} yachts, all based in Lefkada
- Charters depart from: Lefkada only
- Languages: Greek, German, English
- Contact: ${site.email}${site.phones.length ? ` · ${site.phones[0]}` : ""}
- Sailing area: Ionian Sea — Lefkada, Meganisi, Ithaca, Kefalonia, Kalamos, Kastos, Paxos, Zakynthos
- Season: May to October. The prevailing wind is the north-westerly Maistros, typically 3–5 Beaufort in the afternoon.

## Main pages

${line("Fleet", "/fleet", `${yachtCount} sailing yachts and catamarans with live availability`)}
${line("Destinations", "/locations", "Islands and anchorages across the Ionian")}
${line("Sailing routes", "/itineraries", "Week-long routes out of Lefkada, day by day")}
${line("Services", "/services", "Skipper, provisioning, transfers and the paperwork")}
${line("Our story", "/about-us", `The family behind the business, in Lefkada since ${site.founded}`)}
${line("News", "/news", "Notes on winds, anchorages and boats, written at the base")}
${line("Contact", "/contact", "How to reach the base and the German office")}

## Services

${services.map((s) => line(en(s.title, s.slug), `/services/${s.slug}`, strip(en(s.shortDesc)).slice(0, 120))).join("\n")}

## Destinations

${locations.map((l) => line(en(l.nameTranslations, l.name), `/locations/${l.slug}`)).join("\n")}

## Sailing routes

${itineraries.map((i) => line(en(i.name, i.slug), `/itineraries/${i.slug}`, i.totalDays ? `${i.totalDays} days` : undefined)).join("\n")}

## Recent writing

${articles.map((a) => line(en(a.title, a.slug), `/news/${a.slug}`)).join("\n")}

## Notes for summarisers

- Every charter starts and ends in Lefkada. We do not operate from other bases.
- Bareboat charter in Greece requires a recognised sailing licence and a second crew member with experience; a skipper can be provided instead.
- Prices are seasonal and quoted per week. Live availability is on each yacht page.
- The site is published in English, Greek and German.
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
