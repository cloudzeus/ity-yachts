import "server-only"
import { db } from "@/lib/db"
import { FLEET_RANGES_FALLBACK, type FleetRanges } from "@/lib/fleet-ranges"

/**
 * Measure the fleet.
 *
 * Read from the synced NAUSYS yachts, so the search options follow the fleet:
 * put a bigger boat on the pontoon and the filters widen on the next request,
 * with nothing to edit by hand.
 */
export async function getFleetRanges(): Promise<FleetRanges> {
  try {
    /* Berths are `berthsTotal || maxPersons` everywhere else in the app, so the
       maximum has to be taken over that expression per row — not as the larger
       of two independent column maxima, which would overstate it. */
    const rows = await db.$queryRawUnsafe<
      { maxCabins: unknown; maxBerths: unknown; minLoa: unknown; maxLoa: unknown }[]
    >(`
      SELECT MAX(NULLIF(cabins, 0))                                       AS maxCabins,
             MAX(COALESCE(NULLIF(berthsTotal, 0), NULLIF(maxPersons, 0))) AS maxBerths,
             MIN(NULLIF(loa, 0))                                          AS minLoa,
             MAX(NULLIF(loa, 0))                                          AS maxLoa
      FROM nausys_yachts
    `)

    const r = rows[0]
    if (!r) return FLEET_RANGES_FALLBACK

    // MySQL returns MAX() over an integer column as BigInt through the adapter.
    const n = (v: unknown, fallback: number) => {
      const x = typeof v === "bigint" ? Number(v) : Number(v)
      return Number.isFinite(x) && x > 0 ? x : fallback
    }

    return {
      maxCabins: Math.ceil(n(r.maxCabins, FLEET_RANGES_FALLBACK.maxCabins)),
      maxBerths: Math.ceil(n(r.maxBerths, FLEET_RANGES_FALLBACK.maxBerths)),
      minLoa: Math.floor(n(r.minLoa, FLEET_RANGES_FALLBACK.minLoa)),
      /* Whole metres to read, the real figure to search on. Rounding up used
         to advertise a 16 m boat we have never owned. */
      maxLoa: Math.floor(n(r.maxLoa, FLEET_RANGES_FALLBACK.maxLoa)),
      maxLoaExact: n(r.maxLoa, FLEET_RANGES_FALLBACK.maxLoaExact),
    }
  } catch {
    return FLEET_RANGES_FALLBACK
  }
}
