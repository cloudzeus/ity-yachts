"use client"

import { useMemo, useState } from "react"
import { Plane, Ship, Bus, Car, ExternalLink, MapPin, FileText, Download } from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { readableSize, type TransfersSetting } from "@/lib/transfers"
import type { CountryFlights } from "@/lib/flights"
import { FlightBoard, type BoardRow } from "@/components/flight-board"

/**
 * The journey, in the order it happens: fly to Preveza, then twenty minutes
 * to the pontoon.
 *
 * Flights are grouped by country because that is the question a reader is
 * actually asking — not "which airlines serve PVK" but "can I get there from
 * where I live". Within a country the airports are ordered by how many
 * flights they have, so the useful one is first.
 */

const DAYS: { key: string; en: string; short: string }[] = [
  { key: "mon", en: "Monday", short: "Mon" },
  { key: "tue", en: "Tuesday", short: "Tue" },
  { key: "wed", en: "Wednesday", short: "Wed" },
  { key: "thu", en: "Thursday", short: "Thu" },
  { key: "fri", en: "Friday", short: "Fri" },
  { key: "sat", en: "Saturday", short: "Sat" },
  { key: "sun", en: "Sunday", short: "Sun" },
]

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]

/** "2026-09-05" → "SAT 05 SEP 2026", the way a departure board writes it. */
function boardDate(isoDate: string, weekday: number): string {
  const [y, m, d] = isoDate.split("-")
  return `${DAYS[weekday - 1]?.short.toUpperCase() ?? ""} ${d} ${MONTHS[Number(m) - 1] ?? ""} ${y}`
}

/** The same date in a card: "Sat 22 Aug 2026", sentence case rather than shouted. */
function cardDate(isoDate: string, weekday: number, dayLabel: string): string {
  const [y, m, d] = isoDate.split("-")
  const month = MONTHS[Number(m) - 1] ?? ""
  return `${dayLabel} ${d} ${month.charAt(0)}${month.slice(1).toLowerCase()} ${y}`
}

/**
 * Time in the air, as words.
 *
 * The figure itself is worked out on the server, where the departure
 * airport's time zone is known — subtracting two local clocks here gave
 * Düsseldorf 05:50 → 09:40 as three hours fifty when it is two hours fifty,
 * because Preveza is an hour ahead. Null means we do not know the zone, and
 * nothing is shown rather than a confident wrong number.
 */
function durationLabel(minutes: number | null): string | null {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/**
 * The country, in the reader's own language.
 *
 * AviationStack names them in English and only in English, so a German
 * visitor met "Germany" on a page that was otherwise entirely German. The
 * ISO code is stored beside the name and the browser already knows every
 * translation of it — no dictionary to keep, and no country left out.
 *
 * Falls back to the English the API gave us if the code is missing or the
 * runtime has no display names, which is better than a bare "DE".
 */
function countryName(iso2: string, english: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(iso2.toUpperCase()) || english
  } catch {
    return english
  }
}

const TRANSFER_ICON = { preveza: Car, igoumenitsa: Ship, athens: Bus } as const

/**
 * The carrier as a passenger would name it.
 *
 * The schedules carry marketing and livery detail in brackets — "condor (red
 * passengers)", "eurowings (salzburg)" — which on a board reads as damage.
 */
