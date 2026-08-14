import { db } from "@/lib/db"
import { getSiteSettings } from "@/lib/site-settings"
import { en, stripHtml } from "@/lib/seo"

export const dynamic = "force-dynamic"

/** XML text nodes cannot carry raw &, < or >. */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/**
 * The news feed.
 *
 * Aggregators and several AI crawlers look for a feed before they look for a
 * sitemap — it is the cheapest way to tell them something new has been
 * published, without waiting to be re-crawled.
 */
export async function GET() {
  const site = await getSiteSettings()

  const articles = await db.article.findMany({
    where: { status: "published", OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] },
    orderBy: [{ publishedAt: "desc" }, { date: "desc" }],
    take: 30,
    select: {
      slug: true, title: true, shortDesc: true, author: true,
      publishedAt: true, date: true, defaultMedia: true, defaultMediaType: true,
      categoryRef: { select: { name: true } },
    },
  })

  const updated = articles[0]?.publishedAt ?? articles[0]?.date ?? new Date()

  const items = articles.map((a) => {
    const url = `${site.siteUrl}/news/${a.slug}`
    const published = (a.publishedAt ?? a.date ?? new Date()).toUTCString()
    const image =
      a.defaultMedia && a.defaultMediaType !== "video"
        ? `<enclosure url="${esc(a.defaultMedia)}" type="image/webp" />`
        : ""

    return `    <item>
      <title>${esc(en(a.title, a.slug))}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${published}</pubDate>
      ${a.author ? `<dc:creator>${esc(a.author)}</dc:creator>` : ""}
      ${a.categoryRef ? `<category>${esc(en(a.categoryRef.name))}</category>` : ""}
      <description>${esc(stripHtml(en(a.shortDesc)))}</description>
      ${image}
    </item>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)} — news</title>
    <link>${esc(site.siteUrl)}/news</link>
    <atom:link href="${esc(site.siteUrl)}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Winds, anchorages, boats and what a week aboard is actually like, written at our charter base in Lefkada.</description>
    <language>en</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <copyright>${esc(site.name)}</copyright>
${items.join("\n")}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
