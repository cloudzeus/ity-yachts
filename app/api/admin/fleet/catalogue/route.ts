import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const tab = searchParams.get("tab") ?? "types"

    switch (tab) {
      case "types": {
        const [categories, builders, engineBuilders, models] = await Promise.all([
          db.nausysYachtCategory.findMany({ orderBy: { id: "asc" } }),
          db.nausysYachtBuilder.findMany({ orderBy: { name: "asc" } }),
          db.nausysEngineBuilder.findMany({ orderBy: { name: "asc" } }),
          db.nausysYachtModel.findMany({
            include: { category: true, builder: true },
            orderBy: { name: "asc" },
          }),
        ])
        return NextResponse.json({ categories, builders, engineBuilders, models })
      }
      case "sails": {
        const [sailTypes, steeringTypes] = await Promise.all([
          db.nausysSailType.findMany({ orderBy: { id: "asc" } }),
          db.nausysSteeringType.findMany({ orderBy: { id: "asc" } }),
        ])
        return NextResponse.json({ sailTypes, steeringTypes })
      }
      case "equipment": {
        const [categories, equipment] = await Promise.all([
          db.nausysEquipmentCategory.findMany({ orderBy: { id: "asc" } }),
          db.nausysEquipment.findMany({
            include: { category: true },
            orderBy: { categoryId: "asc" },
          }),
        ])
        return NextResponse.json({ categories, equipment })
      }
      case "services": {
        const [services, priceMeasures, discountItems] = await Promise.all([
          db.nausysService.findMany({ orderBy: { id: "asc" } }),
          db.nausysPriceMeasure.findMany({ orderBy: { id: "asc" } }),
          db.nausysDiscountItem.findMany({ orderBy: { id: "asc" } }),
        ])
        return NextResponse.json({ services, priceMeasures, discountItems })
      }
      default:
        return NextResponse.json({ error: "Invalid tab" }, { status: 400 })
    }
  } catch (error) {
    console.error("[GET /api/admin/fleet/catalogue]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
