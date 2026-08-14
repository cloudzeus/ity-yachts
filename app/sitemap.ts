import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { getSiteUrl } from "@/lib/seo"
import { DEFAULT_LOCALE, HREFLANG, LOCALES, withLocale } from "@/lib/locale"

export const dynamic = "force-dynamic"

/**
 * The sitemap, built from what is actually published.
 *
 * There was none, so every detail page depended on being reachable by crawling
 * — and the ones behind a filter or a carousel effectively were not.
 *
 * `lastModified` comes from each record's own updatedAt rather than the build
 * time, so a crawler can tell what has genuinely changed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const siteUrl = await getSiteUrl()

  /* One entry per page, listing its own language alternates. A sitemap that
     names only the English URL leaves the Greek and German versions to be
     found by luck; the alternates tell a crawler the three are one page. */
  const entry = (
    path: string,
    lastModified: Date,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number
  ) => ({
    url: `${siteUrl}${withLocale(path, DEFAULT_LOCALE)}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [HREFLANG[l], `${siteUrl}${withLocale(path, l)}`])
      ),
    },
  })

  const [locations, itineraries, services, articles, yachts, pages] = await Promise.all([
    db.location.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
    db.itinerary.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
    db.service.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
    db.article.findMany({
      where: { status: "published", OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
      select: { slug: true, updatedAt: true },
    }),
    db.nausysYacht.findMany({ select: { id: true, updatedAt: true } }),
    /* Page-builder pages that are not one of the routes below — the legal
       pages and anything added later. */
    db.page.findMany({
      where: { status: "published", isHomePage: false },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const OWN_ROUTES = new Set(["home", "fleet", "locations", "itineraries", "services", "news", "about-us", "contact"])

  /* The legal pages live in a settings record rather than a table, so they
     have to be read separately — and they are a trust signal worth indexing. */
  const legalRow = await db.setting.findUnique({ where: { key: "legal" } })
  const legal = ((legalRow?.value as { pages?: { slug: string; content: Record<string, string> }[] } | null)?.pages ?? [])
    .filter((p) => p.slug && Object.values(p.content ?? {}).some((v) => v?.trim()))

  return [
    entry("/", now, "daily", 1),
    entry("/fleet", now, "daily", 0.9),
    entry("/locations", now, "weekly", 0.8),
    entry("/itineraries", now, "weekly", 0.8),
    entry("/services", now, "weekly", 0.8),
    entry("/news", now, "daily", 0.7),
    entry("/faq", now, "monthly", 0.8),
    entry("/about-us", now, "monthly", 0.6),
    entry("/contact", now, "monthly", 0.6),

    // A yacht that can be booked matters more than an article about one.
    ...yachts.map((y) => entry(`/fleet/${y.id}`, y.updatedAt, "weekly", 0.8)),
    ...locations.map((l) => entry(`/locations/${l.slug}`, l.updatedAt, "monthly", 0.7)),
    ...itineraries.map((i) => entry(`/itineraries/${i.slug}`, i.updatedAt, "monthly", 0.7)),
    ...services.map((s) => entry(`/services/${s.slug}`, s.updatedAt, "monthly", 0.6)),
    ...articles.map((a) => entry(`/news/${a.slug}`, a.updatedAt, "monthly", 0.6)),
    ...pages.filter((p) => !OWN_ROUTES.has(p.slug)).map((p) => entry(`/${p.slug}`, p.updatedAt, "yearly", 0.3)),
    ...legal.map((p) => entry(`/legal/${p.slug}`, now, "yearly", 0.3)),
  ]
}
