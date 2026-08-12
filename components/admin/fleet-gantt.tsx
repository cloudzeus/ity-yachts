"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

/* ─── Fleet occupancy Gantt ────────────────────────────────────────────────
   One row per yacht, one bar per charter, a year at a time.

   Colour carries only two states, because only two can be told apart reliably:
   booked and option, validated at ΔE 22.7 under protanopia. Maintenance is a
   hatched slate rather than a third hue — every third colour that read as
   distinct to normal vision collapsed into the blue for red-blind viewers
   (violet scored ΔE 2.5). Texture is the honest encoding here, and hatching is
   the usual convention for time that isn't earning.                          */

const BOOKED = "#0B6099"
const OPTION = "#C1782A"
const SERVICE = "#6B7A85"

const PX_PER_DAY = 4
const ROW_H = 26
const LABEL_W = 132
const DAY_MS = 86_400_000

export interface GanttPeriod {
  id: string
  yachtId: number
  dateFrom: string
  dateTo: string
  status: string
  reservationNo: number | null
  checkInTime: string | null
  checkOutTime: string | null
  baseFrom: string | null
  baseTo: string | null
  optionValidTill: string | null
  listPrice: number | null
  currency: string
  booking: {
    id: string
    bookingNumber: string
    status: string
    totalPrice: number
    currency: string
    guests: number
    customer: string
    email: string
  } | null
}

