import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest } from "next/server"
import { runFullSync, SYNC_STEPS, type SyncProgressFn } from "@/lib/nausys-sync"
import { syncAllYachtImages } from "@/lib/nausys-image-sync"
import type { NausysCredentials } from "@/lib/nausys-api"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 })
  }

  // Load NAUSYS credentials
  const setting = await db.setting.findUnique({ where: { key: "nausys" } })
  if (!setting) {
    return new Response(JSON.stringify({ error: "NAUSYS credentials not configured." }), { status: 400 })
  }

  const { username, password, endpoint, companyId } = setting.value as {
    username: string; password: string; endpoint: string; companyId: string
  }
  if (!username || !password) {
    return new Response(JSON.stringify({ error: "NAUSYS username or password is empty." }), { status: 400 })
  }
  if (!companyId) {
    return new Response(JSON.stringify({ error: "Charter Company ID not configured." }), { status: 400 })
  }

  const creds: NausysCredentials = {
    username,
    password,
    endpoint: endpoint || "https://ws.nausys.com/CBMS-external/rest",
    companyId,
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Clean up stale "running" syncs (older than 10 minutes)
      await db.nausysSyncLog.updateMany({
        where: {
          status: "running",
          startedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
        },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorMsg: "Timed out — process crashed or server restarted",
        },
      })

      // Send initial step list
      send({ type: "init", steps: SYNC_STEPS })

      // Create sync log
      const log = await db.nausysSyncLog.create({
        data: { syncType: "FULL", status: "running" },
      })

      const onProgress: SyncProgressFn = (key, status, count, error) => {
        send({ type: "progress", key, status, count: count ?? 0, error })
      }

      try {
        const result = await runFullSync(creds, onProgress)

        // Phase 2: Upload images to Bunny CDN
        send({ type: "progress", key: "images", status: "syncing", count: 0 })
        try {
          const imgResult = await syncAllYachtImages((yachtName, current, total, status) => {
            send({
              type: "image_progress",
              yachtName,
              current,
              total,
              status,
            })
          })
          send({
            type: "progress",
            key: "images",
            status: "done",
            count: imgResult.synced,
            detail: `${imgResult.synced} uploaded, ${imgResult.skipped} skipped, ${imgResult.failed} failed`,
          })
          result.itemCount += imgResult.synced
        } catch (imgErr: unknown) {
          const imgMsg = imgErr instanceof Error ? imgErr.message : "Image sync failed"
          send({ type: "progress", key: "images", status: "error", count: 0, error: imgMsg })
        }

        await db.nausysSyncLog.update({
          where: { id: log.id },
          data: {
            status: result.status,
            itemCount: result.itemCount,
            completedAt: new Date(),
            errorMsg: result.errorMsg || result.steps.join("\n"),
          },
        })

        send({ type: "complete", status: result.status, itemCount: result.itemCount })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        await db.nausysSyncLog.update({
          where: { id: log.id },
          data: { status: "failed", completedAt: new Date(), errorMsg: msg },
        })
        send({ type: "complete", status: "failed", error: msg })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
