import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const yachtId = parseInt(id)
    if (isNaN(yachtId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const yacht = await db.nausysYacht.findUnique({
      where: { id: yachtId },
      include: {
        model: { include: { category: true, builder: true } },
        base: { include: { location: true } },
        builder: true,
        engineBuilder: true,
        category: true,
        equipment: { include: { equipment: { include: { category: true } } } },
        extraEquipment: { include: { equipment: true } },
        services: { include: { service: true } },
        cabinDefinitions: true,
        crewMembers: true,
        prices: { orderBy: { dateFrom: "asc" } },
        websiteAreas: { include: { region: { include: { country: true } } } },
      },
    })

    if (!yacht) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 })
    }

    return NextResponse.json({ yacht })
  } catch (error) {
    console.error("[GET /api/fleet/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
