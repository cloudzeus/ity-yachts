/**
 * Renders JSON-LD into the page.
 *
 * A server component with no client cost. `<` is escaped because a `</script>`
 * inside a string value would otherwise close this tag early — the one way
 * JSON-LD from a database field can break a page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return (
    <script
      type="application/ld+json"
      // The payload is ours, and escaped above.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
