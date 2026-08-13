/**
 * The outer edges of the fleet we actually have, and the helpers that turn
 * them into filter options.
 *
 * Search filters used to offer ranges nobody could ever match — 30m+ boats,
 * 7+ cabins, 13+ berths — against a fleet that tops out at 16m, 5 cabins and
 * 12 berths. Every one of those options returned an empty result.
 *
 * This module stays free of any database import so the client bundle can use
 * the helpers; the measurement itself lives in fleet-ranges.server.ts.
 */
export interface FleetRanges {
  maxCabins: number
  maxBerths: number
  minLoa: number
  maxLoa: number
}

/** What to offer when the table is empty or unreachable — the fleet as it stands. */
export const FLEET_RANGES_FALLBACK: FleetRanges = {
  maxCabins: 5,
  maxBerths: 12,
  minLoa: 10,
  maxLoa: 16,
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
  step = 2
): ({ value: string } & ({ kind: "under"; to: number } | { kind: "range"; from: number; to: number }))[] {
  const first = Math.max(step, Math.floor(minLoa / step) * step) + step
  const out: ReturnType<typeof lengthBands> = [{ value: `0-${first}`, kind: "under", to: first }]
  for (let from = first; from < maxLoa; from += step) {
    out.push({ value: `${from}-${Math.min(from + step, maxLoa)}`, kind: "range", from, to: Math.min(from + step, maxLoa) })
  }
  return out
}
