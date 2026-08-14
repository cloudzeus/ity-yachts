import { SITE_URL, getSiteUrl } from "@/lib/seo"

/**
 * Renders JSON-LD into the page.
 *
 * One `<script>` per entity, never a bare array. A single tag containing
 * `[{...},{...}]` is valid JSON-LD and Google reads it, but a good number of
 * other parsers only look at a single top-level object — an audit of the
 * deploy reported "no Organization schema" and "no WebSite schema" on a page
 * that carried both, plus knock-on failures for `sameAs`, `inLanguage` and
 * `@id`, all from that one packaging choice.
 *
 * The builders in `lib/structured-data` are pure and synchronous, so they mint
 * URLs against the build-time `SITE_URL`. The real host is only knowable per
 * request — from settings, or the request itself. Binding the two here keeps
 * every `@id` on the same origin as the canonical tag; when they disagree, an
 * audit sees one business split across two domains and entity confidence drops.
 *
 * `<` is escaped because a `</script>` inside a string value would otherwise
 * close this tag early — the one way JSON-LD from a database field can break
 * a page.
 */
export async function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const nodes = Array.isArray(data) ? data : [data]
  const base = await getSiteUrl()

  const render = (node: Record<string, unknown>) => {
    let json = JSON.stringify(node)
    // A fixed origin, so a plain prefix swap is exact — no URL parsing needed.
    if (base && base !== SITE_URL) json = json.split(SITE_URL).join(base)
    return json.replace(/</g, "\\u003c")
  }

  return (
    <>
      {nodes.map((node, i) => (
        <script
          // Stable across renders: these are a fixed list per page.
          key={(node["@id"] as string) ?? (node["@type"] as string) ?? i}
          type="application/ld+json"
          // The payload is ours, and escaped below.
          dangerouslySetInnerHTML={{ __html: render(node) }}
        />
      ))}
    </>
  )
}
