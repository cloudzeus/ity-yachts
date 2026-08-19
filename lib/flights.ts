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
 * request says nothing about Tuesdays. So a run walks the next seven days and
 * comes away with the whole pattern.
 *
 * Weekly, not daily, because the thing being read is a weekly timetable: an
 * airline that flies on Tuesdays flies on Tuesdays all season, and asking
 * again tomorrow returns what we already hold. The dates the site shows stay
 * current regardless — they are worked out from the weekday when the page
 * renders, not stored.
 *
 * The seven calls are spaced. Six of them inside a few seconds was enough to
 * be rate-limited outright, and a burst that trips the limit costs the run.
 */

const BASE = "https://api.aviationstack.com/v1"

/** Every guest flies into Preveza; Aktion, 20 minutes from the pontoon. */
export const ARRIVAL_AIRPORT = "PVK"

/** Days a run covers — one week, which is the period the timetable repeats on. */
const WINDOW_DAYS = 7

/**
 * A schedule row is dropped after this long without being seen again.
 *
 * Several runs long, so a week that half failed does not erase a route that
 * is still flying, and short enough that a service withdrawn for the season
 * stops being advertised within a month.
 */
const FORGET_AFTER_DAYS = 30

/** Unknown airports resolved per run. Weekly, so a handful is affordable. */
const AIRPORT_LOOKUPS_PER_RUN = 4

/**
 * Between calls.
 *
 * Measured rather than guessed, and the plan is stricter than it looks: six
 * calls inside a few seconds was refused outright, and the refusal persisted
 * for minutes afterwards. A weekly run has all the time in the world.
 */
const SPACING_MS = 45_000

/** After a rate limit, wait this long once before giving that day up. */
const BACKOFF_MS = 90_000

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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
 * How far ahead the schedules endpoint will answer at all.
 *
 * Asking about tomorrow returns `date must be above <today + 7>` — the
 * endpoint only serves filed schedules from eight days out. The first run
 * asked for tomorrow through the week ahead and every one of the seven was
 * refused, which cost the requests and returned nothing.
 */
const EARLIEST_DAYS_AHEAD = 8

/** The seven dates a run covers, all of them far enough ahead to be served. */
export function weekAhead(today = new Date()): Date[] {
  return Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    )
    d.setUTCDate(d.getUTCDate() + EARLIEST_DAYS_AHEAD + i)
    return d
  })
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
  /** Dates that answered, and how many services each brought. */
  days: { date: string; stored: number }[]
  failed: { date: string; reason: string }[]
  requests: number
  learned: string[]
  unresolved: string[]
  dropped: number
}

/** One date's schedule, folded into the weekly pattern. */
async function syncDay(when: Date): Promise<{ stored: number; codes: Set<string> }> {
  const date = iso(when)
  const body = await call<{ data?: FutureFlight[] }>("flightsFuture", {
    iataCode: ARRIVAL_AIRPORT,
    type: "arrival",
    date,
  })

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
  return { stored, codes }
}

/**
 * A week's timetable, in one run.
 *
 * Every day is attempted and a day that fails is recorded rather than
 * thrown: a rate limit on Thursday should not cost the six days that
 * answered, and the ones that did are already stored by the time it happens.
 */
