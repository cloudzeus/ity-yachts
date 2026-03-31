import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { createFolder, deleteObject } from "@/lib/bunny-cdn"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR", "EMPLOYEE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { folderPath } = await req.json()
    if (!folderPath || typeof folderPath !== "string") {
      return NextResponse.json({ error: "Invalid folder path" }, { status: 400 })
    }

    // Sanitize: only allow alphanumeric, hyphens, underscores, slashes
    const sanitized = folderPath.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/\/+/g, "/").replace(/^\/|\/$/g, "")
    if (!sanitized) return NextResponse.json({ error: "Invalid folder name" }, { status: 400 })

    const ok = await createFolder(sanitized)
    if (!ok) {
      return NextResponse.json({ error: "Failed to create folder on CDN" }, { status: 502 })
    }

    return NextResponse.json({ ok: true, path: sanitized })
  } catch (error: any) {
    console.error("[POST /api/admin/media/folder]", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { folderPath } = await req.json()
    if (!folderPath) return NextResponse.json({ error: "Missing folderPath" }, { status: 400 })

    const deletedFromCDN = await deleteObject(`${folderPath}/`)
    if (!deletedFromCDN) {
      return NextResponse.json({ error: "Failed to delete folder from CDN. The folder may not exist or may not be empty." }, { status: 400 })
    }

    await db.media.deleteMany({ where: { folder: { startsWith: folderPath } } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/media/folder]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
