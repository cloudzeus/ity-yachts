"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { buckets, lengthBands, type FleetRanges } from "@/lib/fleet-ranges"
import gsap from "gsap"
import {
  Ship,
  CalendarDays,
  Users,
  DoorOpen,
  Ruler,
  Wallet,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/components/locale-text"

interface SearchField {
  icon: React.ElementType
  label: string
  key: string
  options: { value: string; label: string }[]
}

const BUDGET_RANGES = [
  { value: "", label: "Any Budget" },
  { value: "0-5000", label: "Under €5,000" },
  { value: "5000-10000", label: "€5,000 – €10,000" },
  { value: "10000-20000", label: "€10,000 – €20,000" },
  { value: "20000-50000", label: "€20,000 – €50,000" },
  { value: "50000+", label: "Over €50,000" },
]

/* Berth, cabin and length options are no longer written down here. They used
   to offer 30m+, 7+ cabins and 13+ berths against a fleet that tops out at
   15m / 5 cabins / 12 berths, so those options could only ever return nothing.
   They are now built from the fleet the server measured — see lib/fleet-ranges. */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function formatDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isInRange(day: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false
  return day > start && day < end
}

/* ─── Compact Range Calendar ─────────────────────────────────────────── */

function RangeCalendar({
  startDate,
  endDate,
  onSelect,
  flexibleDates,
  onFlexibleToggle,
}: {
  startDate: Date | null
  endDate: Date | null
  onSelect: (start: Date | null, end: Date | null) => void
  flexibleDates: boolean
  onFlexibleToggle: () => void
}) {
  const { t } = useTranslations()
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [selecting, setSelecting] = useState<"start" | "end">("start")

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const nextViewMonth = viewMonth === 11 ? 0 : viewMonth + 1
  const nextViewYear = viewMonth === 11 ? viewYear + 1 : viewYear

  const handleDayClick = (day: Date) => {
    if (selecting === "start") {
      onSelect(day, null)
      setSelecting("end")
    } else {
      if (startDate && day > startDate) {
        onSelect(startDate, day)
        setSelecting("start")
      } else {
        onSelect(day, null)
        setSelecting("end")
      }
    }
  }

  const renderMonth = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfWeek(year, month)
    const cells: React.ReactNode[] = []

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} />)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const isStart = startDate && isSameDay(date, startDate)
      const isEnd = endDate && isSameDay(date, endDate)
      const inRange = isInRange(date, startDate, endDate)

      cells.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => handleDayClick(date)}
          className={`
            h-8 w-8 text-[13px] rounded-full transition-all
            ${isPast ? "text-[var(--border-strong)] cursor-not-allowed" : "hover:bg-[var(--iyc-ionian-600)]/10 cursor-pointer"}
            ${isStart || isEnd ? "bg-[var(--iyc-ionian-600)] text-white font-semibold" : ""}
            ${inRange ? "bg-[var(--iyc-ionian-600)]/10 text-[var(--text-link)]" : ""}
            ${!isStart && !isEnd && !inRange && !isPast ? "text-[var(--text-body)]" : ""}
          `}
        >
          {d}
        </button>
      )
    }

    return (
      <div>
        <div className="text-center font-semibold text-[13px] text-[var(--text-body)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
          {MONTHS[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-0 mb-0.5">
          {DAYS.map((day) => (
            <div key={day} className="h-7 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0 place-items-center">
          {cells}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] text-[var(--text-muted)]">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={nextMonth} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] text-[var(--text-muted)]">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {renderMonth(viewYear, viewMonth)}
        {renderMonth(nextViewYear, nextViewMonth)}
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">{t("search.flexibleDates", "Flexible dates (+/- 3 days)")}</span>
        <button
          onClick={onFlexibleToggle}
          className={`w-9 h-5 rounded-full transition-colors relative ${flexibleDates ? "bg-[var(--iyc-ionian-500)]" : "bg-[var(--iyc-sand-300)]"}`}
        >
          <div className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${flexibleDates ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
        </button>
      </div>
    </div>
  )
}

/* ─── Main Search Form ───────────────────────────────────────────────── */

export function CharterSearchForm({ ranges }: { ranges: FleetRanges }) {
  const { t } = useTranslations()
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [flexibleDates, setFlexibleDates] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({
    yachtType: "",
    budget: "",
    guests: "",
    cabins: "",
    length: "",
  })

  useEffect(() => {
    if (!formRef.current) return
    gsap.fromTo(
      formRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.9, delay: 1.4, ease: "power3.out" }
    )
  }, [])

  useEffect(() => {
    if (!activeDropdown) return
    const handler = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [activeDropdown])

  const handleSelect = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setActiveDropdown(null)
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    Object.entries(values).forEach(([key, val]) => {
      if (val) params.set(key, val)
    })
    if (startDate) params.set("dateFrom", startDate.toISOString().split("T")[0])
    if (endDate) params.set("dateTo", endDate.toISOString().split("T")[0])
    if (flexibleDates) params.set("flexibleDates", "true")
    router.push(`/fleet?${params.toString()}`)
  }

  const dateLabel = startDate
    ? endDate
      ? `${formatDate(startDate)} — ${formatDate(endDate)}`
      : `${formatDate(startDate)} — ${t("search.checkout", "Check-out")}`
    : t("search.selectDates", "Select dates")

  /* Built from the fleet, not from a fixed list, so the options can never
     offer a boat we do not have. Recomputed only when the ranges change. */
  const bottomFields: SearchField[] = useMemo(() => {
    const any = { value: "", label: t("search.any", "All options") }
    const m = t("search.metresShort", "m")

    return [
      {
        icon: Users,
        label: t("search.berths", "Guests"),
        key: "guests",
        options: [any, ...buckets(ranges.maxBerths, 4).map((b) => ({ value: b.value, label: b.label }))],
      },
      {
        icon: DoorOpen,
        label: t("search.cabins", "Cabins"),
        key: "cabins",
        options: [any, ...buckets(ranges.maxCabins, 2).map((b) => ({ value: b.value, label: b.label }))],
      },
      {
        icon: Ruler,
        label: t("search.length", "Length"),
        key: "length",
        options: [
          { value: "", label: t("search.anyLength", "Any length") },
          ...lengthBands(ranges.minLoa, ranges.maxLoa, ranges.maxLoaExact).map((b) => ({
            value: b.value,
            label:
              b.kind === "under"
                ? `${t("search.under", "Under")} ${b.to}${m}`
                : `${b.from} – ${b.to}${m}`,
          })),
        ],
      },
    ]
  }, [ranges, t])

  // The bar sits low in the hero, so a panel opening downward can fall off the
  // bottom of the screen. Measure the room under the trigger and flip upward
  // when the panel wouldn't fit.
  const [dropUp, setDropUp] = useState(false)
  const toggleDropdown = (key: string, e: React.MouseEvent) => {
    if (activeDropdown === key) {
      setActiveDropdown(null)
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const needed = key === "dates" ? 430 : 240
    setDropUp(window.innerHeight - rect.bottom < needed)
    setActiveDropdown(key)
  }

  const yachtTypes = useMemo(() => [
    { value: "", label: t("search.allTypes", "All types") },
    { value: "sailing", label: t("search.sailingYacht", "Sailing yacht") },
    { value: "catamaran", label: t("search.catamaran", "Catamaran") },
  ], [t])

  const yachtTypeOption = yachtTypes.find((o) => o.value === values.yachtType)
  const yachtTypeOpen = activeDropdown === "yachtType"

  return (
    <div ref={formRef} className="w-full max-w-5xl mx-auto" style={{ opacity: 0 }}>
      <div
        className="rounded-[var(--iyc-radius-lg)] overflow-visible"
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "var(--shadow-photo)",
        }}
      >
        {/* One row, as in the design: charter week · yacht type · berths ·
            cabins · length · search. Stacks on small screens. */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[1.6fr_1.15fr_.9fr_.9fr_.95fr_auto] items-stretch">
          {/* Date Range */}
          <div className="relative md:col-span-2 lg:col-span-1">
            <button
              onClick={(e) => toggleDropdown("dates", e)}
              className="w-full h-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.03] border-b md:border-b-0 md:border-r border-[var(--border-hairline)]"
            >
              <CalendarDays className="w-[18px] h-[18px] text-[var(--text-link)] shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-0.5">
                  {removeGreekTonos(t("search.charterDates", "Charter Dates"))}
                </div>
                <div className="text-[13px] text-[var(--text-body)] font-medium whitespace-nowrap">
                  {dateLabel}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-link)] transition-transform ${activeDropdown === "dates" ? "rotate-180" : ""}`} />
            </button>

            {activeDropdown === "dates" && (
              <div
                className={`absolute left-0 z-50 ${dropUp ? "bottom-full mb-1" : "top-full mt-1"} rounded-[var(--iyc-radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border-hairline)]`}
                style={{ background: "white", minWidth: "min(520px, 92vw)" }}
              >
                <RangeCalendar
                  startDate={startDate}
                  endDate={endDate}
                  onSelect={(s, e) => { setStartDate(s); setEndDate(e) }}
                  flexibleDates={flexibleDates}
                  onFlexibleToggle={() => setFlexibleDates((f) => !f)}
                />
              </div>
            )}
          </div>

          {/* Yacht Type — wider with nowrap */}
          <div className="relative min-w-0 lg:min-w-[180px]">
            <button
              onClick={(e) => toggleDropdown("yachtType", e)}
              className="w-full h-full flex items-center gap-2.5 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.03] border-b md:border-b-0 md:border-r border-[var(--border-hairline)]"
            >
              <Ship className="w-[18px] h-[18px] text-[var(--text-link)] shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-0.5">
                  {removeGreekTonos(t("search.yachtType", "Yacht Type"))}
                </div>
                <div className="text-[13px] text-[var(--text-body)] font-medium whitespace-nowrap">
                  {yachtTypeOption?.label || t("search.allTypes", "All types")}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-link)] transition-transform ${yachtTypeOpen ? "rotate-180" : ""}`} />
            </button>

            {yachtTypeOpen && (
              <div
                className={`absolute left-0 z-50 min-w-[200px] py-1 ${dropUp ? "bottom-full mb-1" : "top-full mt-1"} rounded-[var(--iyc-radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border-hairline)]`}
                style={{ background: "white" }}
              >
                {yachtTypes.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect("yachtType", option.value)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-[var(--surface-sunken)] ${
                      values.yachtType === option.value
                        ? "text-[var(--text-link)] font-medium bg-[var(--iyc-ionian-600)]/5"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {bottomFields.map((field) => {
            const Icon = field.icon
            const selectedOption = field.options.find((o) => o.value === values[field.key])
            const isOpen = activeDropdown === field.key

            return (
              <div key={field.key} className="relative min-w-0">
                <button
                  onClick={(e) => toggleDropdown(field.key, e)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-black/[0.03] border-r border-b md:border-b-0 border-[var(--border-input)] last:border-r-0"
                >
                  <Icon className="w-4 h-4 text-[var(--text-link)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                      {/* Set uppercase — Greek capitals carry no accent. */}
                      {removeGreekTonos(field.label)}
                    </div>
                    <div className="text-[13px] text-[var(--text-body)] font-medium truncate mt-0.5">
                      {selectedOption?.label || field.options[0]?.label}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-[var(--text-link)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div
                    className={`absolute left-0 z-50 min-w-[180px] py-1 ${dropUp ? "bottom-full mb-1" : "top-full mt-1"} rounded-[var(--iyc-radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border-hairline)]`}
                    style={{ background: "white" }}
                  >
                    {field.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(field.key, option.value)}
                        className={`w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-[var(--surface-sunken)] ${
                          values[field.key] === option.value
                            ? "text-[var(--text-link)] font-medium bg-[var(--iyc-ionian-600)]/5"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Search — the one accent action, last cell of the row */}
          <button
            onClick={handleSearch}
            className="flex items-center justify-center gap-2.5 px-8 py-3.5 font-semibold text-sm transition-all cursor-pointer shrink-0 active:scale-[0.985] md:col-span-3 lg:col-span-1 lg:rounded-r-[var(--iyc-radius-lg)]"
            style={{
              background: "var(--action-accent)",
              color: "var(--text-on-accent)",
              fontFamily: "var(--font-display)",
            }}
          >
            <Search className="w-4 h-4" />
            {t("search.searchYachts", "Search")}
          </button>
        </div>
      </div>
    </div>
  )
}
