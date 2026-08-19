import { NextResponse } from "next/server"
import { flightsByCountry } from "@/lib/flights"

/**
 * A handful of flights, for the split-flap tile on the homepage and the
 * contact page.
 *
 * Read from our own table, never from AviationStack — that quota is spent by
 * the daily job, and a page view must not touch it. Fetched by the tile the
 * same way the weather panel beside it fetches its own, so the pages that
 * carry it stay static and the tile fills in.
 */
export const dynamic = "force-dynamic"

/** Enough to feel endless on a tile that changes every few seconds. */
const LIMIT = 24

/**
 * The place, short enough for a fourteen-character flap.
 *
 * "Amsterdam Schiphol" is eighteen and arrived as "AMSTERDAM SCHI", which
 * looks like a fault rather than an abbreviation. The first word is the city
 * in nearly every case; a very short first word is half a name — Tel Aviv,
 * Rome Fiumicino — so it takes the second as well.
 */
function tileName(name: string): string {
  const words = name.trim().split(/\s+/)
  if (!words.length) return name
  return words[0].length <= 4 ? words.slice(0, 2).join(" ") : words[0]
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

export async function GET() {
  try {
    const countries = await flightsByCountry()

    const rows: { from: string; airline: string; date: string; when: string; code: string }[] = []
    for (const c of countries) {
      for (const a of c.airports) {
        for (const r of a.routes) {
          const [y, m, d] = r.nextDate.split("-")
          rows.push({
            from: tileName(a.name),
            // The liveries the schedules carry in brackets read as damage here.
            airline: r.airlineName.replace(/\s*\(.*$/, "").trim(),
            date: `${DAYS[r.weekday - 1] ?? ""} ${d} ${MONTHS[Number(m) - 1] ?? ""} ${y}`,
            when: `${r.depTime} · ${r.arrTime}`,
            code: r.flightIata,
          })
        }
      }
    }

    /* Interleaved rather than taken in order: the first two dozen in filed
       order are all one country, and a tile that only ever shows Germany
       says the opposite of what it is there to say. */
    const spread: typeof rows = []
    for (let i = 0; i < rows.length && spread.length < LIMIT; i++) {
      spread.push(rows[(i * 7) % rows.length])
    }

    return NextResponse.json(
      { rows: spread },
      /* The schedules move once a day at most; there is no reason for every
         visitor to cost a query. */
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    )
  } catch {
    // The tile hides itself on an empty list, which is the right failure here.
    return NextResponse.json({ rows: [] })
  }
}
