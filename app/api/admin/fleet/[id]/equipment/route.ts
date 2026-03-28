import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const yachtId = parseInt(id)
    const body = await req.json()

    const item = await db.nausysYachtEquipment.create({
      data: {
        yachtId,
        equipmentId: parseInt(body.equipmentId),
        quantity: body.quantity ?? 1,
        highlight: body.highlight ?? false,
        comment: body.comment ?? {},
      },
      include: { equipment: { include: { category: true } } },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/fleet/[id]/equipment]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get("itemId")
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 })

    await db.nausysYachtEquipment.delete({ where: { id: itemId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/fleet/[id]/equipment]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
