"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────

interface CheckInPeriod {
  id: string
  dateFrom: string
  dateTo: string
  minReservationDuration: number
  checkInSaturday: boolean
  checkInSunday: boolean
  [key: string]: unknown
}

interface PricePeriod {
  id: string
  dateFrom: string
  dateTo: string
  price: number
  currency: string
  priceType: string
}

interface Booking {
  id: string
  dateFrom: string
  dateTo: string
  status: string
  bookingNumber?: string
}

interface AvailabilityCalendarProps {
  checkInPeriods: CheckInPeriod[]
  prices: PricePeriod[]
  bookings: Booking[]
}

// ─── Helpers ─────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseDate(s: string): Date {
  return startOfDay(new Date(s))
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function inRange(day: Date, from: string, to: string): boolean {
  const f = parseDate(from)
  const t = parseDate(to)
  return day >= f && day <= t
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Monday = 0, Sunday = 6 */
function getMondayBasedDay(date: Date): number {
  return (date.getDay() + 6) % 7
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month).toLocaleString("en-US", { month: "long", year: "numeric" })
}

// ─── Component ───────────────────────────────────────────────

export default function AvailabilityCalendar({ checkInPeriods, prices, bookings }: AvailabilityCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [baseMonth, setBaseMonth] = useState(() => today.getMonth())
  const [baseYear, setBaseYear] = useState(() => today.getFullYear())
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const months = useMemo(() => {
    const result: { year: number; month: number }[] = []
    let y = baseYear
    let m = baseMonth
    for (let i = 0; i < 3; i++) {
      result.push({ year: y, month: m })
      m++
      if (m > 11) { m = 0; y++ }
    }
    return result
  }, [baseYear, baseMonth])

  function prev() {
    let m = baseMonth - 1
    let y = baseYear
    if (m < 0) { m = 11; y-- }
    setBaseMonth(m)
    setBaseYear(y)
  }

  function next() {
    let m = baseMonth + 1
    let y = baseYear
    if (m > 11) { m = 0; y++ }
    setBaseMonth(m)
    setBaseYear(y)
  }

  // ── Day classification ──

  function getDayInfo(day: Date) {
    const booking = bookings.find((b) => inRange(day, b.dateFrom, b.dateTo))
    const hasCheckIn = checkInPeriods.some((p) => inRange(day, p.dateFrom, p.dateTo))
    const price = prices.find((p) => inRange(day, p.dateFrom, p.dateTo))
    const dayOfWeek = day.getDay() // 0=Sun, 6=Sat

    const isCheckInDay = checkInPeriods.some((p) => {
      if (!inRange(day, p.dateFrom, p.dateTo)) return false
      if (dayOfWeek === 6 && p.checkInSaturday) return true
      if (dayOfWeek === 0 && p.checkInSunday) return true
      // first day of period is always a check-in day
      if (isSameDay(day, parseDate(p.dateFrom))) return true
      return false
    })

    let status: "booked" | "option" | "available" | "unavailable" = "unavailable"
    if (booking) {
      status = booking.status === "OPTION" ? "option" : "booked"
    } else if (hasCheckIn) {
      status = "available"
    }

    return { status, price, isCheckInDay }
  }

  function getColor(status: string): string {
    switch (status) {
      case "available": return "#2D6A4F"
      case "booked": return "var(--primary)"
      case "option": return "#E67E22"
      default: return "var(--outline-variant)"
    }
  }

  // ── Tooltip price ──

  const hoveredPrice = useMemo(() => {
    if (!hoveredDay) return null
    const info = getDayInfo(hoveredDay)
    if (!info.price) return null
    const symbol = info.price.currency === "EUR" ? "€" : info.price.currency
    return `${symbol}${info.price.price.toLocaleString()}/week`
  }, [hoveredDay, prices, bookings, checkInPeriods])

  // ── Render month grid ──

  function renderMonth(year: number, month: number) {
    const daysCount = getDaysInMonth(year, month)
    const firstDay = new Date(year, month, 1)
    const startOffset = getMondayBasedDay(firstDay) // blank cells before day 1

    const cells: React.ReactNode[] = []

    // blank cells
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`blank-${i}`} style={{ width: 32, height: 32 }} />)
    }

    for (let d = 1; d <= daysCount; d++) {
      const day = new Date(year, month, d)
      const info = getDayInfo(day)
      const color = getColor(info.status)
      const isToday = isSameDay(day, today)

      cells.push(
        <div
          key={d}
          onMouseEnter={(e) => {
            setHoveredDay(day)
            const rect = (e.target as HTMLElement).getBoundingClientRect()
            setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 4 })
          }}
          onMouseLeave={() => { setHoveredDay(null); setTooltipPos(null) }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: isToday ? 700 : 500,
            color: info.status === "unavailable" ? "var(--on-surface-variant)" : "#fff",
            background: color,
            cursor: "default",
            position: "relative",
            outline: isToday ? "2px solid var(--on-surface)" : "none",
            outlineOffset: -2,
          }}
        >
          {d}
          {info.isCheckInDay && (
            <span
              style={{
                position: "absolute",
                bottom: 2,
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: info.status === "unavailable" ? "var(--on-surface-variant)" : "#fff",
                opacity: 0.85,
              }}
            />
          )}
        </div>
      )
    }

    return (
      <div key={`${year}-${month}`} style={{ flex: "1 1 0", minWidth: 260 }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--on-surface)",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {formatMonth(year, month)}
        </h3>
        {/* day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 32px)", gap: 2, justifyContent: "center", marginBottom: 4 }}>
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              style={{
                width: 32,
                textAlign: "center",
                fontSize: 9,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--on-surface-variant)",
              }}
            >
              {d}
            </div>
          ))}
        </div>
        {/* day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 32px)", gap: 2, justifyContent: "center" }}>
          {cells}
        </div>
      </div>
    )
  }

  // ── Main render ──

  return (
    <div
      style={{
        background: "var(--surface-container-lowest)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-ambient)",
        padding: 16,
        position: "relative",
      }}
    >
      {/* Header with navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--primary)",
            margin: 0,
          }}
        >
          Availability Calendar
        </h2>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={prev}
            style={{
              background: "none",
              border: "1px solid var(--outline-variant)",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--on-surface)",
            }}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            style={{
              background: "none",
              border: "1px solid var(--outline-variant)",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--on-surface)",
            }}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Month grids */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {months.map((m) => renderMonth(m.year, m.month))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid var(--outline-variant)",
        }}
      >
        {[
          { color: "#2D6A4F", label: "Available" },
          { color: "var(--primary)", label: "Booked" },
          { color: "#E67E22", label: "Option" },
          { color: "var(--outline-variant)", label: "Not available" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>{item.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: "#2D6A4F",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff" }} />
          </span>
          <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>Check-in day</span>
        </div>
      </div>

      {/* Price tooltip */}
      {hoveredDay && hoveredPrice && tooltipPos && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(-50%, -100%)",
            background: "var(--on-surface)",
            color: "var(--surface-container-lowest)",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 8px",
            borderRadius: 4,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 50,
          }}
        >
          {hoveredPrice}
        </div>
      )}
    </div>
  )
}
