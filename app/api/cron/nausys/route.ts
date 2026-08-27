import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { runFullSync } from "@/lib/nausys-sync"
import { syncAllYachtImages } from "@/lib/nausys-image-sync"
import { takeSnapshot, diffSnapshots, type Change } from "@/lib/nausys-changes"
import type { NausysCredentials } from "@/lib/nausys-api"

/**
 * The nightly NAUSYS sync.
 *
 * Meant for a scheduler — Coolify, cron, anything that can call a URL:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://iyc.de/api/cron/nausys
 *
 * At four in the morning nobody is booking, the ERP is quiet, and a fleet
 * that changed yesterday is right before the office opens. The same run
 * records what moved, so the first person in can read it instead of
 * discovering a new rate from a customer.
 *
 * It is the same work the Sync button does, reached the same way. Nothing
 * here is a second implementation that could drift from it.
 */
export const dynamic = "force-dynamic"

/** Full syncs take minutes, and the images take most of them. */
export const maxDuration = 800

/** A run still marked running after this long did not survive a restart. */
const STALE_AFTER_MS = 30 * 60 * 1000

export async function GET(req: NextRequest) {
  /* Open, this would let anyone hammer the ERP. Without a secret configured
     it refuses rather than defaulting to open — the failure that gets noticed
     rather than the one that gets exploited. */
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 })
  }
  if (req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // A crash or a redeploy leaves a run marked running for ever; clear those.
  await db.nausysSyncLog.updateMany({
    where: { status: "running", startedAt: { lt: new Date(Date.now() - STALE_AFTER_MS) } },
    data: { status: "failed", completedAt: new Date(), errorMsg: "Timed out — process crashed or server restarted" },
  })

  /* Somebody may be running one by hand from /admin. Two full syncs writing
     the same tables at once is how a yacht ends up with half a price list. */
  const running = await db.nausysSyncLog.findFirst({ where: { status: "running" } })
  if (running) {
    return NextResponse.json(
      { skipped: "a sync is already running", since: running.startedAt },
      { status: 409 }
    )
  }

  const setting = await db.setting.findUnique({ where: { key: "nausys" } })
  const { username, password, endpoint, companyId } =
    (setting?.value ?? {}) as { username?: string; password?: string; endpoint?: string; companyId?: string }
  if (!username || !password || !companyId) {
    return NextResponse.json(
      { error: "NAUSYS credentials are not configured — Settings → NAUSYS" },
      { status: 400 }
    )
  }
  const creds: NausysCredentials = {
    username,
    password,
    endpoint: endpoint || "https://ws.nausys.com/CBMS-external/rest",
    companyId,
  }

  const log = await db.nausysSyncLog.create({ data: { syncType: "FULL", status: "running" } })

  try {
    const before = await takeSnapshot()
    const result = await runFullSync(creds)

    /* New boats arrive with new photographs. Failing to fetch them is worth
       reporting and is not worth failing the night's sync over. */
    let imageNote = ""
    try {
      const img = await syncAllYachtImages()
      result.itemCount += img.synced
      imageNote = `images: ${img.synced} uploaded, ${img.skipped} skipped, ${img.failed} failed`
    } catch (err) {
      imageNote = `images failed: ${err instanceof Error ? err.message : String(err)}`
    }

    // Reporting, never allowed to fail the run it describes.
    let changes: Change[] = []
    try {
      changes = await diffSnapshots(before, await takeSnapshot())
    } catch (err) {
      console.error("[NAUSYS cron] change detection failed", err)
    }

    await db.nausysSyncLog.update({
      where: { id: log.id },
      data: {
        status: result.status,
        itemCount: result.itemCount,
        changes: changes.slice(0, 500) as unknown as Prisma.InputJsonValue,
        changeCount: changes.length,
        completedAt: new Date(),
        errorMsg: [result.errorMsg, imageNote, ...result.steps].filter(Boolean).join("\n"),
      },
    })

    console.log(
      `[NAUSYS cron] ${result.status}: ${result.itemCount} items, ${changes.length} changes` +
        (changes.length ? ` — ${changes.slice(0, 5).map((c) => `${c.yacht}/${c.what}`).join(", ")}` : "")
    )

    return NextResponse.json({
      status: result.status,
      itemCount: result.itemCount,
      changeCount: changes.length,
      /* Enough for a scheduler's log to be worth reading on its own. */
      changes: changes.slice(0, 50),
      images: imageNote,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db.nausysSyncLog.update({
      where: { id: log.id },
      data: { status: "failed", completedAt: new Date(), errorMsg: message },
    })
    console.error(`[NAUSYS cron] ${message}`)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
