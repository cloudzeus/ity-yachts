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
 * `<` is escaped because a `</script>` inside a string value would otherwise
 * close this tag early — the one way JSON-LD from a database field can break
 * a page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const nodes = Array.isArray(data) ? data : [data]

  return (
    <>
      {nodes.map((node, i) => (
        <script
          // Stable across renders: these are a fixed list per page.
          key={(node["@id"] as string) ?? (node["@type"] as string) ?? i}
          type="application/ld+json"
          // The payload is ours, and escaped below.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  )
}
