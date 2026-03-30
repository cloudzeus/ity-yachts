import "server-only"
import sharp from "sharp"
import { db } from "@/lib/db"
import { uploadToBunnyCDN, getCDNUrl, listDirectory } from "@/lib/bunny-cdn"

const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "iycweb"

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function convertToWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
}

async function folderExists(folder: string): Promise<boolean> {
  const files = await listDirectory(folder)
  return files.length > 0
}

export type ImageSyncProgressFn = (yachtName: string, current: number, total: number, status: "uploading" | "skipped" | "done" | "error") => void

/**
 * Sync all NAUSYS images for all yachts to Bunny CDN.
 * Creates folder: yachts/{id}-{slug}/
 * Uploads main image + all gallery images as WebP.
 * Stores resulting CDN URLs in websiteImages JSON field.
 */
export async function syncAllYachtImages(onProgress?: ImageSyncProgressFn): Promise<{ synced: number; skipped: number; failed: number }> {
  const yachts = await db.nausysYacht.findMany({
    select: {
      id: true,
      name: true,
      mainPictureUrl: true,
      picturesUrl: true,
      websiteImages: true,
    },
    orderBy: { name: "asc" },
  })

  let synced = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < yachts.length; i++) {
    const yacht = yachts[i]
    const slug = slugify(yacht.name)
    const folder = `yachts/${yacht.id}-${slug}`

    // Collect all NAUSYS image URLs
    const allUrls: string[] = []
    if (yacht.mainPictureUrl) allUrls.push(yacht.mainPictureUrl)
    const gallery = yacht.picturesUrl as string[] | null
    if (gallery?.length) {
      for (const url of gallery) {
        if (url && !allUrls.includes(url)) allUrls.push(url)
      }
    }

    if (allUrls.length === 0) {
      onProgress?.(yacht.name, i + 1, yachts.length, "skipped")
      skipped++
      continue
    }

    // Check if already uploaded (websiteImages has entries)
    const existing = yacht.websiteImages as { url: string }[] | null
    if (existing && existing.length >= allUrls.length) {
      onProgress?.(yacht.name, i + 1, yachts.length, "skipped")
      skipped++
      continue
    }

    onProgress?.(yacht.name, i + 1, yachts.length, "uploading")

    try {
      const uploadedImages: { url: string; isMain: boolean; sortOrder: number }[] = []

      for (let j = 0; j < allUrls.length; j++) {
        const sourceUrl = allUrls[j]
        const isMain = j === 0 && sourceUrl === yacht.mainPictureUrl
        const fileName = isMain ? "main.webp" : `gallery-${String(j).padStart(2, "0")}.webp`
        const fullPath = `${folder}/${fileName}`

        // Download from NAUSYS
        const raw = await downloadImage(sourceUrl.includes("?") ? sourceUrl : `${sourceUrl}?w=2400`)
        if (!raw) continue

        // Convert to WebP
        const webp = await convertToWebp(raw)

        // Upload to Bunny CDN
        const result = await uploadToBunnyCDN({
          storageZone: STORAGE_ZONE,
          fileName: fullPath,
          file: webp,
        })

        if (result.success && result.url) {
          uploadedImages.push({ url: result.url, isMain, sortOrder: j })
        }
      }

      // Update yacht record with CDN URLs
      if (uploadedImages.length > 0) {
        await db.nausysYacht.update({
          where: { id: yacht.id },
          data: { websiteImages: uploadedImages },
        })
        synced++
      } else {
        failed++
      }

      onProgress?.(yacht.name, i + 1, yachts.length, "done")
    } catch (err) {
      console.error(`[Image Sync] Failed yacht ${yacht.id} (${yacht.name}):`, err)
      onProgress?.(yacht.name, i + 1, yachts.length, "error")
      failed++
    }
  }

  return { synced, skipped, failed }
}
