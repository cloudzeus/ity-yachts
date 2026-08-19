import { NextRequest, NextResponse } from "next/server"
import { syncFlights } from "@/lib/flights"

/**
 * The week's flight schedule, once a week.
 *
 * Meant for a scheduler — Coolify, cron, anything that can call a URL:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://iyc.de/api/cron/flights
 *
 * Weekly, because a weekly timetable is what it reads: an airline that flies
 * on Tuesdays flies on Tuesdays all season, and asking again tomorrow returns
 * what we already hold. The dates the site shows are worked out from the
 * weekday at render time, so they stay current between runs.
 *
 * Around eleven requests, spaced twenty seconds apart — roughly forty-five a
 * month against a small monthly quota. Running it more often is not useful
 * and is actively harmful.
 *
 * It takes some minutes by design. A scheduler that times out before the run
 * finishes will still leave the days that completed stored.
 */
export const dynamic = "force-dynamic"
export const maxDuration = 300

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
    const stored = result.days.reduce((n, d) => n + d.stored, 0)
    console.log(
      `[flights] ${result.days.length}/7 days, ${stored} services, ` +
        `${result.requests} requests, learned ${result.learned.join(",") || "nothing"}, ` +
        `${result.unresolved.length} airports still unnamed, dropped ${result.dropped}` +
        (result.failed.length ? ` — failed: ${result.failed.map((f) => f.date).join(",")}` : "")
    )
    /* A run where nothing came back is a failure worth a non-2xx, so a
       scheduler that alerts on status says something. */
    return NextResponse.json(result, { status: result.days.length ? 200 : 502 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[flights] ${message}`)
    /* 502, not 500: the failure is upstream, and a scheduler that retries on
       5xx should be told the difference between "we broke" and "they did". */
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
