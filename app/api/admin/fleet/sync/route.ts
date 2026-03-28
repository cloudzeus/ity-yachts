import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

// GET: list sync logs
export async function GET() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const logs = await db.nausysSyncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("[GET /api/admin/fleet/sync]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: trigger a sync (placeholder — wire up NAUSYS API credentials later)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const syncType = (body.syncType as string) ?? "FULL"

    const log = await db.nausysSyncLog.create({
      data: { syncType, status: "running" },
    })

    // TODO: implement actual NAUSYS API sync here
    // 1. Authenticate with NAUSYS credentials
    // 2. Fetch catalogue data (categories, builders, equipment, etc.)
    // 3. Fetch yacht list filtered by your agency
    // 4. Fetch pricing, seasons, services
    // 5. Upsert all data into the database
    // 6. Update the sync log on completion

    await db.nausysSyncLog.update({
      where: { id: log.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        errorMsg: "Placeholder — NAUSYS API integration pending. Configure credentials in Settings > NAUSYS.",
      },
    })

    return NextResponse.json({ log: { ...log, status: "completed" } }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/fleet/sync]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
