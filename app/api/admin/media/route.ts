import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { listDirectory, deleteObject } from "@/lib/bunny-cdn"
import { NextRequest, NextResponse } from "next/server"

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
      if (seenFolders.has(f.Path)) return false
      seenFolders.add(f.Path)
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
        mimeType: db?.mimeType ?? "image/webp",
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
