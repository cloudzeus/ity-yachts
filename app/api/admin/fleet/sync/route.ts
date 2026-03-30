import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"
import { runFullSync } from "@/lib/nausys-sync"
import type { NausysCredentials } from "@/lib/nausys-api"

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

// POST: trigger a sync
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const syncType = (body.syncType as string) ?? "FULL"

    // Load NAUSYS credentials
    const setting = await db.setting.findUnique({ where: { key: "nausys" } })
    if (!setting) {
      return NextResponse.json({ error: "NAUSYS credentials not configured. Go to Settings > NAUSYS." }, { status: 400 })
    }

    const { username, password, endpoint, companyId } = setting.value as { username: string; password: string; endpoint: string; companyId: string }
    if (!username || !password) {
      return NextResponse.json({ error: "NAUSYS username or password is empty." }, { status: 400 })
    }
    if (!companyId) {
      return NextResponse.json({ error: "Charter Company ID not configured. Go to Settings > NAUSYS." }, { status: 400 })
    }

    const creds: NausysCredentials = {
      username,
      password,
      endpoint: endpoint || "https://ws.nausys.com/CBMS-external/rest",
      companyId,
    }

    // Create sync log entry
    const log = await db.nausysSyncLog.create({
      data: { syncType, status: "running" },
    })

    // Run sync (this can take a while)
    const result = await runFullSync(creds)

    // Update log with results
    await db.nausysSyncLog.update({
      where: { id: log.id },
      data: {
        status: result.status,
        itemCount: result.itemCount,
        completedAt: new Date(),
        errorMsg: result.errorMsg || result.steps.join("\n"),
      },
    })

    return NextResponse.json({
      log: {
        ...log,
        status: result.status,
        itemCount: result.itemCount,
        completedAt: new Date(),
      },
      steps: result.steps,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[POST /api/admin/fleet/sync]", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
