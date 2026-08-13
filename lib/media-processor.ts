// Server-only — do NOT import this file in client components (it imports sharp)
import "server-only"
import sharp from "sharp"
import exifReader from "exif-reader"

export async function processImage(buffer: Buffer): Promise<{
  buffer: Buffer
  width: number
  height: number
  mimeType: "image/webp"
}> {
  const output = await sharp(buffer)
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 90 })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    mimeType: "image/webp",
  }
}

export interface Geotag {
  latitude: number
  longitude: number
  capturedAt: Date | null
}

/**
 * Where a photograph was taken, from its EXIF.
 *
 * Must run on the ORIGINAL buffer: `sharp().webp()` drops EXIF unless asked to
 * keep it, and we do not ask — a public CDN file should not carry the
 * photographer's coordinates. So the position is lifted here and kept in our
 * own database instead of being published inside the image.
 *
 * Returns null for anything without a usable fix, which is most images: only a
 * phone or a camera with GPS writes one, and social apps strip it.
 */
export async function readGeotag(buffer: Buffer): Promise<Geotag | null> {
  try {
    const { exif } = await sharp(buffer).metadata()
    if (!exif) return null

    const tags = exifReader(exif)
    const gps = tags?.GPSInfo
    if (!gps) return null

    const lat = toDegrees(gps.GPSLatitude, gps.GPSLatitudeRef)
    const lon = toDegrees(gps.GPSLongitude, gps.GPSLongitudeRef)
    if (lat === null || lon === null) return null

    // A fix at exactly 0,0 is the null island — a missing reading, not a place.
    if (lat === 0 && lon === 0) return null
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null

    const taken = tags.Photo?.DateTimeOriginal ?? tags.Image?.DateTime ?? null

    return {
      latitude: round6(lat),
      longitude: round6(lon),
      capturedAt: taken instanceof Date && !Number.isNaN(taken.getTime()) ? taken : null,
    }
  } catch {
    // A malformed or absent EXIF block is not a reason to fail an upload.
    return null
  }
}

/** EXIF stores position as [degrees, minutes, seconds] plus a hemisphere letter. */
function toDegrees(dms: unknown, ref: unknown): number | null {
  if (!Array.isArray(dms) || dms.length < 2) return null
  const [d, m, s = 0] = dms.map(Number)
  if (![d, m, s].every(Number.isFinite)) return null
  const value = d + m / 60 + s / 3600
  const hemisphere = typeof ref === "string" ? ref.trim().toUpperCase() : ""
  return hemisphere === "S" || hemisphere === "W" ? -value : value
}

/** Six decimals is about 10 cm — past that it is noise. */
const round6 = (n: number) => Math.round(n * 1e6) / 1e6

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/")
}

export function isSvg(mimeType: string): boolean {
  return mimeType === "image/svg+xml"
}

export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/")
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-|-$/g, "")
}
