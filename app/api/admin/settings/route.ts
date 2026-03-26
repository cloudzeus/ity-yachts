import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const records = await db.setting.findMany()
    const settings = Object.fromEntries(records.map((r) => [r.key, r.value]))
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[GET /api/admin/settings]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 })

    const setting = await db.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })

    return NextResponse.json({ ok: true, setting })
  } catch (error) {
    console.error("[PATCH /api/admin/settings]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
