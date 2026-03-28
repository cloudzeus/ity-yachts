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

    const item = await db.nausysYachtService.create({
      data: {
        yachtId,
        serviceId: parseInt(body.serviceId),
        price: body.price ?? null,
        currency: body.currency ?? "EUR",
        priceMeasureId: body.priceMeasureId ? parseInt(body.priceMeasureId) : null,
        calculationType: body.calculationType ?? null,
        obligatory: body.obligatory ?? false,
        description: body.description ?? {},
      },
      include: { service: true },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/fleet/[id]/services]", error)
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

    await db.nausysYachtService.delete({ where: { id: itemId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/fleet/[id]/services]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