export async function syncFlights(today = new Date()): Promise<SyncResult> {
  const days: SyncResult["days"] = []
  const failed: SyncResult["failed"] = []
  const codes = new Set<string>()
  let requests = 0

  const dates = weekAhead(today)
  for (let i = 0; i < dates.length; i++) {
    if (i > 0) await sleep(SPACING_MS)
    const when = dates[i]
    try {
      requests++
      const day = await syncDay(when)
      day.codes.forEach((c) => codes.add(c))
      days.push({ date: iso(when), stored: day.stored })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      /* One more try after a longer wait, but only for the limit — a bad key
         or a bad date will fail again just as fast. */
      if (message.includes("rate_limit")) {
        await sleep(BACKOFF_MS)
        try {
          requests++
          const day = await syncDay(when)
          day.codes.forEach((c) => codes.add(c))
          days.push({ date: iso(when), stored: day.stored })
          continue
        } catch (retry) {
          failed.push({
            date: iso(when),
            reason: retry instanceof Error ? retry.message : String(retry),
          })
          continue
        }
      }
      failed.push({ date: iso(when), reason: message })
    }
  }

  /* Airports we cannot name a country for yet. A few are resolved now; the
     rest wait for next week rather than spending the month at once. */
  const known = new Set(
    (await db.airport.findMany({ where: { iata: { in: [...codes] } }, select: { iata: true } })).map(
      (a) => a.iata
    )
  )
  const unknown = [...codes].filter((c) => !known.has(c)).sort()
  const learned: string[] = []
  for (const iata of unknown.slice(0, AIRPORT_LOOKUPS_PER_RUN)) {
    await sleep(SPACING_MS)
    try {
      requests++
      if (await learnAirport(iata)) learned.push(iata)
    } catch {
      // A failed lookup is not worth failing the run for; it retries next week.
    }
  }

  /* Routes nobody has filed for a month are gone, not merely unobserved.
     Only when the week actually came back: a run that failed throughout
     would otherwise delete the timetable it could not refresh. */
  let dropped = 0
  if (days.length >= 4) {
    const cutoff = new Date(today)
    cutoff.setUTCDate(cutoff.getUTCDate() - FORGET_AFTER_DAYS)
    ;({ count: dropped } = await db.flightRoute.deleteMany({
      where: { lastSeenOn: { lt: cutoff } },
    }))
  }

  return {
    days,
    failed,
    requests,
    learned,
    unresolved: unknown.filter((c) => !learned.includes(c)),
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

/** Preveza keeps Greek time; every arrival here is read against it. */
const ARRIVAL_TZ = "Europe/Athens"

/** How far a zone is from UTC at a given instant, daylight saving included. */
function offsetMinutes(tz: string, at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value])
  ) as Record<string, string>
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute)
  )
  return (asUtc - at.getTime()) / 60_000
}

/**
 * Time in the air, in minutes.
 *
 * Both times are local to their own airport, and subtracting them is wrong:
 * Preveza is an hour ahead of central Europe, so Düsseldorf 05:50 → 09:40
 * looks like three hours fifty and is two hours fifty. The first version of
 * this shipped that number with a comment explaining why it was fine, which
 * it was not — an arrival board can afford to be decorative, a flight time a
 * reader plans around cannot.
 *
 * Null when the departure airport's zone is unknown: no figure is better
 * than a confident wrong one.
 */
export function blockMinutes(
  depTime: string,
  arrTime: string,
  depTz: string | null,
  onDate: string
): number | null {
  if (!depTz) return null
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  try {
    const noon = new Date(`${onDate}T12:00:00Z`)
    const depOffset = offsetMinutes(depTz, noon)
    const arrOffset = offsetMinutes(ARRIVAL_TZ, noon)
    // Both brought back to UTC before they are compared.
    const total = mins(arrTime) - arrOffset - (mins(depTime) - depOffset)
    const wrapped = ((total % 1440) + 1440) % 1440
    return wrapped > 0 ? wrapped : null
  } catch {
    return null
  }
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
      /** Time in the air, or null when the departure zone is unknown. */
      blockMinutes: number | null
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
    const nextDate = nextOccurrence(r.weekday).toISOString().slice(0, 10)
    entry.routes.push({
      weekday: r.weekday,
      airlineName: r.airlineName,
      flightIata: r.flightIata,
      depTime: r.depTime,
      arrTime: r.arrTime,
      nextDate,
      blockMinutes: blockMinutes(r.depTime, r.arrTime, airport.timezone, nextDate),
    })
  }

  // Most connections first — the country a reader is most likely to be in.
  const total = (c: CountryFlights) => c.airports.reduce((n, a) => n + a.routes.length, 0)
  const out = [...countries.values()].sort((a, b) => total(b) - total(a) || a.country.localeCompare(b.country))
  for (const c of out) c.airports.sort((a, b) => b.routes.length - a.routes.length)
  return out
}
