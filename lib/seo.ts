/**
 * The facts about this business that search engines and answer engines need,
 * in one place.
 *
 * Generative engines (Perplexity, ChatGPT Search, AI Overviews) cite pages that
 * state who, where and what plainly and consistently. Repeating the same name,
 * address and coordinates in every entity is not duplication — it is what makes
 * the brand resolvable as a single entity rather than a scatter of pages.
 */

/**
 * The build-time fallback. The live value comes from the company settings —
 * see `getSiteUrl()` — so the domain can be corrected without a deploy.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://iyc.de").replace(/\/$/, "")

/** The domain as configured in the admin, falling back to the build value. */
export async function getSiteUrl(): Promise<string> {
  const { getSiteSettings } = await import("@/lib/site-settings")
  return (await getSiteSettings()).siteUrl
}

export const LOCALES = ["en", "el", "de"] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "en"

export const ORG = {
  /** The trading name, used consistently so the entity resolves. */
  name: "IYC Ionische Yacht Charter",
  legalName: "Ionische Yacht Charter",
  alternateName: ["IYC Yachts", "Ionische Yacht Charter", "IYC Lefkas"],
  founded: "1979",
  url: SITE_URL,
  logo: "https://iycweb.b-cdn.net/branding/1774606363287-iyc-logo-trans-blue.webp",
  email: "info@iyc.de",
  bookingEmail: "bookings@iyc.de",
  vatId: "EL095169405",
  sameAs: ["https://www.instagram.com/iyc_lefkas/"],

  /** The base. Coordinates are the Lefkada marina, from the location record. */
  base: {
    street: "Filippa Panagou 22",
    locality: "Lefkada",
    region: "Ionian Islands",
    postalCode: "31100",
    country: "GR",
    phone: "+302645026111",
    latitude: 38.7065734,
    longitude: 20.6416779,
  },

  /** The German office. */
  office: {
    locality: "Munich",
    country: "DE",
    phone: "+4916099279870",
  },
} as const

/** A social card that works when a page has no photograph of its own. */
export const DEFAULT_OG_IMAGE =
  "https://iycweb.b-cdn.net/locations/1786615801662-lefkada-greece-ionian-sea-2026-03-10-22-31-26-utc.webp"

/** Absolute URL for a site path. Relative URLs are invalid in og: and JSON-LD. */
export function absolute(path: string): string {
  if (!path) return SITE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/** Strip markup and collapse whitespace — meta descriptions take text only. */
export function stripHtml(value: string | null | undefined): string {
  if (!value) return ""
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * A meta description of a usable length.
 *
 * Google truncates around 155–160 characters, so cut on a word boundary rather
 * than mid-word, and never leave a dangling comma before the ellipsis.
 */
export function metaDescription(value: string | null | undefined, max = 158): string {
  const text = stripHtml(value)
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : max).replace(/[\s,;:.\-–—]+$/, "")}…`
}

/**
 * A title that survives the SERP.
 *
 * Google truncates around 60 characters, and the layout appends " | IYC
 * Yachts" — so a dynamic title built from a long record name has to be cut
 * before the suffix, not after, or the brand is what gets dropped.
 */
export function metaTitle(value: string, max = 47): string {
  const text = value.trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > 24 ? lastSpace : max).replace(/[\s,;:.\-–—]+$/, "")}…`
}

/**
 * Pad a description that is too short to fill a result.
 *
 * A 90-character description leaves half the snippet to Google's own guess at
 * the page. The suffix only lands when there is room for it.
 */
export function padDescription(value: string, suffix: string, min = 115, max = 158): string {
  const text = stripHtml(value)
  if (text.length >= min) return metaDescription(text, max)
  const joined = `${text} ${suffix}`.trim()
  return metaDescription(joined, max)
}

/** Read a translated field, preferring English for crawlers. */
export function en(value: unknown, fallback = ""): string {
  const o = (value ?? {}) as Record<string, string>
  return (o.en || o.el || o.de || fallback).trim()
}

/**
 * The shared parts of a page's metadata.
 *
 * `canonical` was missing sitewide, which lets any query string or trailing
 * variant be indexed as a separate page.
 */
export async function pageMeta({
  title, description, path, image, type = "website", publishedTime,
}: {
  title: string
  description: string
  path: string
  image?: string | null
  type?: "website" | "article"
  publishedTime?: string
}) {
  const base = await getSiteUrl()
  const url = /^https?:\/\//i.test(path) ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`
  const ogImage = image && !/\.(mp4|webm|mov)$/i.test(image) ? image : DEFAULT_OG_IMAGE

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: ORG.name,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [ogImage],
    },
  }
}
