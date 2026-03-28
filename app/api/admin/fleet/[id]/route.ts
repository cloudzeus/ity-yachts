import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const yachtId = parseInt(id)
    if (isNaN(yachtId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    // Fetch yacht + all lookups for combo boxes in one round trip
    const [yacht, models, bases, sailTypes, steeringTypes, engineBuilders, allEquipment, allServices, priceMeasures] =
      await Promise.all([
        db.nausysYacht.findUnique({
          where: { id: yachtId },
          include: {
            model: { include: { category: true, builder: true } },
            base: { include: { location: true } },
            builder: true,
            engineBuilder: true,
            equipment: { include: { equipment: { include: { category: true } } } },
            extraEquipment: { include: { equipment: true } },
            services: { include: { service: true } },
            cabinDefinitions: true,
            checkInPeriods: { orderBy: { dateFrom: "asc" } },
            crewMembers: true,
            seasons: { include: { season: true } },
            prices: { orderBy: { dateFrom: "asc" } },
          },
        }),
        db.nausysYachtModel.findMany({
          include: { category: true, builder: true },
          orderBy: { name: "asc" },
        }),
        db.nausysCharterBase.findMany({
          include: { location: true },
          orderBy: { id: "asc" },
        }),
        db.nausysSailType.findMany({ orderBy: { id: "asc" } }),
        db.nausysSteeringType.findMany({ orderBy: { id: "asc" } }),
        db.nausysEngineBuilder.findMany({ orderBy: { name: "asc" } }),
        db.nausysEquipment.findMany({
          include: { category: true },
          orderBy: { categoryId: "asc" },
        }),
        db.nausysService.findMany({ orderBy: { id: "asc" } }),
        db.nausysPriceMeasure.findMany({ orderBy: { id: "asc" } }),
      ])

    if (!yacht) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 })
    }

    return NextResponse.json({
      yacht,
      lookups: { models, bases, sailTypes, steeringTypes, engineBuilders, allEquipment, allServices, priceMeasures },
    })
  } catch (error) {
    console.error("[GET /api/admin/fleet/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
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
    if (isNaN(yachtId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const body = await req.json()

    // Build update data from allowed fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {}

    // Specs
    const specFields = [
      "name", "draft", "loa", "beam", "cabins", "cabinsCrew",
      "berthsCabin", "berthsSalon", "berthsCrew", "berthsTotal",
      "maxPersons", "recommendedPersons", "wc", "wcCrew", "showers", "showersCrew",
      "buildYear", "renewed", "launchedYear", "hullColor",
      "mastLength", "registrationNumber",
    ] as const
    for (const f of specFields) {
      if (body[f] !== undefined) data[f] = body[f]
    }

    // Engine & propulsion
    const engineFields = [
      "engines", "enginePower", "engineBuildYear", "engineRenewedYear",
      "fuelType", "fuelConsumption", "fuelTank", "waterTank",
      "propulsionType", "numberOfRudderBlades", "maxSpeed", "cruisingSpeed",
    ] as const
    for (const f of engineFields) {
      if (body[f] !== undefined) data[f] = body[f]
    }

    // Charter info
    const charterFields = [
      "charterType", "crewedCharterType", "crewCount",
      "checkInTime", "checkOutTime", "deposit", "depositWhenInsured",
      "depositCurrency", "commission", "maxDiscount", "maxDiscountFromCommission",
      "agencyDiscountType", "isPremium", "needsOptionApproval", "canMakeBookingFixed",
    ] as const
    for (const f of charterFields) {
      if (body[f] !== undefined) data[f] = body[f]
    }

    // Relations (combo box selections)
    if (body.modelId !== undefined) data.modelId = body.modelId ? parseInt(body.modelId) : null
    if (body.baseId !== undefined) data.baseId = body.baseId ? parseInt(body.baseId) : null
    if (body.sailTypeId !== undefined) data.sailTypeId = body.sailTypeId ? parseInt(body.sailTypeId) : null
    if (body.genoaTypeId !== undefined) data.genoaTypeId = body.genoaTypeId ? parseInt(body.genoaTypeId) : null
    if (body.steeringTypeId !== undefined) data.steeringTypeId = body.steeringTypeId ? parseInt(body.steeringTypeId) : null
    if (body.engineBuilderId !== undefined) data.engineBuilderId = body.engineBuilderId ? parseInt(body.engineBuilderId) : null

    // Translations
    if (body.highlightsTranslations !== undefined) data.highlightsTranslations = body.highlightsTranslations
    if (body.noteTranslations !== undefined) data.noteTranslations = body.noteTranslations

    // Media
    if (body.mainPictureUrl !== undefined) data.mainPictureUrl = body.mainPictureUrl
    if (body.youtubeVideos !== undefined) data.youtubeVideos = body.youtubeVideos
    if (body.vimeoVideos !== undefined) data.vimeoVideos = body.vimeoVideos
    if (body.linkFor360tour !== undefined) data.linkFor360tour = body.linkFor360tour

    const yacht = await db.nausysYacht.update({
      where: { id: yachtId },
      data,
    })

    return NextResponse.json({ yacht })
  } catch (error) {
    console.error("[PATCH /api/admin/fleet/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
