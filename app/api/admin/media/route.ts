import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { listDirectory, deleteObject } from "@/lib/bunny-cdn"
import { NextRequest, NextResponse } from "next/server"

const MIME_MAP: Record<string, string> = {
  webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", svg: "image/svg+xml", bmp: "image/bmp", ico: "image/x-icon",
  mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo", webm: "video/webm", mkv: "video/x-matroska",
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip", rar: "application/x-rar-compressed",
  txt: "text/plain", csv: "text/csv", json: "application/json",
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return MIME_MAP[ext] ?? "application/octet-stream"
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR", "EMPLOYEE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let folder = req.nextUrl.searchParams.get("folder") ?? ""
    // Remove trailing slashes
    folder = folder.replace(/\/+$/, "")

    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1")
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20")
    const offset = (page - 1) * limit

    const bunnyItems = await listDirectory(folder)
    const seenFolders = new Set<string>()
    const seenFiles = new Set<string>()

    const folders = bunnyItems.filter((f) => {
      if (!f.IsDirectory) return false
      const key = `${f.Path}${f.ObjectName}`
      if (seenFolders.has(key)) return false
      seenFolders.add(key)
      return true
    })

    const bunnyFiles = bunnyItems.filter((f) => {
      if (f.IsDirectory) return false
      // Deduplicate by path + filename, not just path
      const fullPath = f.Path + f.ObjectName
      if (seenFiles.has(fullPath)) return false
      seenFiles.add(fullPath)
      return true
    })

    // Build paths for DB lookup - use ObjectName as the full path component
    const filePaths = bunnyFiles.map(f => f.ObjectName)
    const dbRecords = filePaths.length
      ? await db.media.findMany({ where: { name: { in: filePaths } } })
      : []

    const dbMap = new Map(dbRecords.map((r) => [r.name, r]))

    const totalFiles = bunnyFiles.length
    const paginatedBunnyFiles = bunnyFiles.slice(offset, offset + limit)

    const files = paginatedBunnyFiles.map((f) => {
      const db = dbMap.get(f.ObjectName)
      const url = db?.url ?? `${process.env.NEXT_PUBLIC_BUNNY_CDN_URL}/${folder ? folder + "/" : ""}${f.ObjectName}`

      return {
        name: f.ObjectName,
        path: folder ? `${folder}/${f.ObjectName}` : f.ObjectName,
        url,
        mimeType: db?.mimeType ?? guessMimeType(f.ObjectName),
        size: db?.size ?? f.Length,
        width: db?.width ?? null,
        height: db?.height ?? null,
        lastChanged: f.LastChanged,
        id: db?.id ?? f.ObjectName,
      }
    })

    return NextResponse.json({
      files,
      folders,
      pagination: {
        page,
        limit,
        total: totalFiles,
        totalPages: Math.ceil(totalFiles / limit),
      }
    })
  } catch (error) {
    console.error("[GET /api/admin/media]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR", "EMPLOYEE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const path = req.nextUrl.searchParams.get("path")
    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 })

    const [deleted] = await Promise.all([
      deleteObject(path),
      db.media.deleteMany({ where: { path } }),
    ])

    return NextResponse.json({ ok: deleted })
  } catch (error) {
    console.error("[DELETE /api/admin/media]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
