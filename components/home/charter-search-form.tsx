"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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

interface SearchField {
  icon: React.ElementType
  label: string
  key: string
  options: { value: string; label: string }[]
}

const YACHT_TYPES = [
  { value: "", label: "All Types" },
  { value: "sailing", label: "Sailing Yacht" },
  { value: "catamaran", label: "Catamaran" },
]

const BUDGET_RANGES = [
  { value: "", label: "Any Budget" },
  { value: "0-5000", label: "Under €5,000" },
  { value: "5000-10000", label: "€5,000 – €10,000" },
  { value: "10000-20000", label: "€10,000 – €20,000" },
  { value: "20000-50000", label: "€20,000 – €50,000" },
  { value: "50000+", label: "Over €50,000" },
]

const GUESTS = [
  { value: "", label: "Any" },
  { value: "1-4", label: "1 – 4" },
  { value: "5-8", label: "5 – 8" },
  { value: "9-12", label: "9 – 12" },
  { value: "13+", label: "13+" },
]

const CABINS = [
  { value: "", label: "Any" },
  { value: "1-2", label: "1 – 2" },
  { value: "3-4", label: "3 – 4" },
  { value: "5-6", label: "5 – 6" },
  { value: "7+", label: "7+" },
]

const LENGTH_RANGES = [
  { value: "", label: "Any Length" },
  { value: "0-12", label: "Under 12m" },
  { value: "12-15", label: "12 – 15m" },
  { value: "15-20", label: "15 – 20m" },
  { value: "20-30", label: "20 – 30m" },
  { value: "30+", label: "Over 30m" },
]

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
            ${isPast ? "text-gray-300 cursor-not-allowed" : "hover:bg-[#006399]/10 cursor-pointer"}
            ${isStart || isEnd ? "bg-[#006399] text-white font-semibold" : ""}
            ${inRange ? "bg-[#006399]/10 text-[#006399]" : ""}
            ${!isStart && !isEnd && !inRange && !isPast ? "text-gray-700" : ""}
          `}
        >
          {d}
        </button>
      )
    }

    return (
      <div>
        <div className="text-center font-semibold text-[13px] text-gray-800 mb-2" style={{ fontFamily: "var(--font-display)" }}>
          {MONTHS[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-0 mb-0.5">
          {DAYS.map((day) => (
            <div key={day} className="h-7 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
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
        <button onClick={prevMonth} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={nextMonth} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {renderMonth(viewYear, viewMonth)}
        {renderMonth(nextViewYear, nextViewMonth)}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">Flexible dates (+/- 3 days)</span>
        <button
          onClick={onFlexibleToggle}
          className={`w-9 h-5 rounded-full transition-colors relative ${flexibleDates ? "bg-[#006399]" : "bg-gray-200"}`}
        >
          <div className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${flexibleDates ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
        </button>
      </div>
    </div>
  )
}

/* ─── Main Search Form ───────────────────────────────────────────────── */

export function CharterSearchForm() {
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
      : `${formatDate(startDate)} — Check-out`
    : "Select dates"

  const bottomFields: SearchField[] = [
    { icon: Wallet, label: "Budget", key: "budget", options: BUDGET_RANGES },
    { icon: Users, label: "Guests", key: "guests", options: GUESTS },
    { icon: DoorOpen, label: "Cabins", key: "cabins", options: CABINS },
    { icon: Ruler, label: "Length", key: "length", options: LENGTH_RANGES },
  ]

  const yachtTypeOption = YACHT_TYPES.find((o) => o.value === values.yachtType)
  const yachtTypeOpen = activeDropdown === "yachtType"

  return (
    <div ref={formRef} className="w-full max-w-5xl mx-auto" style={{ opacity: 0 }}>
      <div
        className="rounded-lg overflow-visible"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid #d1d5db",
          boxShadow: "0 12px 48px rgba(0, 10, 30, 0.25), 0 4px 16px rgba(0, 10, 30, 0.12)",
        }}
      >
        {/* Row 1: Dates + Yacht Type + Search */}
        <div className="flex flex-col md:flex-row items-stretch">
          {/* Date Range */}
          <div className="relative flex-1">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "dates" ? null : "dates")}
              className="w-full h-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.03] border-b md:border-b-0 md:border-r border-gray-300"
            >
              <CalendarDays className="w-[18px] h-[18px] text-[#006399] shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                  Charter Dates
                </div>
                <div className="text-[13px] text-gray-800 font-medium whitespace-nowrap">
                  {dateLabel}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#0055a9] transition-transform ${activeDropdown === "dates" ? "rotate-180" : ""}`} />
            </button>

            {activeDropdown === "dates" && (
              <div
                className="absolute top-full left-0 z-50 mt-1 rounded-lg shadow-2xl border border-gray-100"
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
          <div className="relative" style={{ minWidth: "180px" }}>
            <button
              onClick={() => setActiveDropdown(yachtTypeOpen ? null : "yachtType")}
              className="w-full h-full flex items-center gap-2.5 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.03] border-b md:border-b-0 md:border-r border-gray-300"
            >
              <Ship className="w-[18px] h-[18px] text-[#006399] shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                  Yacht Type
                </div>
                <div className="text-[13px] text-gray-700 font-medium whitespace-nowrap">
                  {yachtTypeOption?.label || "All Types"}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#0055a9] transition-transform ${yachtTypeOpen ? "rotate-180" : ""}`} />
            </button>

            {yachtTypeOpen && (
              <div
                className="absolute top-full left-0 z-50 min-w-[200px] py-1 mt-1 rounded-lg shadow-2xl border border-gray-100"
                style={{ background: "white" }}
              >
                {YACHT_TYPES.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect("yachtType", option.value)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-gray-50 ${
                      values.yachtType === option.value
                        ? "text-[#006399] font-medium bg-[#006399]/5"
                        : "text-gray-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="flex items-center justify-center gap-2.5 px-8 py-3.5 text-white font-semibold text-sm transition-all hover:brightness-110 md:rounded-tr-lg shrink-0"
            style={{
              background: "var(--gradient-ocean)",
              fontFamily: "var(--font-display)",
            }}
          >
            <Search className="w-4 h-4" />
            Search Yachts
          </button>
        </div>

        {/* Row 2: Budget + Guests + Cabins + Length */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-gray-300">
          {bottomFields.map((field) => {
            const Icon = field.icon
            const selectedOption = field.options.find((o) => o.value === values[field.key])
            const isOpen = activeDropdown === field.key

            return (
              <div key={field.key} className="relative">
                <button
                  onClick={() => setActiveDropdown(isOpen ? null : field.key)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-black/[0.03] border-r border-b md:border-b-0 border-gray-300 last:border-r-0"
                >
                  <Icon className="w-4 h-4 text-[#006399] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {field.label}
                    </div>
                    <div className="text-[13px] text-gray-700 font-medium truncate mt-0.5">
                      {selectedOption?.label || field.options[0]?.label}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-[#0055a9] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div
                    className="absolute top-full left-0 z-50 min-w-[180px] py-1 mt-1 rounded-lg shadow-2xl border border-gray-100"
                    style={{ background: "white" }}
                  >
                    {field.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(field.key, option.value)}
                        className={`w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-gray-50 ${
                          values[field.key] === option.value
                            ? "text-[#006399] font-medium bg-[#006399]/5"
                            : "text-gray-600"
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
        </div>
      </div>
    </div>
  )
}
