"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"

/* ── Types ── */

type Price = {
  id: string
  yachtId: number
  dateFrom: string
  dateTo: string
  price: number
  currency: string
  priceType: string
}

type Season = { id: number; season: string; dateFrom: string; dateTo: string }
type Yacht = { id: number; name: string; categoryName: string }

type Props = {
  initialData: {
    prices: Price[]
    seasons: Season[]
    yachts: Yacht[]
  }
}

/* ── Period colors — each price period gets a distinct band ── */

const PERIOD_BANDS = [
  { bg: "#E8F4F8", text: "#1B4965", head: "#1B4965" },
  { bg: "#FFF3E0", text: "#8B5E34", head: "#D4A373" },
  { bg: "#E8F5E9", text: "#1B5E20", head: "#2E7D32" },
  { bg: "#F3E5F5", text: "#6A1B9A", head: "#8E24AA" },
  { bg: "#FFF8E1", text: "#E65100", head: "#FF8F00" },
  { bg: "#E3F2FD", text: "#0D47A1", head: "#1565C0" },
  { bg: "#FCE4EC", text: "#880E4F", head: "#C2185B" },
  { bg: "#E0F2F1", text: "#004D40", head: "#00796B" },
  { bg: "#FBE9E7", text: "#BF360C", head: "#E64A19" },
  { bg: "#EDE7F6", text: "#4527A0", head: "#5E35B1" },
]