function airlineName(raw: string): string {
  return raw.replace(/\s*\(.*$/, "").trim() || raw
}

export function GettingHereClient({
  countries,
  transfers,
}: {
  countries: CountryFlights[]
  transfers: TransfersSetting
}) {
  const { t, locale } = useTranslations()
  const [country, setCountry] = useState<string | null>(null)

  const shown = useMemo(
    () => (country ? countries.filter((c) => c.country === country) : countries),
    [countries, country]
  )
  const totalRoutes = useMemo(
    () => countries.reduce((n, c) => n + c.airports.reduce((m, a) => m + a.routes.length, 0), 0),
    [countries]
  )

  const lang = (v: { en: string; el: string; de: string }) =>
    v[locale as "en" | "el" | "de"] ?? v.en

  /* Every flight we know, as board rows. Shuffling is deliberate: in filed
     order the board would sit on one country for a dozen turns and read as
     though only Germany flies here. */
  const board: BoardRow[] = useMemo(() => {
    const rows: BoardRow[] = []
    for (const c of countries) {
      for (const a of c.airports) {
        for (const r of a.routes) {
          rows.push({
            from: a.name,
            airline: airlineName(r.airlineName),
            date: boardDate(r.nextDate, r.weekday),
            when: `${r.depTime} · ${r.arrTime}`,
            code: r.flightIata,
          })
        }
      }
    }
    /* Deterministic interleave rather than Math.random: the server and the
       client must agree on the first row or React reports a mismatch. */
    const spread: BoardRow[] = []
    const step = 7
    for (let i = 0; i < rows.length; i++) spread.push(rows[(i * step) % rows.length])
    return spread
  }, [countries])

  return (
    <main style={{ background: "var(--surface-page)", color: "var(--text-heading)" }}>
      {/* ── Opening ─────────────────────────────────────────────────────── */}
      {/* Dark by necessity as much as by taste: the site header is transparent
          until you scroll, so a light band at the top of a page leaves the
          logo and the navigation invisible. */}
      <section
        className="w-full px-6 md:px-10 pt-32 pb-14 md:pt-40 md:pb-20"
        style={{ background: "var(--surface-inverse)", color: "var(--iyc-sand-50)" }}
      >
        <div className="mx-auto max-w-[1400px]">
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--iyc-sun-500)" }}
          >
            {t("gettingHere.eyebrow", "Getting here")}
          </p>
          <h1
            className="max-w-4xl text-4xl md:text-6xl font-semibold leading-[1.05]"
            /* Colour stated rather than inherited: a global rule gives every
               h1 the heading colour, which is near-black and vanished here. */
            style={{ fontFamily: "var(--font-display)", color: "var(--iyc-sand-50)" }}
          >
            {t("gettingHere.title", "Fly to Preveza. We are twenty minutes away.")}
          </h1>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <p
              className="max-w-2xl text-base md:text-lg leading-relaxed"
              style={{ color: "var(--iyc-sand-200)" }}
            >
              {t(
                "gettingHere.intro",
                "Preveza (PVK) is the airport for Lefkada, and in summer it is served directly from most of Europe. Below is what the airlines have filed, by country — and what it takes to cover the last stretch to our pontoon."
              )}
            </p>
            {/* The board says the same thing as the paragraph, faster and
                without asking anyone to read it. */}
            <FlightBoard rows={board} className="w-full lg:w-[26rem] shrink-0" />
          </div>
        </div>
      </section>

      {/* ── Flights ─────────────────────────────────────────────────────── */}
      <section className="w-full px-6 md:px-10 pb-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {t("gettingHere.flightsHeading", "Direct flights to Preveza")}
            </h2>
            {totalRoutes > 0 && (
              <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                {t("gettingHere.flightsCount", "Weekly services")}: {totalRoutes}
              </p>
            )}
          </div>

          {countries.length === 0 ? (
            /* Not an error — the schedule job simply has not run here yet. */
            <p
              className="rounded-[var(--iyc-radius-sm)] px-5 py-8 text-sm"
              style={{ background: "var(--surface-sunken)", color: "var(--text-muted)" }}
            >
              {t(
                "gettingHere.noFlights",
                "Flight schedules are being updated. Please write to us and we will send you the current connections."
              )}
            </p>
          ) : (
            <>
              {/* Country filter. Chips rather than a select: there are few
                  enough to show at once, and seeing your own country listed
                  answers the question before you click anything. */}
              <div className="mb-8 flex flex-wrap gap-2">
                <Chip active={country === null} onClick={() => setCountry(null)}>
                  {t("gettingHere.allCountries", "All countries")}
                </Chip>
                {countries.map((c) => (
                  <Chip
                    key={c.country}
                    active={country === c.country}
                    onClick={() => setCountry(country === c.country ? null : c.country)}
                  >
                    {countryName(c.iso2, c.country, locale)}
                  </Chip>
                ))}
              </div>

              {/* Bento rather than a uniform grid: the country with the most
                  connections earns the wide tile. A reader scanning for their
                  own flag finds the busy ones first, and the page stops
                  reading like a spreadsheet. */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 auto-rows-auto">
                {shown.map((c, i) => {
                  const services = c.airports.reduce((n, a) => n + a.routes.length, 0)
                  const wide = country === null && i === 0
                  return (
                    <article
                      key={c.country}
                      className={`group relative flex flex-col overflow-hidden rounded-[var(--iyc-radius-md)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 ${
                        wide ? "md:col-span-2" : ""
                      }`}
                      style={{
                        background: "var(--surface-raised)",
                        border: "1px solid var(--border-hairline)",
                        boxShadow: "0 1px 2px rgba(4,13,25,0.04)",
                      }}
                    >
                      {/* A hairline of Ionian sunset that draws itself across
                          the top on hover — the only decoration, and it earns
                          its place by marking which tile you are reading. */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                        style={{ background: "var(--iyc-sun-500)" }}
                      />

                      <header className="mb-6 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3
                            className="truncate text-xl md:text-2xl font-semibold leading-tight"
                            style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                          >
                            {countryName(c.iso2, c.country, locale)}
                          </h3>
                          <p
                            className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                            style={{ color: "var(--text-subtle)" }}
                          >
                            {c.iso2} · {c.airports.length}{" "}
                            {c.airports.length === 1
                              ? t("gettingHere.airport", "airport")
                              : t("gettingHere.airports", "airports")}
                          </p>
                        </div>
                        {/* The count, set large. It is the fact the tile
                            exists to convey. */}
                        <div className="shrink-0 text-right">
                          <span
                            className="block text-3xl md:text-4xl font-semibold leading-none tabular-nums"
                            style={{ fontFamily: "var(--font-display)", color: "var(--iyc-sun-500)" }}
                          >
                            {services}
                          </span>
                          <span
                            className="mt-1 block text-[10px] uppercase tracking-[0.16em]"
                            style={{ color: "var(--text-subtle)" }}
                          >
                            {t("gettingHere.weekly", "weekly")}
                          </span>
                        </div>
                      </header>

                      <div className={`flex flex-col gap-6 ${wide ? "md:grid md:grid-cols-2 md:gap-x-10" : ""}`}>
                        {c.airports.map((a) => (
                          <div key={a.iata}>
                            {/* The leg, drawn. Three letters and a rule say
                                "somewhere to Preveza" faster than a sentence. */}
                            <div className="mb-3 flex items-center gap-2">
                              <span
                                className="font-mono text-xs font-semibold tracking-wider"
                                style={{ color: "var(--text-heading)" }}
                              >
                                {a.iata}
                              </span>
                              <span
                                aria-hidden="true"
                                className="h-px flex-1"
                                style={{ background: "var(--border-hairline)" }}
                              />
                              <Plane
                                aria-hidden="true"
                                className="h-3 w-3 shrink-0 rotate-90"
                                style={{ color: "var(--iyc-sun-500)" }}
                              />
                              <span
                                className="font-mono text-xs font-semibold tracking-wider"
                                style={{ color: "var(--text-muted)" }}
                              >
                                PVK
                              </span>
                            </div>
                            <p
                              className="mb-2 truncate text-xs"
                              style={{ color: "var(--text-subtle)" }}
                            >
                              {a.name}
                            </p>

                            <ul className="flex flex-col">
                              {a.routes.map((r) => (
                                <li
                                  key={`${r.flightIata}-${r.weekday}`}
                                  className="flex items-baseline justify-between gap-3 border-t py-2 text-xs first:border-t-0"
                                  style={{ borderColor: "var(--border-hairline)" }}
                                >
                                  <span className="min-w-0">
                                    <span
                                      className="block truncate capitalize font-medium"
                                      style={{ color: "var(--text-heading)" }}
                                    >
                                      {airlineName(r.airlineName)}
                                    </span>
                                    <span
                                      className="block tabular-nums"
                                      style={{ color: "var(--text-subtle)" }}
                                    >
                                      {cardDate(
                                        r.nextDate,
                                        r.weekday,
                                        t(
                                          `gettingHere.day.${DAYS[r.weekday - 1]?.key ?? "mon"}`,
                                          DAYS[r.weekday - 1]?.short ?? ""
                                        )
                                      )}
                                    </span>
                                  </span>
                                  <span className="shrink-0 text-right tabular-nums">
                                    <span
                                      className="block font-medium"
                                      style={{ color: "var(--text-body)" }}
                                    >
                                      {r.depTime}–{r.arrTime}
                                    </span>
                                    {durationLabel(r.blockMinutes) && (
                                      <span
                                        className="block"
                                        style={{ color: "var(--iyc-sun-600)" }}
                                      >
                                        {durationLabel(r.blockMinutes)}
                                      </span>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>

              <p className="mt-5 text-xs" style={{ color: "var(--text-subtle)" }}>
                {t(
                  "gettingHere.flightsNote",
                  "Schedules as filed by the airlines and refreshed daily. Times are local. Always confirm with the airline before booking."
                )}
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── The sheet to keep ───────────────────────────────────────────
          Between the timetable and the transfers, which is where somebody
          who has just read the schedule decides they want it with them. */}
      {transfers.brochure && (
        <section className="w-full px-6 md:px-10 pt-10">
          <div className="mx-auto max-w-[1400px]">
            <a
              href={transfers.brochure.url}
              download={transfers.brochure.name}
              target="_blank"
              rel="noopener"
              className="group flex flex-wrap items-center gap-4 rounded-[var(--iyc-radius-md)] p-5 transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transition-none"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "color-mix(in srgb, var(--iyc-sun-500) 14%, transparent)" }}
              >
                <FileText className="size-5" style={{ color: "var(--iyc-sun-600)" }} aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                  {lang(transfers.brochure.label) ||
                    t("gettingHere.brochureTitle", "The full flight overview")}
                </span>
                <span className="mt-0.5 block text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("gettingHere.brochureBody", "One sheet to print or forward — every route, day and time for the season.")}
                  {" "}
                  <span className="tabular-nums" style={{ color: "var(--text-subtle)" }}>
                    PDF{readableSize(transfers.brochure.size) ? ` · ${readableSize(transfers.brochure.size)}` : ""}
                    {transfers.brochure.updated ? ` · ${transfers.brochure.updated}` : ""}
                  </span>
                </span>
              </span>

              <span
                className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-300"
                style={{ background: "var(--iyc-ionian-600)", color: "#fff" }}
              >
                <Download className="size-3.5" aria-hidden="true" />
                {t("gettingHere.brochureDownload", "Download")}
              </span>
            </a>
          </div>
        </section>
      )}

      {/* ── Transfers ───────────────────────────────────────────────────── */}
      <section className="w-full px-6 md:px-10 py-14 md:py-20">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="mb-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {t("gettingHere.transfersHeading", "The last stretch")}
          </h2>
          <p className="mb-8 max-w-2xl text-sm" style={{ color: "var(--text-body)" }}>
            {t(
              "gettingHere.transfersIntro",
              "Lefkada is joined to the mainland by a causeway, so there is no ferry to catch and no crossing to time. You drive on."
            )}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {transfers.items.map((tr) => {
              const Icon = TRANSFER_ICON[tr.fromKey as keyof typeof TRANSFER_ICON] ?? MapPin
              const primary = tr.emphasis === "primary"
              return (
                <article
                  key={tr.fromKey}
                  className="flex flex-col rounded-[var(--iyc-radius-md)] p-6"
                  style={{
                    background: primary ? "var(--iyc-ionian-600)" : "var(--surface-raised)",
                    border: primary ? "none" : "1px solid var(--border-hairline)",
                    color: primary ? "#fff" : "var(--text-heading)",
                  }}
                >
                  <Icon
                    className="mb-4 h-5 w-5"
                    style={{ color: primary ? "rgba(255,255,255,0.9)" : "var(--text-link)" }}
                  />
                  <h3 className="text-sm font-bold">{lang(tr.from)}</h3>
                  <p
                    className="mt-1 text-2xl font-semibold tabular-nums"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {lang(tr.duration)}
                  </p>
                  <p
                    className="mt-3 text-xs leading-relaxed"
                    style={{ color: primary ? "rgba(255,255,255,0.85)" : "var(--text-body)" }}
                  >
                    {lang(tr.cost)}
                  </p>
                  {tr.link && (
                    <a
                      href={tr.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2"
                      style={{ color: primary ? "#fff" : "var(--text-link)" }}
                    >
                      {tr.link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </article>
              )
            })}
          </div>

          <p className="mt-5 text-xs" style={{ color: "var(--text-subtle)" }}>
            {t("gettingHere.transfersNote", "Indicative prices, confirmed")} {transfers.updated}.{" "}
            {t(
              "gettingHere.transfersHelp",
              "Tell us your flight and we will have someone waiting."
            )}
          </p>
        </div>
      </section>
    </main>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer"
      style={{
        background: active ? "var(--iyc-ionian-600)" : "var(--surface-raised)",
        color: active ? "#fff" : "var(--text-body)",
        border: `1px solid ${active ? "var(--iyc-ionian-600)" : "var(--border-hairline)"}`,
      }}
    >
      {children}
    </button>
  )
}
