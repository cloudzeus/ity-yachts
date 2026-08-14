import { getSiteSettings } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

/**
 * security.txt — RFC 9116.
 *
 * Where to report a vulnerability, so somebody who finds one has an obvious
 * route that is not the booking inbox. `Expires` is mandatory under the RFC
 * and must be in the future, so it is computed rather than written down: a
 * hardcoded date silently expires and the file stops being valid.
 */
export async function GET() {
  const site = await getSiteSettings()

  const expires = new Date()
  expires.setUTCFullYear(expires.getUTCFullYear() + 1)

  const body = [
    `Contact: mailto:${site.email}`,
    `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, ".000Z")}`,
    "Preferred-Languages: en, el, de",
    `Canonical: ${site.siteUrl}/.well-known/security.txt`,
    `Policy: ${site.siteUrl}/legal/data-protection`,
    "",
    "# Please report anything you find to the address above.",
    "# We are a small family business — expect a human, not a bug bounty.",
    "",
  ].join("\n")

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
