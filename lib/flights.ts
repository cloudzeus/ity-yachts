import "server-only"
import { db } from "@/lib/db"

/**
 * The flights that land at Preveza, which is how nearly every guest arrives.
 *
 * The office kept this as a PDF, redrawn once a year — accurate the day it was
 * made and stale by August. AviationStack publishes the same thing as filed
 * schedules, so the page can be right without anyone maintaining it.
 *
 * The quota is the whole design constraint. It is small, it is monthly, and
 * six calls inside a few seconds was enough to be rate-limited outright, so
 * nothing here fetches on a page view: a job takes one day at a time and the
 * site reads what it stored.
 *
 * One request returns one date, and these flights are weekly — a Saturday
 * request says nothing about Tuesdays. So the job walks the next seven days,
 * one per run, and after a week the whole weekly pattern is known and starts
 * refreshing itself in a rolling window.
 */

const BASE = "https://api.aviationstack.com/v1"

/** Every guest flies into Preveza; Aktion, 20 minutes from the pontoon. */
export const ARRIVAL_AIRPORT = "PVK"

/** How many days ahead the rolling window reaches. */
const WINDOW_DAYS = 7

/**
 * A schedule row is dropped after this long without being seen again.
 *
 * Longer than the window so a route is not forgotten between two passes over
 * the same weekday, and short enough that a service withdrawn for the season
 * stops being advertised within a month.
 */
const FORGET_AFTER_DAYS = 30

/** At most one unknown airport is resolved per run — see the quota note above. */
const AIRPORT_LOOKUPS_PER_RUN = 1

interface FutureFlight {
  weekday?: string
  departure?: { iataCode?: string; scheduledTime?: string }
  arrival?: { scheduledTime?: string }
  aircraft?: { modelText?: string }
  airline?: { name?: string; iataCode?: string }
  flight?: { iataNumber?: string }
}

async function apiKey(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  const key = (record?.value as Record<string, string> | null)?.aviationstackKey?.trim()
  if (!key) throw new Error("AviationStack key not configured — Settings → API keys")
  return key
}

/** A call, with the API's habit of reporting failure inside a 200 handled. */
async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = await apiKey()
  const query = new URLSearchParams({ access_key: key, ...params })
  const res = await fetch(`${BASE}/${path}?${query}`, { cache: "no-store" })
  const body = await res.json().catch(() => null)
  if (body?.error) {
    const e = body.error
    throw new Error(`aviationstack ${e.code ?? res.status}: ${e.message ?? "unknown"}`)
  }
  if (!res.ok) throw new Error(`aviationstack ${res.status}`)
  return body as T
}

