import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, componentId } = await params
    const { translations } = await req.json()

    const component = await db.textComponent.update({
      where: { id: componentId },
      data: { translations },
    })

    return NextResponse.json({ component })
  } catch (error) {
    console.error("[PATCH /api/admin/pages/[id]/text-components/[componentId]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { componentId } = await params

    await db.textComponent.delete({
      where: { id: componentId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/pages/[id]/text-components/[componentId]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
