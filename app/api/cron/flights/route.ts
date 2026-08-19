import { NextRequest, NextResponse } from "next/server"
import { syncFlights } from "@/lib/flights"

/**
 * One day's flight schedule, once a day.
 *
 * Meant for a scheduler — Coolify, cron, anything that can call a URL:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://iyc.de/api/cron/flights
 *
 * Calling it more often is not useful and is actively harmful: the quota is
 * monthly and small, and the API rate-limits bursts outright. Two requests
 * per run at most, so a daily schedule sits near sixty a month.
 */
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  /* An open endpoint here would let anyone drain a month of quota in a
     minute. Without a secret configured it refuses rather than defaulting to
     open, which is the failure that gets noticed rather than exploited. */
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 })
  }
  const offered = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (offered !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const result = await syncFlights()
    console.log(
      `[flights] ${result.date}: ${result.stored}/${result.seen} routes, ` +
        `${result.requests} requests, learned ${result.learned ?? "nothing"}, ` +
        `${result.unresolved.length} airports still unnamed, dropped ${result.dropped}`
    )
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[flights] ${message}`)
    /* 502, not 500: the failure is upstream, and a scheduler that retries on
       5xx should be told the difference between "we broke" and "they did". */
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
