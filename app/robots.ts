import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/seo"
import { isCanonicalHost } from "@/lib/site-settings"

/**
 * There was no robots.txt at all, so nothing pointed crawlers at a sitemap and
 * nothing kept them out of the admin.
 *
 * The AI crawlers are listed explicitly and allowed: this business wants to be
 * cited in AI answers, and a silent default is not the same as a decision.
 * Blocking any of them is a one-line change here.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl()

  /* A staging copy must not invite crawlers, and must not advertise a sitemap
     of its own URLs — that is how the wrong host becomes the indexed one. */
  if (!(await isCanonicalHost())) {
    return { rules: [{ userAgent: "*", disallow: "/" }] }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/login", "/_next/"],
      },
      {
        // Answer and generative engines, allowed deliberately.
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended"],
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/login"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
