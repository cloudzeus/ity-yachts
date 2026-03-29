import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { uploadToBunnyCDN, createFolder } from "@/lib/bunny-cdn"
import { processImage, processVideo, isImage, isVideo, slugify } from "@/lib/media-processor"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

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

    if (!isImage(originalMime) && !isVideo(originalMime)) {
      return NextResponse.json({ error: "Only images and videos are allowed" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)
    let mimeType = originalMime
    let width: number | null = null
    let height: number | null = null

    // Strip original extension from name for slug base
    const baseName = originalName.replace(/\.[^.]+$/, "")
    let fileName: string

    if (isImage(originalMime)) {
      const processed = await processImage(buffer)
      // @ts-ignore
      buffer = processed.buffer
      mimeType = processed.mimeType
      width = processed.width
      height = processed.height
      fileName = `${Date.now()}-${slugify(baseName)}.webp`
    } else if (isVideo(originalMime)) {
      // Convert all video formats to H.264 MP4
      const processed = await processVideo(buffer)
      buffer = Buffer.from(processed.buffer)
      mimeType = processed.mimeType
      fileName = `${Date.now()}-${slugify(baseName)}.mp4`
    } else {
      const ext = originalName.split(".").pop() ?? "mp4"
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
        width,
        height,
      },
      update: {
        url: result.url,
        mimeType,
        size: buffer.length,
        width,
        height,
      },
    })

    console.log("[POST /api/admin/media/upload] Saved to DB:", { path: storagePath, url: result.url, folder })
    return NextResponse.json({ file: media, success: true })
  } catch (error) {
    console.error("[POST /api/admin/media/upload] Error:", error)
    return NextResponse.json({ error: String(error), details: "Failed to save file metadata" }, { status: 500 })
  }
}