/* ── Helpers ── */

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function fmtPrice(n: number) {
  return n.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const DAYS_VISIBLE = 14
const COL_W = 80
const YACHT_COL_W = 200

/* ── Component ── */

export function PricingClient({ initialData }: Props) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const [startDate, setStartDate] = useState(() => {
    // Start from today
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  /* ── Build price lookup: yachtId → sorted Price[] ── */
  const yachtPriceMap = useMemo(() => {
    const m = new Map<number, Price[]>()
    for (const p of initialData.prices) {
      if (!m.has(p.yachtId)) m.set(p.yachtId, [])
      m.get(p.yachtId)!.push(p)
    }
    for (const [, arr] of m) arr.sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
    return m
  }, [initialData.prices])

  /* ── Find price + period index for a yacht on a given date ── */
  function findPrice(yachtId: number, date: Date): { price: Price; idx: number } | null {
    const arr = yachtPriceMap.get(yachtId)
    if (!arr) return null
    const ts = date.getTime()
    for (let i = 0; i < arr.length; i++) {
      const from = new Date(arr[i].dateFrom).getTime()
      const to = new Date(arr[i].dateTo).getTime() + 86400000
      if (ts >= from && ts < to) return { price: arr[i], idx: i }
    }
    return null
  }

  /* ── Generate visible days ── */
  const visibleDays = useMemo(() => {
    const days: Date[] = []
    for (let i = 0; i < DAYS_VISIBLE; i++) days.push(addDays(startDate, i))
    return days
  }, [startDate])

  /* ── Find season for a date ── */
  function findSeason(date: Date): Season | undefined {
    const ts = date.getTime()
    return initialData.seasons.find((s) => ts >= new Date(s.dateFrom).getTime() && ts <= new Date(s.dateTo).getTime())
  }

  /* ── Group yachts by category ── */
  const grouped = useMemo(() => {
    const cats = new Map<string, Yacht[]>()
    // Only show yachts that have price data
    const yachtsWithPrices = initialData.yachts.filter((y) => yachtPriceMap.has(y.id))
    for (const y of yachtsWithPrices) {
      const cat = y.categoryName
      if (!cats.has(cat)) cats.set(cat, [])
      cats.get(cat)!.push(y)
    }
    return cats
  }, [initialData.yachts, yachtPriceMap])

  /* ── Navigation ── */
  function prev() { setStartDate((d) => addDays(d, -7)) }
  function next() { setStartDate((d) => addDays(d, 7)) }
  function goToday() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setStartDate(d)
  }

  function toggleCategory(cat: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  /* ── Detect month boundaries for header ── */
  const monthSpans = useMemo(() => {
    const spans: { label: string; cols: number }[] = []
    let curLabel = ""
    let curCount = 0
    for (const d of visibleDays) {
      const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }).toUpperCase()
      if (label === curLabel) {
        curCount++
      } else {
        if (curLabel) spans.push({ label: curLabel, cols: curCount })
        curLabel = label
        curCount = 1
      }
    }
    if (curLabel) spans.push({ label: curLabel, cols: curCount })
    return spans
  }, [visibleDays])

  const totalW = YACHT_COL_W + DAYS_VISIBLE * COL_W

  return (
    <div className="flex flex-col gap-3">
      {/* Top nav */}
      <div className="flex items-center gap-2">
        <button
          onClick={prev}
          className="flex items-center justify-center size-8 rounded-md border hover:bg-black/[0.03] transition-colors"
          style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={goToday}
          className="h-8 px-3 text-xs font-semibold rounded-md border hover:bg-black/[0.03] transition-colors"
          style={{ borderColor: "var(--outline-variant)", color: "var(--primary)" }}
        >
          TODAY
        </button>
        <button
          onClick={next}
          className="flex items-center justify-center size-8 rounded-md border hover:bg-black/[0.03] transition-colors"
          style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
        >
          <ChevronRight className="size-4" />
        </button>

        <span className="text-sm font-semibold ml-2" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
          {visibleDays[0].toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          {" — "}
          {visibleDays[visibleDays.length - 1].toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Grid */}
      <div
        ref={scrollRef}
        className="overflow-x-auto"
        style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)" }}
      >
        <div style={{ minWidth: totalW }}>
          {/* ── Month header row ── */}
          <div className="flex" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
            <div
              className="shrink-0"
              style={{ width: YACHT_COL_W, background: "var(--surface-container)" }}
            />
            {monthSpans.map((ms, i) => (
              <div
                key={i}
                className="text-[11px] font-bold tracking-wide py-1.5 text-center"
                style={{
                  width: ms.cols * COL_W,
                  background: "var(--surface-container)",
                  color: "var(--primary)",
                  fontFamily: "var(--font-display)",
                  borderLeft: i > 0 ? "2px solid var(--outline-variant)" : undefined,
                }}
              >
                {ms.label}
              </div>
            ))}
          </div>

          {/* ── Day header row ── */}
          <div className="flex" style={{ borderBottom: "2px solid var(--outline-variant)" }}>
            <div
              className="shrink-0 flex items-center px-3 text-[10px] font-semibold uppercase tracking-wide"
              style={{ width: YACHT_COL_W, color: "var(--on-surface-variant)", fontFamily: "var(--font-display)", background: "var(--surface-container)" }}
            >
              Yacht
            </div>
            {visibleDays.map((d, i) => {
              const isToday = isSameDay(d, now)
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              const dayName = d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase()
              const dayNum = d.getDate()

              return (
                <div
                  key={i}
                  className="shrink-0 flex flex-col items-center justify-center py-1.5"
                  style={{
                    width: COL_W,
                    background: isToday ? "rgba(27,73,101,0.08)" : isWeekend ? "rgba(0,0,0,0.02)" : "var(--surface-container)",
                    borderLeft: "1px solid var(--outline-variant)",
                  }}
                >
                  <span className="text-[9px] font-bold tracking-wide" style={{ color: isToday ? "var(--primary)" : "var(--on-surface-variant)" }}>
                    {dayName}
                  </span>
                  <span
                    className={`text-xs font-bold ${isToday ? "flex items-center justify-center size-5 rounded-full" : ""}`}
                    style={{
                      color: isToday ? "#fff" : "var(--on-surface)",
                      background: isToday ? "var(--primary)" : undefined,
                    }}
                  >
                    {dayNum}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ── Category + yacht rows ── */}
          {[...grouped.entries()].map(([catName, yachts]) => {
            const isCollapsed = collapsedCategories.has(catName)

            return (
              <div key={catName}>
                {/* Category header */}
                <div
                  className="flex cursor-pointer hover:bg-black/[0.02] transition-colors"
                  style={{ borderBottom: "1px solid var(--outline-variant)" }}
                  onClick={() => toggleCategory(catName)}
                >
                  <div
                    className="shrink-0 flex items-center gap-2 px-3 py-2"
                    style={{ width: YACHT_COL_W, background: "rgba(27,73,101,0.04)" }}
                  >
                    {isCollapsed
                      ? <ChevronRight className="size-3.5 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
                      : <ChevronDown className="size-3.5 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
                    }
                    <span className="text-xs font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                      {catName}
                    </span>
                    <span className="text-[10px] font-medium ml-auto" style={{ color: "var(--on-surface-variant)" }}>
                      {yachts.length}
                    </span>
                  </div>
                  {/* Category row — show average or summary per day */}
                  {visibleDays.map((d, i) => {
                    // Count yachts with prices on this day
                    let count = 0
                    for (const y of yachts) { if (findPrice(y.id, d)) count++ }
                    return (
                      <div
                        key={i}
                        className="shrink-0 flex items-center justify-center py-2"
                        style={{
                          width: COL_W,
                          background: "rgba(27,73,101,0.04)",
                          borderLeft: "1px solid var(--outline-variant)",
                        }}
                      >
                        <span className="text-[10px] font-medium" style={{ color: "var(--on-surface-variant)" }}>
                          {count > 0 ? `${count}` : "—"}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Yacht rows */}
                {!isCollapsed && yachts.map((yacht) => (
                  <div
                    key={yacht.id}
                    className="flex hover:bg-black/[0.01] transition-colors"
                    style={{ borderBottom: "1px solid var(--outline-variant)" }}
                  >
                    {/* Yacht name */}
                    <div
                      className="shrink-0 flex items-center px-3 py-0"
                      style={{ width: YACHT_COL_W, borderRight: "1px solid var(--outline-variant)" }}
                    >
                      <span
                        className="text-[11px] font-semibold truncate"
                        style={{ color: "var(--on-surface)" }}
                        title={yacht.name}
                      >
                        {yacht.name}
                      </span>
                    </div>

                    {/* Day cells */}
                    {visibleDays.map((d, i) => {
                      const result = findPrice(yacht.id, d)
                      const isToday = isSameDay(d, now)
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6

                      if (!result) {
                        return (
                          <div
                            key={i}
                            className="shrink-0 flex items-center justify-center"
                            style={{
                              width: COL_W,
                              height: 36,
                              background: isWeekend ? "rgba(0,0,0,0.015)" : undefined,
                              borderLeft: "1px solid var(--outline-variant)",
                            }}
                          >
                            <span className="text-[10px]" style={{ color: "var(--outline-variant)" }}>—</span>
                          </div>
                        )
                      }

                      const { price, idx } = result
                      const band = PERIOD_BANDS[idx % PERIOD_BANDS.length]

                      // Check if this is the first day of this period
                      const isFirstDay = isSameDay(d, new Date(price.dateFrom))
                      // Check if previous day had a different period
                      const prevDay = addDays(d, -1)
                      const prevResult = findPrice(yacht.id, prevDay)
                      const isPeriodStart = isFirstDay || !prevResult || prevResult.idx !== idx

                      return (
                        <div
                          key={i}
                          className="shrink-0 flex flex-col items-center justify-center relative"
                          style={{
                            width: COL_W,
                            height: 36,
                            background: band.bg,
                            borderLeft: isPeriodStart ? `3px solid ${band.head}` : "1px solid rgba(0,0,0,0.06)",
                            boxShadow: isToday ? `inset 0 0 0 1px var(--primary)` : undefined,
                          }}
                          title={`${yacht.name}\n${fmtPrice(price.price)} ${price.currency}/${price.priceType === "WEEKLY" ? "wk" : "day"}\n${new Date(price.dateFrom).toLocaleDateString("en-GB")} — ${new Date(price.dateTo).toLocaleDateString("en-GB")}`}
                        >
                          <span className="text-[11px] font-bold tabular-nums" style={{ color: band.text }}>
                            {fmtPrice(price.price)}
                          </span>
                          {isPeriodStart && (
                            <span className="text-[8px] font-semibold" style={{ color: band.text, opacity: 0.6 }}>
                              {price.currency}/{price.priceType === "WEEKLY" ? "wk" : "day"}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
          Period colors:
        </span>
        {PERIOD_BANDS.slice(0, 6).map((band, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-4 h-3 rounded-sm" style={{ background: band.bg, borderLeft: `3px solid ${band.head}` }} />
            <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>Period {i + 1}</span>
          </div>
        ))}
        <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
          Color changes when price period changes
        </span>
      </div>
    </div>
  )
}
