// Server-only — do NOT import this file in client components (it imports sharp)
import "server-only"
import sharp from "sharp"

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

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/")
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
