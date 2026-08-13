import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/**
 * There was no robots.txt at all, so nothing pointed crawlers at a sitemap and
 * nothing kept them out of the admin.
 *
 * The AI crawlers are listed explicitly and allowed: this business wants to be
 * cited in AI answers, and a silent default is not the same as a decision.
 * Blocking any of them is a one-line change here.
 */
export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