/** "2026-09-05 06:05:00" → "06:05". Times are local and left that way. */
function hhmm(value: string | undefined): string | null {
  const m = /(\d{2}:\d{2})/.exec(value ?? "")
  return m ? m[1] : null
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/**
 * Which date this run should ask about.
 *
 * Derived from the date itself rather than from a stored cursor: the run on
 * any given day always takes the same slot in the window, so a missed day
 * costs that one day's refresh instead of shifting the rotation permanently.
 */
export function targetDate(today = new Date()): Date {
  const offset = (Math.floor(today.getTime() / 86_400_000) % WINDOW_DAYS) + 1
  const d = new Date(today)
  d.setUTCDate(d.getUTCDate() + offset)
  return d
}

/**
 * Fill in the country for one airport we have not seen before.
 *
 * The schedule rows carry only a code, and the page groups by country. Costs
 * one request, so it is done for a single airport per run and the answer is
 * kept for good.
 */
async function learnAirport(iata: string): Promise<boolean> {
  const body = await call<{ data?: Record<string, string>[] }>("airports", { iata_code: iata })
  const a = body.data?.[0]
  if (!a?.country_name) return false
  await db.airport.upsert({
    where: { iata },
    create: {
      iata,
      name: a.airport_name ?? iata,
      cityIata: a.city_iata_code ?? null,
      countryName: a.country_name,
      countryIso2: (a.country_iso2 ?? "").slice(0, 2),
      timezone: a.timezone ?? null,
    },
    update: {
      name: a.airport_name ?? iata,
      countryName: a.country_name,
      countryIso2: (a.country_iso2 ?? "").slice(0, 2),
      timezone: a.timezone ?? null,
    },
  })
  return true
}

export interface SyncResult {
  date: string
  requests: number
  seen: number
  stored: number
  learned: string | null
  unresolved: string[]
  dropped: number
}

/** One day's schedule, folded into the weekly pattern. Two requests at most. */
export async function syncFlights(today = new Date()): Promise<SyncResult> {
  const when = targetDate(today)
  const date = iso(when)
  let requests = 0

  const body = await call<{ data?: FutureFlight[] }>("flightsFuture", {
    iataCode: ARRIVAL_AIRPORT,
    type: "arrival",
    date,
  })
  requests++

  const rows = body.data ?? []
  /* The API reports the weekday of the date asked for; trusting our own
     calculation instead would drift the moment a timezone disagreed. */
  const weekday = Number(rows[0]?.weekday) || ((when.getUTCDay() + 6) % 7) + 1

  let stored = 0
  const codes = new Set<string>()
  for (const f of rows) {
    const dep = f.departure?.iataCode?.toUpperCase()
    const flightIata = f.flight?.iataNumber?.toUpperCase()
    const depTime = hhmm(f.departure?.scheduledTime)
    const arrTime = hhmm(f.arrival?.scheduledTime)
    // A row without these cannot be shown to anyone, so it is not kept.
    if (!dep || !flightIata || !depTime || !arrTime) continue
    codes.add(dep)

    const data = {
      weekday,
      airlineName: f.airline?.name ?? "",
      airlineIata: f.airline?.iataCode?.toUpperCase() ?? null,
      flightIata,
      depIata: dep,
      depTime,
      arrTime,
      aircraft: f.aircraft?.modelText ?? null,
      lastSeenOn: when,
    }
    await db.flightRoute.upsert({
      where: { weekday_flightIata_depIata: { weekday, flightIata, depIata: dep } },
      create: { ...data, firstSeenOn: when },
      update: data,
    })
    stored++
  }

  /* Airports we cannot name a country for yet. One is resolved now; the rest
     wait for later runs rather than spending the month's quota at once. */
  const known = new Set(
    (await db.airport.findMany({ where: { iata: { in: [...codes] } }, select: { iata: true } })).map(
      (a) => a.iata
    )
  )
  const unknown = [...codes].filter((c) => !known.has(c)).sort()
  let learned: string | null = null
  for (const iata of unknown.slice(0, AIRPORT_LOOKUPS_PER_RUN)) {
    try {
      if (await learnAirport(iata)) learned = iata
      requests++
    } catch {
      // A failed lookup is not worth failing the run for; it retries tomorrow.
    }
  }

  /* Routes nobody has filed for a month are gone, not merely unobserved. */
  const cutoff = new Date(today)
  cutoff.setUTCDate(cutoff.getUTCDate() - FORGET_AFTER_DAYS)
  const { count: dropped } = await db.flightRoute.deleteMany({
    where: { lastSeenOn: { lt: cutoff } },
  })

  return {
    date,
    requests,
    seen: rows.length,
    stored,
    learned,
    unresolved: unknown.filter((c) => c !== learned),
    dropped,
  }
}

/**
 * The next date this weekly service actually runs.
 *
 * A weekday alone is an abstraction — "Saturday" is not a thing anyone can
 * book. Computed on the server so the board shows the same date to everyone
 * and React has nothing to disagree with after hydration.
 */
export function nextOccurrence(weekday: number, from = new Date()): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  // getUTCDay is 0 = Sunday; the schedules count 1 = Monday.
  const today = ((d.getUTCDay() + 6) % 7) + 1
  const ahead = (weekday - today + 7) % 7
  d.setUTCDate(d.getUTCDate() + ahead)
  return d
}

export interface CountryFlights {
  country: string
  iso2: string
  airports: {
    iata: string
    name: string
    routes: {
      weekday: number
      airlineName: string
      flightIata: string
      depTime: string
      arrTime: string
      /** yyyy-mm-dd of the next time it flies. */
      nextDate: string
    }[]
  }[]
}

/**
 * Everything we know, grouped the way someone reads it: their country first,
 * then the airport they would drive to, then the days it flies.
 *
 * Airports still awaiting a country are held back rather than shown under a
 * blank heading — they will appear once a later run has named them.
 */
export async function flightsByCountry(): Promise<CountryFlights[]> {
  const [routes, airports] = await Promise.all([
    db.flightRoute.findMany({
      orderBy: [{ depIata: "asc" }, { weekday: "asc" }, { depTime: "asc" }],
      select: {
        weekday: true,
        airlineName: true,
        flightIata: true,
        depTime: true,
        arrTime: true,
        depIata: true,
      },
    }),
    db.airport.findMany(),
  ])

  const byIata = new Map(airports.map((a) => [a.iata, a]))
  const countries = new Map<string, CountryFlights>()

  for (const r of routes) {
    const airport = byIata.get(r.depIata)
    if (!airport) continue

    let country = countries.get(airport.countryName)
    if (!country) {
      country = { country: airport.countryName, iso2: airport.countryIso2, airports: [] }
      countries.set(airport.countryName, country)
    }
    let entry = country.airports.find((a) => a.iata === r.depIata)
    if (!entry) {
      entry = { iata: airport.iata, name: airport.name, routes: [] }
      country.airports.push(entry)
    }
    entry.routes.push({
      weekday: r.weekday,
      airlineName: r.airlineName,
      flightIata: r.flightIata,
      depTime: r.depTime,
      arrTime: r.arrTime,
      nextDate: nextOccurrence(r.weekday).toISOString().slice(0, 10),
    })
  }

  // Most connections first — the country a reader is most likely to be in.
  const total = (c: CountryFlights) => c.airports.reduce((n, a) => n + a.routes.length, 0)
  const out = [...countries.values()].sort((a, b) => total(b) - total(a) || a.country.localeCompare(b.country))
  for (const c of out) c.airports.sort((a, b) => b.routes.length - a.routes.length)
  return out
}
