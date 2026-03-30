import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

const TABLE_MAP = {
  categories: "nausysYachtCategory",
  yachtBuilders: "nausysYachtBuilder",
  engineBuilders: "nausysEngineBuilder",
  sailTypes: "nausysSailType",
  steeringTypes: "nausysSteeringType",
  equipmentCategories: "nausysEquipmentCategory",
  equipment: "nausysEquipment",
  services: "nausysService",
} as const

type TableKey = keyof typeof TABLE_MAP

// Tables where name is a plain String (not JSON)
const STRING_NAME_TABLES: TableKey[] = ["yachtBuilders", "engineBuilders"]

// Tables with extra fields
const EXTRA_FIELDS: Partial<Record<TableKey, string[]>> = {
  categories: ["icon"],
  yachtBuilders: ["logoUrl"],
  engineBuilders: ["logoUrl"],
  equipment: ["categoryId"],
  services: ["depositInsurance"],
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const table = searchParams.get("table") as TableKey | null

    if (!table || !TABLE_MAP[table]) {
      return NextResponse.json({ error: "Invalid table parameter" }, { status: 400 })
    }

    const modelName = TABLE_MAP[table]
    const model = (db as any)[modelName]

    const includeOpts: any = {}
    if (table === "equipment") {
      includeOpts.category = { select: { id: true, name: true } }
    }

    const items = await model.findMany({
      orderBy: { id: "asc" },
      ...(Object.keys(includeOpts).length > 0 ? { include: includeOpts } : {}),
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("[GET /api/admin/fleet/tables]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { table, id, data } = body as { table: TableKey; id: number; data: Record<string, any> }

    if (!table || !TABLE_MAP[table] || id == null || !data) {
      return NextResponse.json({ error: "Missing required fields: table, id, data" }, { status: 400 })
    }

    const modelName = TABLE_MAP[table]
    const model = (db as any)[modelName]

    // Build the update payload - only allow known fields
    const updateData: Record<string, any> = {}

    if (data.name !== undefined) {
      if (STRING_NAME_TABLES.includes(table)) {
        updateData.name = String(data.name)
      } else {
        // JSON name - validate shape
        if (typeof data.name === "object" && data.name !== null) {
          updateData.name = { en: data.name.en ?? "", el: data.name.el ?? "", de: data.name.de ?? "" }
        }
      }
    }

    // Extra fields
    const allowed = EXTRA_FIELDS[table] ?? []
    for (const field of allowed) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await model.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ item: updated })
  } catch (error) {
    console.error("[PATCH /api/admin/fleet/tables]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
