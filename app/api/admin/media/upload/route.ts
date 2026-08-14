import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { uploadToBunnyCDN, createFolder } from "@/lib/bunny-cdn"
import { processImage, isImage, isSvg, isVideo, slugify, readGeotag, type Geotag } from "@/lib/media-processor"
import { NextRequest, NextResponse, after } from "next/server"
import { purgeCDNCache } from "@/lib/bunny-cdn"
import { hasFfmpeg, transcodeVideo } from "@/lib/video-processor"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR", "EMPLOYEE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    let folder = (formData.get("folder") as string | null) ?? ""

    // Remove trailing slashes
    folder = folder.replace(/\/+$/, "")

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    // Create folder if it doesn't exist
    if (folder) {
      await createFolder(folder)
    }

    const originalMime = file.type || "application/octet-stream"
    const originalName = file.name

    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)
    let mimeType = originalMime
    let width: number | null = null
    let height: number | null = null
    let geotag: Geotag | null = null

    // Strip original extension from name for slug base
    const baseName = originalName.replace(/\.[^.]+$/, "")
    const ext = originalName.split(".").pop() ?? "bin"
    let fileName: string

    if (isSvg(originalMime)) {
      // SVGs are vectors — keep as-is, no conversion
      mimeType = "image/svg+xml"
      fileName = `${Date.now()}-${slugify(baseName)}.svg`
    } else if (isImage(originalMime)) {
      /* Before the conversion, not after: webp encoding drops the EXIF block,
         and we would rather it did — the position belongs in our database, not
         embedded in a file served from a public CDN. */
      geotag = await readGeotag(buffer)

      const processed = await processImage(buffer)
      // @ts-ignore
      buffer = processed.buffer
      mimeType = processed.mimeType
      width = processed.width
      height = processed.height
      fileName = `${Date.now()}-${slugify(baseName)}.webp`
    } else if (isVideo(originalMime)) {
      /* Uploaded as it arrives so the admin is not left waiting, then
         re-encoded in the background and swapped in — see the `after()` block
         below. Storing video untouched is how a 33 MB drone clip ended up as
         a decorative background on the homepage. */
      fileName = `${Date.now()}-${slugify(baseName)}.${ext}`
    } else {
      // PDFs, documents, and other files — upload as-is
      fileName = `${Date.now()}-${slugify(baseName)}.${ext}`
    }

    const storagePath = folder ? `${folder}/${fileName}` : fileName
    const zone = process.env.BUNNY_STORAGE_ZONE || ""

    const result = await uploadToBunnyCDN({
      storageZone: zone,
      fileName: storagePath,
      file: buffer,
    })

    if (!result.success || !result.url) {
      return NextResponse.json({ error: "CDN upload failed" }, { status: 502 })
    }

    const media = await db.media.upsert({
      where: { path: storagePath },
      create: {
        name: fileName,
        path: storagePath,
        folder,
        url: result.url,
        mimeType,
        size: buffer.length,
        // Images are converted inline; a video is stamped once ffmpeg is done.
        optimizedAt: isVideo(originalMime) ? null : new Date(),
        width,
        height,
        latitude: geotag?.latitude ?? null,
        longitude: geotag?.longitude ?? null,
        capturedAt: geotag?.capturedAt ?? null,
      },
      update: {
        url: result.url,
        mimeType,
        size: buffer.length,
        optimizedAt: isVideo(originalMime) ? null : new Date(),
        originalSize: null,
        width,
        height,
        latitude: geotag?.latitude ?? null,
        longitude: geotag?.longitude ?? null,
        capturedAt: geotag?.capturedAt ?? null,
      },
    })

    console.log("[POST /api/admin/media/upload] Saved to DB:", { path: storagePath, url: result.url, folder })

    /* Transcode after the response has gone out, so the upload feels instant.
       The re-encoded file overwrites the original at the same path, which
       means every URL already saved against this media stays valid — then the
       CDN edge is purged so the small file is what gets served. */
    if (isVideo(originalMime)) {
      const original = buffer
      after(async () => {
        try {
          if (!(await hasFfmpeg())) {
            console.warn("[media] ffmpeg unavailable — video stored unoptimised:", storagePath)
            return
          }

          const out = await transcodeVideo(original, ext)

          // Never make a file bigger: an already-web-sized upload is left alone.
          if (out.buffer.length >= original.length) {
            await db.media.update({
              where: { path: storagePath },
              data: { optimizedAt: new Date(), width: out.width || undefined, height: out.height || undefined },
            })
            console.log("[media] already web-sized, kept as uploaded:", storagePath)
            return
          }

          const swapped = await uploadToBunnyCDN({ storageZone: zone, fileName: storagePath, file: out.buffer })
          if (!swapped.success) {
            console.error("[media] transcoded upload failed, original left in place:", storagePath)
            return
          }

          await purgeCDNCache(result.url!)
          await db.media.update({
            where: { path: storagePath },
            data: {
              size: out.buffer.length,
              originalSize: original.length,
              optimizedAt: new Date(),
              width: out.width || undefined,
              height: out.height || undefined,
            },
          })

          const mb = (n: number) => (n / 1048576).toFixed(2)
          console.log(`[media] transcoded ${storagePath}: ${mb(original.length)} MB -> ${mb(out.buffer.length)} MB`)
        } catch (error) {
          // The original is already live and usable; this is not fatal.
          console.error("[media] transcode failed, original left in place:", storagePath, error)
        }
      })
    }

    return NextResponse.json({ file: media, success: true })
  } catch (error) {
    console.error("[POST /api/admin/media/upload] Error:", error)
    return NextResponse.json({ error: String(error), details: "Failed to save file metadata" }, { status: 500 })
  }
}
