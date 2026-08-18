/**
 * Single source of truth for which yacht photograph to show.
 *
 * Yachts carry three image fields:
 *   websiteImages  — our Bunny CDN mirror: WebP, resized to 2400px, no redirect
 *   mainPictureUrl — NAUSYS, 307-redirects to S3 and serves the full original
 *   picturesUrl    — the rest of the NAUSYS originals
 *
 * The CDN copy is the one to serve. NAUSYS exists only as a fallback for
 * yachts that have not been through the image sync yet.
 */

/**
 * `isPlan` marks a deck or accommodation layout drawing rather than a
 * photograph. It lives in the same array so the admin keeps one list to
 * manage and one order to drag, but the two are never mixed on the public
 * page: a line drawing in the middle of a photo carousel reads as a mistake.
 */
export type WebsiteImage = { url: string; caption?: string; isPlan?: boolean }

type YachtImageFields = {
  websiteImages?: unknown
  mainPictureUrl?: string | null
  picturesUrl?: unknown
}

function asWebsiteImages(value: unknown): WebsiteImage[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (v): v is WebsiteImage =>
      !!v && typeof v === "object" && typeof (v as WebsiteImage).url === "string"
  )
}

function asUrlList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === "string" && v.length > 0)
}

/** The card / thumbnail image. Never a layout drawing. */
export function yachtThumb(yacht: YachtImageFields): string {
  const cdn = asWebsiteImages(yacht.websiteImages).filter((i) => !i.isPlan)
  if (cdn.length) return cdn[0].url
  return yacht.mainPictureUrl || asUrlList(yacht.picturesUrl)[0] || ""
}

/**
 * The full gallery.
 *
 * Once a yacht has CDN images we return only those. Appending the NAUSYS
 * originals as well — which is what the detail page used to do — served every
 * photograph twice: once from the CDN and again, unoptimised and behind a
 * redirect, from NAUSYS.
 *
 * Layout drawings are excluded; see yachtPlans.
 */
export function yachtGallery(yacht: YachtImageFields): string[] {
  const all = asWebsiteImages(yacht.websiteImages)
  const cdn = all.filter((img) => !img.isPlan)
  // A yacht with nothing but plans still falls through to NAUSYS below.
  if (cdn.length) return cdn.map((img) => img.url)

  const out: string[] = []
  if (yacht.mainPictureUrl) out.push(yacht.mainPictureUrl)
  for (const url of asUrlList(yacht.picturesUrl)) {
    if (!out.includes(url)) out.push(url)
  }
  return out
}

/**
 * The layout drawings, in the order the admin arranged them.
 *
 * Separate from the gallery on purpose: these answer "where do we sleep and
 * who gets the forward cabin", which is a different question from "what does
 * she look like", and they deserve their own place on the page.
 */
export function yachtPlans(yacht: YachtImageFields): WebsiteImage[] {
  return asWebsiteImages(yacht.websiteImages).filter((img) => img.isPlan)
}