export interface GanttYacht {
  id: number
  name: string
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Periods are stored as UTC midnight; read them the same way or bars shift a day. */
function utcDays(from: Date, to: Date) {
  return (to.getTime() - from.getTime()) / DAY_MS
}

function fmt(d: Date) {
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "17:00:00" → "17:00"; NAUSYS always sends whole minutes. */
function hhmm(t: string | null) {
  return t ? t.slice(0, 5) : null
}

function money(v: number | null, currency: string) {
  if (v == null) return null
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(v)
}

/** Days from today until `iso`; negative once it has passed. */
function daysUntil(iso: string) {
  const now = new Date()
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((new Date(iso).getTime() - today) / DAY_MS)
}

function styleFor(status: string) {
  if (status === "OPTION") return { fill: OPTION, label: "Option" }
  if (status === "MAINTENANCE") return { fill: SERVICE, label: "Service" }
  return { fill: BOOKED, label: "Booked" }
}

export function FleetGantt({ yachts, periods }: { yachts: GanttYacht[]; periods: GanttPeriod[] }) {
  const years = useMemo(() => {
    const set = new Set<number>()
    for (const p of periods) {
      const a = new Date(p.dateFrom).getUTCFullYear()
      const b = new Date(p.dateTo).getUTCFullYear()
      for (let y = a; y <= b; y++) set.add(y)
    }
    return [...set].sort()
  }, [periods])

  const thisYear = new Date().getUTCFullYear()
  const [year, setYear] = useState(() => (years.includes(thisYear) ? thisYear : (years[0] ?? thisYear)))
  const [hover, setHover] = useState<{ p: GanttPeriod; x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<GanttPeriod | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const yearStart = useMemo(() => new Date(Date.UTC(year, 0, 1)), [year])
  const yearEnd = useMemo(() => new Date(Date.UTC(year + 1, 0, 1)), [year])
  const totalDays = utcDays(yearStart, yearEnd)
  const trackW = totalDays * PX_PER_DAY

  // Bars for this year, clipped to it — a charter running across New Year
  // should still show its January half rather than vanish.
  const byYacht = useMemo(() => {
    const map = new Map<number, Array<GanttPeriod & { left: number; width: number }>>()
    for (const p of periods) {
      const from = new Date(p.dateFrom)
      const to = new Date(p.dateTo)
      if (to <= yearStart || from >= yearEnd) continue
      const clampedFrom = from < yearStart ? yearStart : from
      const clampedTo = to > yearEnd ? yearEnd : to
      const left = utcDays(yearStart, clampedFrom) * PX_PER_DAY
      // 2px breathing room so back-to-back charters read as two, not one long
      // block — turnaround days are shared, so their bars would otherwise touch.
      const width = Math.max(3, utcDays(clampedFrom, clampedTo) * PX_PER_DAY - 2)
      const list = map.get(p.yachtId) ?? []
      list.push({ ...p, left, width })
      map.set(p.yachtId, list)
    }
    return map
  }, [periods, yearStart, yearEnd])

  const months = useMemo(
    () =>
      MONTHS.map((m, i) => {
        const start = new Date(Date.UTC(year, i, 1))
        const end = new Date(Date.UTC(year, i + 1, 1))
        return { label: m, left: utcDays(yearStart, start) * PX_PER_DAY, width: utcDays(start, end) * PX_PER_DAY }
      }),
    [year, yearStart]
  )

  const todayX = useMemo(() => {
    const now = new Date()
    const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    if (utcToday < yearStart || utcToday >= yearEnd) return null
    return utcDays(yearStart, utcToday) * PX_PER_DAY
  }, [yearStart, yearEnd])

  // Open on the current date rather than on January, which is dead season.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || todayX === null) return
    el.scrollLeft = Math.max(0, todayX - el.clientWidth / 3)
  }, [todayX, year])

  const counts = useMemo(() => {
    let booked = 0, option = 0, service = 0
    for (const list of byYacht.values())
      for (const p of list) {
        if (p.status === "OPTION") option++
        else if (p.status === "MAINTENANCE") service++
        else booked++
      }
    return { booked, option, service }
  }, [byYacht])

  return (
    <div
      style={{
        background: "var(--surface-container-lowest)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
        style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
            Fleet Occupancy
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {yachts.length} yachts · {counts.booked} booked
            {counts.option > 0 && ` · ${counts.option} on option`}
            {counts.service > 0 && ` · ${counts.service} in service`} in {year}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Legend />
          {years.length > 1 && (
            <div className="flex items-center gap-1" role="group" aria-label="Year">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  aria-pressed={y === year}
                  className="px-2.5 py-1 text-xs font-semibold transition-colors"
                  style={{
                    borderRadius: "var(--radius-xs)",
                    background: y === year ? "var(--primary)" : "transparent",
                    color: y === year ? "#fff" : "var(--on-surface-variant)",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex">
        {/* Yacht names — outside the scroller so they stay put */}
        <div className="shrink-0 pb-4" style={{ width: LABEL_W }}>
          <div style={{ height: 28 }} />
          {yachts.map((y) => (
            <div
              key={y.id}
              className="flex items-center pl-6 pr-2"
              style={{ height: ROW_H }}
            >
              <Link
                href={`/admin/fleet/${y.id}`}
                className="truncate text-xs font-medium hover:underline"
                style={{ color: "var(--primary)" }}
              >
                {y.name}
              </Link>
            </div>
          ))}
        </div>

        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto pb-4 pr-6">
          <div className="relative" style={{ width: trackW }}>
            {/* Month scale */}
            <div className="relative" style={{ height: 28 }}>
              {months.map((m) => (
                <div
                  key={m.label}
                  className="absolute top-0 flex h-full items-center"
                  style={{ left: m.left, width: m.width, borderLeft: "1px solid var(--outline-variant)" }}
                >
                  {/* Sticky inside its own cell: scrolling into the middle of a
                      month keeps its name on screen instead of shearing it. */}
                  <span
                    className="sticky left-0 pl-1.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {yachts.map((y, i) => (
              <div
                key={y.id}
                className="relative"
                style={{
                  height: ROW_H,
                  background: i % 2 === 1 ? "var(--surface-container-low)" : "transparent",
                }}
              >
                {months.map((m) => (
                  <div
                    key={m.label}
                    className="absolute top-0 h-full"
                    style={{ left: m.left, borderLeft: "1px solid var(--outline-variant)", width: 1 }}
                  />
                ))}

                {(byYacht.get(y.id) ?? []).map((p) => {
                  const s = styleFor(p.status)
                  const hatched = p.status === "MAINTENANCE"
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${y.name}: ${s.label}, ${fmt(new Date(p.dateFrom))} to ${fmt(new Date(p.dateTo))}. Open details.`}
                      onMouseEnter={(e) =>
                        setHover({ p, x: e.currentTarget.getBoundingClientRect().left, y: e.currentTarget.getBoundingClientRect().top })
                      }
                      onMouseLeave={() => setHover(null)}
                      onClick={() => { setHover(null); setSelected(p) }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(p) }
                      }}
                      className="absolute cursor-pointer outline-offset-2 focus-visible:outline focus-visible:outline-2"
                      style={{
                        left: p.left,
                        width: p.width,
                        top: (ROW_H - 14) / 2,
                        height: 14,
                        borderRadius: 4,
                        background: hatched
                          ? `repeating-linear-gradient(45deg, ${SERVICE} 0 3px, transparent 3px 6px), var(--surface-container-lowest)`
                          : s.fill,
                        boxShadow: hatched ? `inset 0 0 0 1px ${SERVICE}` : undefined,
                      }}
                    />
                  )
                })}
              </div>
            ))}

            {/* Today. Dashed and in ink, never amber — amber is the Option
                status, and a solid amber rule reads as one more bar. */}
            {todayX !== null && (
              <div
                className="pointer-events-none absolute top-0"
                style={{
                  left: todayX,
                  height: 28 + yachts.length * ROW_H,
                  borderLeft: "1px dashed var(--primary)",
                }}
                aria-hidden
              >
                <span
                  className="absolute -top-0.5 left-1 text-[9px] font-bold uppercase tracking-wide"
                  style={{ color: "var(--primary)" }}
                >
                  Today
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {hover && !selected && <Tooltip period={hover.p} x={hover.x} y={hover.y} yachts={yachts} />}
      {selected && (
        <DetailPanel
          period={selected}
          yachtName={yachts.find((v) => v.id === selected.yachtId)?.name ?? ""}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function Legend() {
  const items = [
    { fill: BOOKED, label: "Booked", hatched: false },
    { fill: OPTION, label: "Option", hatched: false },
    { fill: SERVICE, label: "Service", hatched: true },
  ]
  return (
    <div className="flex items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span
            className="inline-block"
            style={{
              width: 14,
              height: 10,
              borderRadius: 3,
              background: i.hatched
                ? `repeating-linear-gradient(45deg, ${i.fill} 0 3px, transparent 3px 6px), var(--surface-container-lowest)`
                : i.fill,
              boxShadow: i.hatched ? `inset 0 0 0 1px ${i.fill}` : undefined,
            }}
          />
          <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
            {i.label}
          </span>
        </span>
      ))}
    </div>
  )
}

function Tooltip({
  period,
  x,
  y,
  yachts,
}: {
  period: GanttPeriod
  x: number
  y: number
  yachts: GanttYacht[]
}) {
  const from = new Date(period.dateFrom)
  const to = new Date(period.dateTo)
  const nights = Math.round(utcDays(from, to))
  const s = styleFor(period.status)
  const name = yachts.find((v) => v.id === period.yachtId)?.name ?? ""
  const muted = { color: "rgba(255,255,255,0.82)" }
  const listPrice = money(period.listPrice, period.currency)
  const expiry = period.optionValidTill ? daysUntil(period.optionValidTill) : null

  // The card grew from three lines to as many as eight, so anchor it above the
  // bar by its real height rather than a guessed offset.
  const lines = 4 + (period.checkInTime ? 1 : 0) + (period.baseFrom ? 1 : 0)
    + (period.booking || listPrice ? 1 : 0) + (expiry !== null ? 1 : 0)

  return (
    <div
      className="pointer-events-none fixed z-50 px-3 py-2"
      style={{
        left: Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 250),
        top: Math.max(8, y - (lines * 15 + 18)),
        minWidth: 200,
        background: "var(--primary)",
        borderRadius: "var(--radius-xs)",
        boxShadow: "var(--shadow-ambient)",
      }}
      role="status"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs font-semibold text-white">{name}</p>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          <span className="inline-block" style={{ width: 8, height: 8, borderRadius: 2, background: s.fill }} />
          {s.label}
        </span>
      </div>

      <p className="mt-1 text-[11px]" style={muted}>
        {fmt(from)} → {fmt(to)} · {nights} nights
      </p>

      {(period.checkInTime || period.checkOutTime) && (
        <p className="text-[11px]" style={muted}>
          In {hhmm(period.checkInTime) ?? "—"} · Out {hhmm(period.checkOutTime) ?? "—"}
        </p>
      )}

      {period.baseFrom && (
        <p className="text-[11px]" style={muted}>
          {period.baseFrom}
          {period.baseTo && period.baseTo !== period.baseFrom ? ` → ${period.baseTo}` : ""}
        </p>
      )}

      {period.booking ? (
        <p className="mt-1 text-[11px] font-semibold text-white">
          {period.booking.customer} · {money(period.booking.totalPrice, period.booking.currency)}
        </p>
      ) : (
        listPrice && (
          <p className="mt-1 text-[11px]" style={muted}>
            List {listPrice}
          </p>
        )
      )}

      {expiry !== null && (
        <p className="mt-1 text-[11px] font-semibold" style={{ color: expiry <= 2 ? "#F0B67F" : "rgba(255,255,255,0.82)" }}>
          {expiry < 0 ? "Option lapsed" : expiry === 0 ? "Option expires today" : `Option expires in ${expiry}d`}
        </p>
      )}

      <p className="mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
        {period.reservationNo ? `#${period.reservationNo} · ` : ""}Click for details
      </p>
    </div>
  )
}

/* ─── Detail panel ─────────────────────────────────────────────────────────
   A slide-over rather than a modal: the Gantt stays visible behind it, so the
   charter you clicked keeps its context in the row it came from.            */

function DetailPanel({
  period,
  yachtName,
  onClose,
}: {
  period: GanttPeriod
  yachtName: string
  onClose: () => void
}) {
  const from = new Date(period.dateFrom)
  const to = new Date(period.dateTo)
  const nights = Math.round(utcDays(from, to))
  const s = styleFor(period.status)
  const expiry = period.optionValidTill ? daysUntil(period.optionValidTill) : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const rows: Array<[string, string | null]> = [
    ["Yacht", yachtName],
    ["Status", s.label],
    ["Check-in", `${fmt(from)}${hhmm(period.checkInTime) ? ` at ${hhmm(period.checkInTime)}` : ""}`],
    ["Check-out", `${fmt(to)}${hhmm(period.checkOutTime) ? ` at ${hhmm(period.checkOutTime)}` : ""}`],
    ["Duration", `${nights} nights`],
    ["Departure base", period.baseFrom],
    ["Return base", period.baseTo],
    ["Reservation", period.reservationNo ? `#${period.reservationNo}` : null],
    ["List price", money(period.listPrice, period.currency)],
    [
      "Option valid till",
      period.optionValidTill
        ? `${fmt(new Date(period.optionValidTill))}${expiry !== null ? ` (${expiry < 0 ? "lapsed" : `${expiry}d left`})` : ""}`
        : null,
    ],
  ]

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(5,17,31,0.42)" }}
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${yachtName} charter details`}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col overflow-y-auto"
        style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5" style={{ background: "var(--surface-container-low)" }}>
          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
              <span
                className="inline-block"
                style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: period.status === "MAINTENANCE"
                    ? `repeating-linear-gradient(45deg, ${SERVICE} 0 3px, transparent 3px 6px), var(--surface-container-lowest)`
                    : s.fill,
                  boxShadow: period.status === "MAINTENANCE" ? `inset 0 0 0 1px ${SERVICE}` : undefined,
                }}
              />
              {s.label}
            </span>
            <h4 className="mt-1 text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              {yachtName}
            </h4>
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              {fmt(from)} → {fmt(to)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 px-2 py-1 text-lg leading-none"
            style={{ color: "var(--on-surface-variant)" }}
          >
            ×
          </button>
        </div>

        <dl className="flex flex-col px-6 py-4">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <dt className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{k}</dt>
              <dd className="text-right text-xs font-medium" style={{ color: "var(--primary)" }}>{v}</dd>
            </div>
          ))}
        </dl>

        {period.booking ? (
          <div className="mx-6 mb-6 p-4" style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-md)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
              Our booking
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--primary)" }}>
              {period.booking.customer}
            </p>
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{period.booking.email}</p>
            <p className="mt-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
              {period.booking.bookingNumber} · {period.booking.status} · {period.booking.guests} guests
            </p>
            <p className="mt-1 text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              {money(period.booking.totalPrice, period.booking.currency)}
            </p>
            <Link
              href={`/admin/bookings/${period.booking.id}`}
              className="mt-3 inline-block px-3 py-1.5 text-xs font-semibold"
              style={{ background: "var(--primary)", color: "#fff", borderRadius: "var(--radius-xs)" }}
            >
              Open booking
            </Link>
          </div>
        ) : (
          <div className="mx-6 mb-6 p-4" style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-md)" }}>
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Not one of ours — this charter came through NAUSYS, which supplies no
              customer or payment details. Everything it does give is listed above.
            </p>
          </div>
        )}

        <Link
          href={`/admin/fleet/${period.yachtId}`}
          className="mx-6 mb-6 text-xs font-semibold hover:underline"
          style={{ color: "var(--secondary)" }}
        >
          View {yachtName} →
        </Link>
      </aside>
    </>
  )
}
