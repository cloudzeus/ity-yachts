import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { orderedIds } = await req.json()
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "Missing orderedIds array" }, { status: 400 })
    }

    // Get pages that are shown in menu to update their menuOrder too
    const pages = await db.page.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true, showInMenu: true },
    })
    const showInMenuSet = new Set(pages.filter((p) => p.showInMenu).map((p) => p.id))

    // Track menu position separately (only for pages shown in menu)
    let menuPos = 0
    await db.$transaction(
      orderedIds.map((id: string, index: number) => {
        const isInMenu = showInMenuSet.has(id)
        const data: { sortOrder: number; menuOrder?: number } = { sortOrder: index }
        if (isInMenu) {
          data.menuOrder = menuPos++
        }
        return db.page.update({ where: { id }, data })
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/admin/pages/reorder]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
