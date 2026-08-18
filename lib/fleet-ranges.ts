/**
 * The outer edges of the fleet we actually have, and the helpers that turn
 * them into filter options.
 *
 * Search filters used to offer ranges nobody could ever match — 30m+ boats,
 * 7+ cabins, 13+ berths — against a fleet that tops out at 15m, 5 cabins and
 * 12 berths. Every one of those options returned an empty result.
 *
 * This module stays free of any database import so the client bundle can use
 * the helpers; the measurement itself lives in fleet-ranges.server.ts.
 */
export interface FleetRanges {
  maxCabins: number
  maxBerths: number
  minLoa: number
  /**
   * The longest boat, in whole metres, for anything a person reads.
   *
   * Rounded down rather than up: the fleet tops out at 15.59 m and the filters
   * offered "14 – 16 m", a band whose upper half is empty. Nobody thinks of
   * that boat as sixteen metres, and offering a size we do not have is the
   * same mistake as the 30 m options this module was written to remove.
   */
  maxLoa: number
  /**
   * The same boat, unrounded — for the query.
   *
   * The two have to be kept apart. Round the number a query uses and the
   * largest yacht in the fleet stops matching her own upper bound: ask for
   * "up to 15 m" and Roxane, at 15.59, disappears from a search she is the
   * answer to.
   */
  maxLoaExact: number
}

/** What to offer when the table is empty or unreachable — the fleet as it stands. */
export const FLEET_RANGES_FALLBACK: FleetRanges = {
  maxCabins: 5,
  maxBerths: 12,
  minLoa: 9,
  maxLoa: 15,
  maxLoaExact: 15.59,
}

/**
 * Split 1..max into buckets of `step`, with the last bucket stopping at `max`
 * rather than running past it. A bucket covering a single value is labelled as
 * that value, not as "5 – 5".
 */
export function buckets(max: number, step: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  for (let from = 1; from <= max; from += step) {
    const to = Math.min(from + step - 1, max)
    out.push({ value: `${from}-${to}`, label: from === to ? `${from}` : `${from} – ${to}` })
  }
  return out
}

/**
 * Length bands across the fleet, in whole metres. Opens with an "under" band so
 * the smallest boats are reachable without the visitor knowing the exact
 * minimum. Labels are returned as parts rather than prose so the caller can
 * translate them.
 */
export function lengthBands(
  minLoa: number,
  maxLoa: number,
  /* What the last band searches on. The label says 15; the query has to say
     15.59, or the boat that sets the ceiling falls outside it. */
  maxLoaExact = maxLoa,
  step = 2
): ({ value: string } & ({ kind: "under"; to: number } | { kind: "range"; from: number; to: number }))[] {
  const first = Math.max(step, Math.floor(minLoa / step) * step) + step
  const out: ReturnType<typeof lengthBands> = [{ value: `0-${first}`, kind: "under", to: first }]
  for (let from = first; from < maxLoa; from += step) {
    const to = Math.min(from + step, maxLoa)
    const queryTo = to >= maxLoa ? Math.max(maxLoaExact, maxLoa) : to
    out.push({ value: `${from}-${queryTo}`, kind: "range", from, to })
  }
  return out
}
