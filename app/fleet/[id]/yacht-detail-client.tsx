"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { DayPicker, type DateRange } from "react-day-picker"
import { format, eachDayOfInterval, isBefore, startOfDay } from "date-fns"
import "./yacht-calendar.css"
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Check,
  Plus,
  Phone,
  ChevronDown,
  Sun,
  Cpu,
  Wifi,
  Flame,
  Anchor,
  Tv,
  Zap,
  Home,
  Droplets,
  HelpCircle,
  Box,
  BarChart3,
  Circle,
  X,
  Mail,
  User,
  MessageSquare,
  Send,
  CheckCircle2,
  CalendarDays,
} from "lucide-react"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"
import { lockScroll, unlockScroll } from "@/lib/scroll-lock"

type TranslatedField = Record<string, string> | null | undefined

function resolveT(field: TranslatedField, locale: string, fallback = ""): string {
  if (!field) return fallback
  return field[locale] || field.en || fallback
}

interface YachtData {
  id: number
  name: string
  modelName: string
  category: string
  categoryTranslations?: TranslatedField
  images: string[]
  location: string
  locationTranslations?: TranslatedField
  loa: number | null
  beam: number | null
  draft: number | null
  cabins: number | null
  maxPersons: number | null
  berthsTotal: number | null
  buildYear: number | null
  renewed: number | null
  builder: string
  hullColor: string | null
  engines: number | null
  enginePower: number | null
  engineBuilder: string
  fuelType: string | null
  fuelConsumption: number | null
  fuelTank: number | null
  waterTank: number | null
  maxSpeed: number | null
  cruisingSpeed: number | null
  wc: number | null
  showers: number | null
  charterType: string | null
  description: string
  descriptionTranslations?: TranslatedField
  note: string
  noteTranslations?: TranslatedField
  equipmentByCategory: Record<string, { categoryName: string; categoryNameTranslations?: TranslatedField; items: Array<{ name: string; nameTranslations?: TranslatedField; quantity: number }> }>
  services: Array<{ name: string; nameTranslations?: TranslatedField; price: number; currency: string; obligatory: boolean }>
  availability?: Array<{ dateFrom: string; dateTo: string; status: string }>
  prices: Array<{ dateFrom: string; dateTo: string; price: number; currency: string; priceType: string }>
  mastLength: number | null
  propulsionType: string | null
  staffRep: { name: string; position: string; positionTranslations?: TranslatedField; image: string } | null
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`
}

function formatPrice(price: number, currency: string) {
  if (currency === "EUR" || currency === "€") {
    return `€${price.toLocaleString("de-DE")}`
  }
  return `${price.toLocaleString()} ${currency}`
}

// Equipment category tab color themes
const TAB_THEMES: Record<string, { bg: string; border: string; text: string }> = {}
const THEME_LIST = [
  { bg: "bg-blue-50", border: "border-blue-100", text: "text-[var(--text-link)]" },
  { bg: "bg-[var(--surface-inverse)]/5", border: "border-[var(--text-heading)]/10", text: "text-[var(--text-subtle)]" },
  { bg: "bg-[var(--iyc-taupe-500)]/10", border: "border-[var(--text-subtle)]/20", text: "text-[var(--text-subtle)]" },
  { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-600" },
  { bg: "bg-green-50", border: "border-green-100", text: "text-green-600" },
  { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-600" },
  { bg: "bg-yellow-50", border: "border-yellow-100", text: "text-yellow-600" },
  { bg: "bg-[var(--surface-inverse)]/5", border: "border-[var(--text-heading)]/10", text: "text-[var(--text-subtle)]" },
]

// Amenity icons list for the top "Equipment & Amenities" quick display
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "air conditioning": <Sun className="w-4 h-4 text-[var(--text-subtle)]" />,
  generator: <Cpu className="w-4 h-4 text-[var(--text-subtle)]" />,
  "wi-fi": <Wifi className="w-4 h-4 text-[var(--text-subtle)]" />,
  wifi: <Wifi className="w-4 h-4 text-[var(--text-subtle)]" />,
  "bbq grill": <Flame className="w-4 h-4 text-[var(--text-subtle)]" />,
  bbq: <Flame className="w-4 h-4 text-[var(--text-subtle)]" />,
  "snorkeling gear": <Anchor className="w-4 h-4 text-[var(--text-subtle)]" />,
  "smart tv": <Tv className="w-4 h-4 text-[var(--text-subtle)]" />,
  tv: <Tv className="w-4 h-4 text-[var(--text-subtle)]" />,
  "water maker": <Zap className="w-4 h-4 text-[var(--text-subtle)]" />,
  watermaker: <Zap className="w-4 h-4 text-[var(--text-subtle)]" />,
  "solar panels": <Home className="w-4 h-4 text-[var(--text-subtle)]" />,
  "hot water": <Droplets className="w-4 h-4 text-[var(--text-subtle)]" />,
  "life jackets": <HelpCircle className="w-4 h-4 text-[var(--text-subtle)]" />,
  "dinghy with motor": <Box className="w-4 h-4 text-[var(--text-subtle)]" />,
  dinghy: <Box className="w-4 h-4 text-[var(--text-subtle)]" />,
  "cockpit cushions": <BarChart3 className="w-4 h-4 text-[var(--text-subtle)]" />,
  "bimini top": <Circle className="w-4 h-4 text-[var(--text-subtle)]" />,
}

function getAmenityIcon(_name: string) {
  return <Anchor className="w-4 h-4 text-[var(--text-subtle)]" />
}

export function YachtDetailClient({ yacht }: { yacht: YachtData }) {
  const { locale, t, tUpper } = useTranslations()
  const yachtCategory = resolveT(yacht.categoryTranslations, locale, yacht.category)
  const yachtLocation = resolveT(yacht.locationTranslations, locale, yacht.location)
  const yachtDescription = resolveT(yacht.descriptionTranslations, locale, yacht.description)
  const yachtNote = resolveT(yacht.noteTranslations, locale, yacht.note)
  const staffPosition = yacht.staffRep ? resolveT(yacht.staffRep.positionTranslations, locale, yacht.staffRep.position) : ""
  const [currentImage, setCurrentImage] = useState(0)

  // Booking sidebar state (specific dates)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarKey, setCalendarKey] = useState(0)
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined)
  const [guestCount, setGuestCount] = useState(2)
  const [showGuestDropdown, setShowGuestDropdown] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingForm, setBookingForm] = useState({ firstName: "", lastName: "", email: "", phone: "", notes: "" })
  const calendarRef = useRef<HTMLDivElement>(null)
  const checkIn = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""
  const checkOut = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : ""

  // Enquiry modal state (flexible planning)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [enquiryGuestCount, setEnquiryGuestCount] = useState(2)

  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryTransition, setGalleryTransition] = useState(false)
  const [galleryDirection, setGalleryDirection] = useState<"left" | "right">("right")
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [enquiryForm, setEnquiryForm] = useState({ firstName: "", lastName: "", email: "", phone: "", notes: "" })
  const [enquirySubmitting, setEnquirySubmitting] = useState(false)
  const [enquirySuccess, setEnquirySuccess] = useState(false)
  const enquiryRef = useRef<HTMLDivElement>(null)

  const images = yacht.images.length > 0 ? yacht.images : []
  const hasImages = images.length > 0

  const openGallery = useCallback((startIndex = 0) => {
    setGalleryIndex(startIndex)
    setGalleryOpen(true)
  }, [])

  const closeGallery = useCallback(() => setGalleryOpen(false), [])

  const transitionTo = useCallback((newIndex: number, direction: "left" | "right") => {
    if (galleryTransition) return
    setGalleryDirection(direction)
    setGalleryTransition(true)
    setTimeout(() => {
      setGalleryIndex(newIndex)
      setTimeout(() => setGalleryTransition(false), 30)
    }, 250)
  }, [galleryTransition])

  const galleryPrev = useCallback(() => {
    const newIndex = galleryIndex === 0 ? images.length - 1 : galleryIndex - 1
    transitionTo(newIndex, "left")
  }, [galleryIndex, images.length, transitionTo])

  const galleryNext = useCallback(() => {
    const newIndex = galleryIndex === images.length - 1 ? 0 : galleryIndex + 1
    transitionTo(newIndex, "right")
  }, [galleryIndex, images.length, transitionTo])

  useEffect(() => {
    if (!galleryOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeGallery()
      if (e.key === "ArrowLeft") galleryPrev()
      if (e.key === "ArrowRight") galleryNext()
    }
    lockScroll()
    window.addEventListener("keydown", handleKey)
    return () => {
      unlockScroll()
      window.removeEventListener("keydown", handleKey)
    }
  }, [galleryOpen, closeGallery, galleryPrev, galleryNext])

  const categoryTabs = useMemo(() => {
    const entries = Object.entries(yacht.equipmentByCategory)
    return entries.map(([id, data], i) => ({
      id,
      name: resolveT(data.categoryNameTranslations, locale, data.categoryName),
      items: data.items.map((item) => {
        const name = resolveT(item.nameTranslations, locale, item.name)
        return item.quantity > 1 ? `${name} (x${item.quantity})` : name
      }),
      theme: THEME_LIST[i % THEME_LIST.length],
    }))
  }, [yacht.equipmentByCategory, locale])

  const equipmentCount = categoryTabs.reduce((n, tab) => n + tab.items.length, 0)

  // Build specs list
  const specs: Array<{ k: string; label: string; value: string }> = []
  if (yachtCategory) specs.push({ k: "type", label: t("yacht.spec.yachtType", "Yacht Type"), value: yachtCategory })
  if (yacht.loa) specs.push({ k: "loa", label: t("yacht.spec.length", "Length"), value: `${yacht.loa.toFixed(2)} Meters` })
  if (yacht.beam) specs.push({ k: "beam", label: t("yacht.spec.beam", "Beam"), value: `${yacht.beam.toFixed(2)} Meters` })
  if (yacht.draft) specs.push({ k: "draft", label: t("yacht.spec.draft", "Draft"), value: `${yacht.draft.toFixed(2)} Meters` })
  if (yacht.engineBuilder || yacht.enginePower) {
    const engineStr = [yacht.engineBuilder, yacht.enginePower ? `${yacht.enginePower}HP` : ""].filter(Boolean).join(" ")
    specs.push({ k: "engine", label: t("yacht.spec.engine", "Engine"), value: engineStr })
  }
  if (yacht.fuelType || yacht.fuelTank) {
    const fuelStr = [yacht.fuelType, yacht.fuelTank ? `${yacht.fuelTank}L` : ""].filter(Boolean).join(", ")
    specs.push({ k: "fuel", label: t("yacht.spec.fuel", "Fuel"), value: fuelStr })
  }
  if (yacht.waterTank) specs.push({ k: "water", label: t("yacht.spec.waterTank", "Water Tank"), value: `${yacht.waterTank} Liters` })
  if (yacht.fuelConsumption) specs.push({ k: "consumption", label: t("yacht.spec.fuelConsumption", "Fuel Consumption"), value: `${yacht.fuelConsumption}L/hour` })
  if (yacht.buildYear) specs.push({ k: "year", label: t("yacht.spec.yearBuilt", "Year Built"), value: String(yacht.buildYear) })
  if (yacht.renewed) specs.push({ k: "renewed", label: t("yacht.spec.renewed", "Renewed"), value: String(yacht.renewed) })
  if (yacht.cruisingSpeed) specs.push({ k: "cruise", label: t("yacht.spec.cruisingSpeed", "Cruising Speed"), value: `${yacht.cruisingSpeed} knots` })
  if (yacht.maxSpeed) specs.push({ k: "maxspeed", label: t("yacht.spec.maxSpeed", "Max Speed"), value: `${yacht.maxSpeed} knots` })
  if (yacht.berthsTotal) specs.push({ k: "berths", label: t("yacht.spec.berths", "Berths"), value: `${yacht.berthsTotal}${yacht.cabins ? ` (${yacht.cabins} ${t("yacht.spec.cabinsShort", "cabins")})` : ""}` })
  if (yacht.wc) specs.push({ k: "wc", label: t("yacht.spec.toilets", "Toilets"), value: String(yacht.wc) })
  if (yacht.showers) specs.push({ k: "showers", label: t("yacht.spec.showers", "Showers"), value: String(yacht.showers) })
  if (yacht.mastLength) specs.push({ k: "mast", label: t("yacht.spec.mastLength", "Mast Length"), value: `${yacht.mastLength}m` })
  if (yacht.propulsionType) specs.push({ k: "propulsion", label: t("yacht.spec.propulsion", "Propulsion"), value: yacht.propulsionType })
  if (yacht.builder) specs.push({ k: "builder", label: t("yacht.spec.builder", "Builder"), value: yacht.builder })

  /* Which specs decide a charter, and which are reference. Sleeping,
     washing, water capacity, draft and beam are what crews ask about; mast
     length and fuel consumption are for the record. */
  const SPEC_ORDER = ["berths", "wc", "showers", "water", "draft", "beam", "loa", "engine",
                      "cruise", "maxspeed", "fuel", "consumption", "mast", "propulsion",
                      "type", "year", "renewed", "builder"]
  const keySpecs = [...specs].sort(
    (a, b) => SPEC_ORDER.indexOf(a.k) - SPEC_ORDER.indexOf(b.k)
  )

  // Quick amenities from all equipment (first 13)
  const allEquipmentItems = categoryTabs.flatMap((tab) => tab.items)
  const quickAmenities = allEquipmentItems.slice(0, 13)

  // Cheapest weekly price
  const weeklyPrices = yacht.prices.filter((p) => p.priceType === "WEEKLY")
  const cheapestPrice = weeklyPrices.length > 0 ? Math.min(...weeklyPrices.map((p) => p.price)) : null

  // Year filtering for seasonal pricing
  const now = new Date()
  const currentYear = now.getFullYear()
  const priceYears = useMemo(() => {
    const years = new Set(weeklyPrices.map((p) => new Date(p.dateFrom).getFullYear()))
    // Only show current + next year (or whatever years exist from now onward)
    return [currentYear, currentYear + 1].filter((y) => years.has(y))
  }, [weeklyPrices, currentYear])

  const [activeYear, setActiveYear] = useState(priceYears[0] || currentYear)

  const pricesForYear = useMemo(
    () => weeklyPrices.filter((p) => new Date(p.dateFrom).getFullYear() === activeYear),
    [weeklyPrices, activeYear]
  )

  // Compute available dates for calendar from pricing periods
  const { unavailableMatcher, firstAvailableMonth } = useMemo(() => {
    const today = startOfDay(new Date())
    const allAvailable: Date[] = []
    for (const p of yacht.prices) {
      if (p.priceType !== "WEEKLY") continue
      const from = startOfDay(new Date(p.dateFrom))
      const to = startOfDay(new Date(p.dateTo))
      if (isBefore(to, today)) continue
      const start = isBefore(from, today) ? today : from
      allAvailable.push(...eachDayOfInterval({ start, end: to }))
    }
    const availableSet = new Set(allAvailable.map((d) => d.getTime()))

    /* Taken days, from the occupancy mirror. A price period covers the whole
       season regardless of who has chartered the boat, so pricing alone let a
       fully booked week look selectable. The check-out day of one charter is
       the check-in day of the next, so the last day of a period stays open. */
    const takenSet = new Set<number>()
    for (const a of yacht.availability ?? []) {
      const from = startOfDay(new Date(a.dateFrom))
      const to = startOfDay(new Date(a.dateTo))
      if (isBefore(to, today)) continue
      for (const d of eachDayOfInterval({ start: from, end: to })) {
        if (d.getTime() === to.getTime()) continue
        takenSet.add(startOfDay(d).getTime())
      }
    }

    const matcher = (day: Date) => {
      const d = startOfDay(day)
      if (isBefore(d, today)) return true
      if (takenSet.has(d.getTime())) return true
      return !availableSet.has(d.getTime())
    }
    const sortedPrices = yacht.prices
      .filter((p) => p.priceType === "WEEKLY" && !isBefore(startOfDay(new Date(p.dateTo)), today))
      .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
    const firstDate = sortedPrices.length > 0
      ? (() => { const d = startOfDay(new Date(sortedPrices[0].dateFrom)); return isBefore(d, today) ? today : d })()
      : today
    return { unavailableMatcher: matcher, firstAvailableMonth: firstDate }
  }, [yacht.prices, yacht.availability])

  // Compute price for selected dates
  const selectedDatePrice = useMemo(() => {
    if (!checkIn || !checkOut || checkIn === checkOut) return null
    const cin = new Date(checkIn)
    const cout = new Date(checkOut)
    const matchingPrice = weeklyPrices.find((p) => {
      const from = new Date(p.dateFrom)
      const to = new Date(p.dateTo)
      return cin >= from && cin <= to
    })
    if (!matchingPrice) return null
    const days = Math.max(1, Math.round((cout.getTime() - cin.getTime()) / (1000 * 60 * 60 * 24)))
    const weeks = days / 7
    return {
      total: Math.round(matchingPrice.price * weeks),
      perWeek: matchingPrice.price,
      days,
      currency: matchingPrice.currency,
    }
  }, [checkIn, checkOut, weeklyPrices])

  // Submit booking request
  const handleSubmitBooking = async () => {
    if (!bookingForm.firstName || !bookingForm.email || !checkIn || !checkOut) return
    setBookingSubmitting(true)
    try {
      await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingForm,
          yachtId: yacht.id,
          yachtName: yacht.name,
          checkIn,
          checkOut,
          guests: guestCount,
          estimatedPrice: selectedDatePrice?.total || null,
          currency: selectedDatePrice?.currency || "EUR",
          type: "booking",
        }),
      })
      setBookingSuccess(true)
    } catch {
      // silent
    } finally {
      setBookingSubmitting(false)
    }
  }

  // Modal escape key + body lock
  useEffect(() => {
    const isOpen = enquiryOpen || bookingOpen
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setEnquiryOpen(false); setBookingOpen(false) }
    }
    lockScroll()
    window.addEventListener("keydown", handleKey)
    return () => { unlockScroll(); window.removeEventListener("keydown", handleKey) }
  }, [enquiryOpen, bookingOpen])

  // Submit enquiry
  const handleSubmitEnquiry = async () => {
    if (!enquiryForm.firstName || !enquiryForm.email) return
    setEnquirySubmitting(true)
    try {
      await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...enquiryForm,
          yachtId: yacht.id,
          yachtName: yacht.name,
          preferredMonths: selectedMonths,
          guests: enquiryGuestCount,
          type: "enquiry",
        }),
      })
      setEnquirySuccess(true)
    } catch {
      // silent fail - form stays open
    } finally {
      setEnquirySubmitting(false)
    }
  }

  // Build available months from pricing periods for the month picker
  const availableMonths = useMemo(() => {
    const now = new Date()
    const months = new Set<string>()
    for (const p of yacht.prices) {
      if (p.priceType !== "WEEKLY") continue
      const from = new Date(p.dateFrom)
      const to = new Date(p.dateTo)
      if (to < now) continue
      // Add all months this period spans
      const cursor = new Date(Math.max(from.getTime(), now.getTime()))
      cursor.setDate(1)
      while (cursor <= to) {
        months.add(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`)
        cursor.setMonth(cursor.getMonth() + 1)
      }
    }
    return Array.from(months).sort()
  }, [yacht.prices])

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month].sort()
    )
  }

  const prevImage = () => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  const nextImage = () => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))

  /* Which slides are in the DOM. Grows to cover the current frame and its two
     neighbours so an arrow press has its target already decoded, and never
     shrinks, so nothing is ever remounted mid-transition. */
  const [mountedSlides, setMountedSlides] = useState<Set<number>>(new Set([0]))
  useEffect(() => {
    if (images.length < 2) return
    const want = [
      currentImage,
      (currentImage + 1) % images.length,
      (currentImage - 1 + images.length) % images.length,
    ]
    setMountedSlides((prev) => {
      if (want.every((i) => prev.has(i))) return prev
      const next = new Set(prev)
      want.forEach((i) => next.add(i))
      return next
    })
  }, [currentImage, images.length])

  return (
    <div className="w-full flex flex-col antialiased bg-[var(--surface-page)] relative" style={{ color: "var(--text-heading)" }}>
      {/* Hero Gallery */}
      <section className="relative w-full h-[720px] flex-shrink-0 group">
        {/* The slides are stacked and crossfaded rather than one <Image> whose
            src is swapped. Swapping the src gave no transition and, worse, only
            started fetching the next photograph on click — so every press of an
            arrow showed the old frame until the network came back. Here the
            neighbours are already decoded, so the change is instant. */}
        {hasImages ? (
          images.map((src, i) => {
            const isCurrent = i === currentImage
            // Only ever mount more, never unmount. Dropping a slide and
            // remounting it on the next press restarted its transition from
            // the default opacity, so the frame flashed in before fading out —
            // which read as a stutter, and as two changes for one click.
            if (!mountedSlides.has(i)) return null
            return (
              <Image
                key={src}
                src={src}
                alt={isCurrent ? yacht.name : ""}
                aria-hidden={!isCurrent}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover transition-opacity duration-500 ease-out"
                style={{ opacity: isCurrent ? 1 : 0, zIndex: isCurrent ? 1 : 0 }}
              />
            )
          })
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--iyc-ionian-900)] to-[var(--iyc-ionian-600)]" />
        )}

        {/* Bottom scrim for the title, plus a short top wash so the fixed
            header stays legible against a bright sky — --scrim-photo fades to
            nothing at 78% and leaves the top of the frame unprotected. */}
        <div
          aria-hidden
          className="absolute inset-0 z-[2]"
          style={{ background: "var(--scrim-photo)" }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-[2] h-32"
          style={{ background: "linear-gradient(to bottom, rgba(4,13,25,.55) 0%, rgba(4,13,25,0) 100%)" }}
        />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label={t("gallery.previous", "Previous photo")}
              className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/30 transition z-20"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={nextImage}
              aria-label={t("gallery.next", "Next photo")}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/30 transition z-20"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        {/* Bottom gallery bar */}
        <div className="absolute bottom-8 left-12 right-12 z-20 flex items-end justify-between max-w-[1400px] mx-auto">
          <h1 className="text-2xl text-white font-semibold" style={{ fontFamily: "var(--font-display)" }}>{yacht.name}</h1>

          {/* Avatar-style circular thumbnails */}
          <button
            onClick={() => openGallery(0)}
            className="group/gallery flex flex-col items-end gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold tracking-wide">{t("yacht.gallery", "Gallery")}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--iyc-ionian-600)] to-[var(--iyc-ionian-400)] text-white shadow-lg shadow-blue-500/25">
                {images.length} Photos
              </span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center -space-x-3 group-hover/gallery:-space-x-1 transition-all duration-500 ease-out">
                {images.slice(0, 5).map((img, i) => (
                  <div
                    key={i}
                    className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white/80 shadow-lg transition-all duration-500 ease-out group-hover/gallery:scale-110 group-hover/gallery:border-white"
                    style={{ zIndex: 5 - i, transitionDelay: `${i * 40}ms` }}
                  >
                    <Image
                      src={img}
                      alt={`${yacht.name} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </div>
                ))}
              </div>
              {images.length > 5 && (
                <div className="relative w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white text-xs font-semibold shadow-lg transition-all duration-500 ease-out group-hover/gallery:scale-110 group-hover/gallery:bg-white/30 -ml-3 group-hover/gallery:-ml-1"
                  style={{ zIndex: 0, transitionDelay: "200ms" }}
                >
                  +{images.length - 5}
                </div>
              )}
            </div>
          </button>
        </div>
      </section>

      {/* Fullscreen Gallery Modal */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-300 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/98 backdrop-blur-xl" onClick={closeGallery} />

          {/* Top bar */}
          <div className="relative z-[110] flex items-center justify-between px-6 md:px-10 py-5 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-white/50 text-sm tracking-wider font-light">
                {String(galleryIndex + 1).padStart(2, "0")}
              </span>
              <div className="w-8 h-px bg-white/20" />
              <span className="text-white/50 text-sm tracking-wider font-light">
                {String(images.length).padStart(2, "0")}
              </span>
            </div>

            <span className="text-white/70 text-sm font-medium tracking-wide hidden md:block">
              {yacht.name}
            </span>

            <button
              onClick={closeGallery}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors duration-200 ease-out cursor-pointer"
              aria-label="Close gallery"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Main image area */}
          <div className="relative z-[110] flex-1 flex items-center justify-center px-16 md:px-24 min-h-0">
            {/* Previous */}
            {images.length > 1 && (
              <button
                onClick={galleryPrev}
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-all duration-200 ease-out cursor-pointer group/nav"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-white/60 group-hover/nav:text-white transition-colors duration-200" />
              </button>
            )}

            {/* Image with crossfade + slide transition */}
            <div className="relative w-full h-full max-h-[72vh] flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: galleryTransition ? 0 : 1,
                  transform: galleryTransition
                    ? `translateX(${galleryDirection === "right" ? "-40px" : "40px"}) scale(0.97)`
                    : "translateX(0) scale(1)",
                }}
              >
                <Image
                  src={images[galleryIndex]}
                  alt={`${yacht.name} – Photo ${galleryIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 85vw"
                  priority
                />
              </div>
            </div>

            {/* Next */}
            {images.length > 1 && (
              <button
                onClick={galleryNext}
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-all duration-200 ease-out cursor-pointer group/nav"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-white/60 group-hover/nav:text-white transition-colors duration-200" />
              </button>
            )}
          </div>

          {/* Bottom thumbnail strip */}
          <div className="relative z-[110] shrink-0 py-3 px-6 md:px-10">
            <div className="flex items-center justify-center gap-3 max-w-[90vw] mx-auto overflow-hidden">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => transitionTo(i, i > galleryIndex ? "right" : "left")}
                  className={`relative rounded-full overflow-hidden flex-shrink-0 cursor-pointer transition-all duration-300 ease-out ${
                    galleryIndex === i
                      ? "w-16 h-16 ring-2 ring-white opacity-100"
                      : "w-12 h-12 opacity-40 hover:opacity-70 hover:scale-105"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${yacht.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="w-full bg-[var(--surface-page)] py-12 px-6 md:px-10 relative" style={{ color: "var(--text-heading)" }}>
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col">
            {/* The boat's name is the H1, over the gallery. This is its model,
                which is a subheading — two H1s left the page with no single
                subject for a crawler to settle on. */}
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>{yacht.modelName || yacht.name}</h2>
            {yachtLocation && (
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-8">
                <MapPin className="w-5 h-5 text-[var(--text-subtle)]" />
                <span className="text-[15px] font-medium">{yachtLocation}</span>
              </div>
            )}

            {/* About */}
            {(yachtDescription || yachtNote) && (
              <>
                <h2 className="text-sm font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>{t("yacht.aboutHeading", "About this Yacht")}</h2>
                <div className="prose max-w-none text-[var(--text-muted)] leading-relaxed mb-6 text-xs">
                  {yachtDescription && (
                    <p className="mb-3 whitespace-pre-line">{yachtDescription}</p>
                  )}
                  {yachtNote && (
                    <p className="whitespace-pre-line">{yachtNote}</p>
                  )}
                </div>
              </>
            )}

            {/* Specifications, by what a crew actually decides on. The eight
                that answer "can we all sleep, wash and anchor comfortably"
                are shown as a real grid; the reference figures — mast length,
                fuel consumption, top speed — expand on request rather than
                burying the eight that matter under twenty that do not. */}
            {keySpecs.length > 0 && (
              <div className="mb-8">
                <h2
                  className="mb-6 text-sm font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                >
                  {t("yacht.keySpecsHeading", "Key specifications")}
                </h2>

                <div className="grid grid-cols-2 gap-x-10 gap-y-9 md:grid-cols-3">
                  {keySpecs.map((sp) => (
                    <div
                      key={sp.k}
                      className="flex flex-col gap-1.5 border-b border-[var(--border-hairline)] pb-5"
                    >
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-subtle)" }}
                      >
                        {removeGreekTonos(sp.label)}
                      </span>
                      <span
                        className="iyc-mono text-base font-semibold"
                        style={{ color: "var(--text-heading)" }}
                      >
                        {sp.value}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

          {/* Right Column - Booking Planner */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 z-40" id="booking">
            <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-[var(--border-hairline)]/80">
              {/* Premium header */}
              <div className="relative px-5 pt-5 pb-4 rounded-t-2xl" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-900) 0%, var(--iyc-ionian-600) 100%)" }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                <div className="relative">
                  <span className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">{tUpper("yacht.startingFrom", "Starting from")}</span>
                  <div className="flex items-end gap-1.5 mt-1">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {cheapestPrice ? formatPrice(cheapestPrice, "EUR") : t("yacht.onRequest", "On Request")}
                    </span>
                    {cheapestPrice && (
                      <span className="text-white/50 text-xs font-medium mb-1">/ week</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Step 1: Select Dates */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--iyc-ionian-600)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">1</div>
                    <span className="text-[11px] font-bold text-[var(--text-body)] uppercase tracking-wide">{tUpper("yacht.selectDates", "Select Dates")}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!showCalendar) {
                        setDateRange(undefined)
                        setBookingSuccess(false)
                        setCalendarMonth(firstAvailableMonth)
                        setCalendarKey((k) => k + 1)
                      }
                      setShowCalendar(!showCalendar)
                    }}
                    className="w-full border border-[var(--border-hairline)] rounded-xl p-3 hover:border-[var(--border-input)] transition cursor-pointer flex items-center justify-between bg-[var(--surface-sunken)]/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <CalendarDays className="w-4 h-4 text-[var(--text-link)] shrink-0" />
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="text-left">
                          <span className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-0.5 tracking-wide">{tUpper("yacht.checkIn", "Check-in")}</span>
                          <span className="text-xs font-semibold" style={{ color: dateRange?.from ? "var(--text-heading)" : "#aaa" }}>
                            {dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : t("yacht.selectDate", "Select date")}
                          </span>
                        </div>
                        <div className="text-left border-l border-[var(--border-hairline)] pl-3">
                          <span className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-0.5 tracking-wide">{tUpper("yacht.checkOut", "Check-out")}</span>
                          <span className="text-xs font-semibold" style={{ color: dateRange?.to ? "var(--text-heading)" : "#aaa" }}>
                            {dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : t("yacht.selectDate", "Select date")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[var(--text-subtle)] transition-transform duration-200 ${showCalendar ? "rotate-180" : ""}`} />
                  </button>

                  {/* Calendar dropdown */}
                  {showCalendar && (
                    <div
                      ref={calendarRef}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[200] bg-white rounded-2xl shadow-2xl border border-[var(--border-hairline)] p-5"
                      style={{ width: "620px" }}
                    >
                      <DayPicker
                        key={calendarKey}
                        className="yacht-cal"
                        mode="range"
                        selected={dateRange}
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                        onSelect={(range) => {
                          setDateRange(range)
                          if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
                            setTimeout(() => setShowCalendar(false), 300)
                          }
                        }}
                        disabled={unavailableMatcher}
                        numberOfMonths={2}
                        showOutsideDays={false}
                      />
                      <div className="flex items-center justify-center gap-5 pt-3 mt-3 border-t border-[var(--border-hairline)]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--iyc-ionian-600)]" />
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">{t("yacht.selected", "Selected")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">{t("yacht.unavailable", "Unavailable")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Guests */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--iyc-ionian-600)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">2</div>
                    <span className="text-[11px] font-bold text-[var(--text-body)] uppercase tracking-wide">{tUpper("yacht.partySize", "Party Size")}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[var(--surface-sunken)]/50 rounded-xl p-3 border border-[var(--border-hairline)]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--text-subtle)]" />
                      <span className="text-xs font-medium text-[var(--text-body)]">{guestCount} guest{guestCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        className="w-7 h-7 rounded-lg border border-[var(--border-hairline)] flex items-center justify-center text-sm text-[var(--text-muted)] hover:bg-white hover:border-[var(--border-input)] transition cursor-pointer"
                      >-</button>
                      <span className="text-sm font-bold w-5 text-center" style={{ color: "var(--text-heading)" }}>{guestCount}</span>
                      <button
                        onClick={() => setGuestCount(Math.min(yacht.maxPersons || 20, guestCount + 1))}
                        className="w-7 h-7 rounded-lg border border-[var(--border-hairline)] flex items-center justify-center text-sm text-[var(--text-muted)] hover:bg-white hover:border-[var(--border-input)] transition cursor-pointer"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Price estimate */}
                {selectedDatePrice && (
                  <div className="rounded-xl p-4 border border-[var(--iyc-ionian-600)]/15" style={{ background: "linear-gradient(135deg, rgba(0,85,169,0.04) 0%, rgba(46,44,40,0.03) 100%)" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-[var(--text-muted)]">{formatPrice(selectedDatePrice.perWeek, selectedDatePrice.currency)} x {selectedDatePrice.days} days</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--text-heading)" }}>{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--iyc-ionian-600)]/10">
                      <span className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{t("yacht.estimatedTotal", "Estimated Total")}</span>
                      <span className="text-base font-bold" style={{ color: "var(--iyc-ionian-300)" }}>{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                    </div>
                    <p className="text-[9px] text-[var(--text-subtle)] mt-1.5">{t("yacht.priceDisclaimer", "Excl. VAT & APA. Final price confirmed in proposal.")}</p>
                  </div>
                )}

                {/* Booking CTA */}
                <button
                  onClick={() => { setBookingSuccess(false); setBookingOpen(true) }}
                  disabled={!checkIn || !checkOut || checkIn === checkOut}
                  className="w-full text-white py-3.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-[var(--iyc-ionian-600)]/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600) 0%, var(--iyc-ionian-700) 100%)" }}
                >
                  <Send className="w-3.5 h-3.5" />
                  {checkIn && checkOut && checkIn !== checkOut ? t("yacht.requestBooking", "Request This Booking") : t("yacht.selectDatesToContinue", "Select dates to continue")}
                </button>

                <p className="text-center text-[10px] text-[var(--text-subtle)]">{t("yacht.noCharge", "You won't be charged · Free cancellation")}</p>

                {/* Staff advisor */}
                {yacht.staffRep && (
                  <div className="flex items-center gap-2.5 pt-4 mt-2 border-t border-[var(--border-hairline)]">
                    {yacht.staffRep.image ? (
                      <Image src={yacht.staffRep.image} alt={yacht.staffRep.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-[var(--border-hairline)]" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[var(--surface-inverse)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">IYC</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[var(--text-body)] truncate">{yacht.staffRep.name}</p>
                      <p className="text-[9px] text-[var(--text-subtle)]">{staffPosition || t("yacht.charterAdvisor", "Charter Advisor")}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] text-green-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seasonal Pricing — Card Grid */}
      {weeklyPrices.length > 0 && (
        <section
          className="relative w-full overflow-hidden px-6 py-20 md:px-10"
          style={{ background: "var(--surface-page)" }}
        >
          {/* Chart engraving, masked at both ends so it never meets an edge —
              the treatment the rest of the site uses on light sections. */}
          <div
            className="pointer-events-none absolute inset-0 select-none overflow-hidden"
            aria-hidden
            style={{
              backgroundImage: "url(https://iycweb.b-cdn.net/1774937080534-bg.svg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.3,
              maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
            }}
          />

          <div className="max-w-[1400px] mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left: Season info */}
              <div className="flex flex-col gap-5 shrink-0 lg:w-[220px]">
                {/* Season / Year toggle */}
                <div className="flex flex-wrap gap-2">
                  {priceYears.map((y) => (
                    <button
                      key={y}
                      onClick={() => setActiveYear(y)}
                      className="px-3.5 py-1.5 text-[11px] font-semibold rounded-md transition"
                      style={{
                        background: activeYear === y ? "var(--iyc-ionian-600)" : "transparent",
                        color: activeYear === y ? "#fff" : "var(--text-muted)",
                        border: `1px solid ${activeYear === y ? "var(--iyc-ionian-600)" : "var(--border-input)"}`,
                      }}
                    >
                      Season {y}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="mb-1 text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}>{yacht.name}</p>
                  <h2 className="text-sm font-semibold whitespace-nowrap" style={{ fontFamily: "var(--font-display)", color: "var(--text-muted)" }}>
                    Weekly Rates
                  </h2>
                  <div className="mt-3 h-[3px] w-10 rounded-full" style={{ background: "var(--action-accent)" }} />
                </div>
                <Link
                  href="#booking"
                  className="inline-flex items-center gap-2 hover:opacity-90 transition duration-300 px-4 py-2 rounded-lg text-xs font-semibold self-start"
                  style={{ background: "transparent", color: "var(--text-link)", border: "1px solid var(--border-input)" }}
                >
                  Show Details
                </Link>
              </div>

              {/* Center: Price cards grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {pricesForYear.map((price, i) => {
                  const from = new Date(price.dateFrom)
                  const to = new Date(price.dateTo)
                  /* The month alone was ambiguous: two periods inside the same
                     month rendered as "Sep" twice at different prices, reading
                     as a bug. Show the period the rate actually covers. */
                  const sameMonth = from.getMonth() === to.getMonth()
                  const range = sameMonth
                    ? `${from.getDate()}–${to.getDate()} ${MONTH_NAMES[to.getMonth()]}`
                    : `${from.getDate()} ${MONTH_NAMES[from.getMonth()]} – ${to.getDate()} ${MONTH_NAMES[to.getMonth()]}`
                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-1.5 px-5 py-4 transition-shadow hover:shadow-[var(--shadow-md)]"
                      style={{
                        background: "var(--surface-card)",
                        border: "1px solid var(--border-hairline)",
                        borderRadius: "var(--iyc-radius-lg)",
                      }}
                    >
                      <span
                        className="iyc-mono text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-subtle)" }}
                      >
                        {range}
                      </span>
                      <span
                        className="text-xl font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
                      >
                        {formatPrice(price.price, price.currency)}
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("yacht.perWeekVat", "Per week + VAT & APA")}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Right: Enquire CTA */}
              <div
                className="hidden lg:flex flex-col gap-4 rounded-xl p-5 shrink-0 w-[260px]"
                style={{ background: "var(--iyc-ionian-600)" }}
              >
                <p className="text-white text-sm font-medium">{t("yacht.receiveQuote", "Would you like to receive a quote for this yacht?")}</p>
                <div className="flex items-center gap-3">
                  {yacht.staffRep?.image ? (
                    <Image
                      src={yacht.staffRep.image}
                      alt={yacht.staffRep.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      IYC
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white text-xs font-semibold truncate">{yacht.staffRep?.name || "IYC Charter Team"}</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    </div>
                    <span className="text-white/60 text-[10px]">{yacht.staffRep?.position || t("yacht.charterAdvisor", "Charter Advisor")}</span>
                  </div>
                  <button
                    onClick={() => { setEnquirySuccess(false); setEnquiryOpen(true) }}
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition hover:bg-white/30 cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
                  >
                    Enquire
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Equipment & Features Tabs */}
      {categoryTabs.length > 0 && (
        <section className="w-full bg-white py-12 px-6 md:px-10 relative z-[1] border-t border-[var(--border-hairline)]" style={{ color: "var(--text-heading)" }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
              >
                {t("yacht.equipmentFeaturesHeading", "Equipment & Features")}
              </h2>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {equipmentCount} {t("yacht.itemsIncluded", "items included")}
              </span>
            </div>

            {/* Every category at once, in columns. This was eight tabs over
                fifty-odd items: seven visible at a time, eight clicks to see
                the boat's inventory, and never an overview. Grouped columns
                cost about the same height and ask for nothing. */}
            <div className="columns-1 gap-x-10 sm:columns-2 lg:columns-3 [&>*]:break-inside-avoid">
              {categoryTabs.map((tab) => (
                <div key={tab.id} className="mb-7 inline-block w-full align-top">
                  <h3
                    className="mb-2 border-b border-[var(--border-hairline)] pb-1.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    {removeGreekTonos(tab.name)}
                    <span className="ml-1.5 font-normal opacity-70">{tab.items.length}</span>
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {tab.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check
                          className="mt-[3px] h-3 w-3 shrink-0"
                          style={{ color: "var(--iyc-ionian-500)" }}
                          aria-hidden
                        />
                        <span className="text-xs leading-snug" style={{ color: "var(--text-body)" }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Services */}
            {yacht.services.length > 0 && (
              <div className="mt-10 border-t border-[var(--border-hairline)] pt-8 pb-[100px]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{t("yacht.availableServices", "Available Services")}</h2>
                  <span className="text-xs text-[var(--text-muted)]">{t("yacht.optionalAddons", "Optional add-ons for your charter")}</span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-4">
                  {[...yacht.services].sort((a, b) => {
                    // Free / included first, then paid
                    const aFree = a.price === 0 || a.obligatory ? 0 : 1
                    const bFree = b.price === 0 || b.obligatory ? 0 : 1
                    return aFree - bFree
                  }).map((service, i) => {
                    const isObligatory = service.obligatory
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium relative ${
                          isObligatory
                            ? "text-white"
                            : "border-2 border-[var(--border-hairline)] text-[var(--text-muted)] hover:border-[var(--text-subtle)] hover:text-[var(--text-subtle)] transition cursor-pointer"
                        }`}
                        style={isObligatory ? { backgroundColor: i < 3 ? "var(--iyc-ionian-900)" : "var(--text-subtle)" } : undefined}
                      >
                        {!isObligatory && service.price > 0 && (
                          <span
                            className="absolute -top-2 -right-2 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: "var(--iyc-ionian-900)" }}
                          >
                            {formatPrice(service.price, service.currency)}
                          </span>
                        )}
                        {isObligatory ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        {resolveT(service.nameTranslations, locale, service.name)}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Booking Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBookingOpen(false)} />
          <div className="relative z-[110] bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">

            {bookingSuccess ? (
              /* Success */
              <div className="relative overflow-hidden">
                <div className="relative px-8 pt-10 pb-8 text-center" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-900) 0%, var(--iyc-ionian-600) 60%, var(--iyc-ionian-500) 100%)" }}>
                  <button onClick={() => setBookingOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/20">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ fontFamily: "var(--font-display)",  color: "#ffffff" }}>
                      {bookingForm.firstName ? `${t("yacht.excellentChoice", "Excellent Choice")}, ${bookingForm.firstName}!` : t("yacht.excellentChoiceAlt", "Excellent Choice!")}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto">
                      Your booking request for <span className="text-white font-semibold">{yacht.name}</span> has been received.
                    </p>
                  </div>
                </div>

                <div className="px-8 -mt-4 relative z-10">
                  <div className="bg-white rounded-xl shadow-lg border border-[var(--border-hairline)] p-5">
                    {/* Booking summary */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border-hairline)]">
                      <div className="text-center flex-1">
                        <span className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-0.5">{tUpper("yacht.checkIn", "Check-in")}</span>
                        <span className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : "—"}</span>
                      </div>
                      <div className="w-8 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <div className="text-center flex-1">
                        <span className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-0.5">{tUpper("yacht.checkOut", "Check-out")}</span>
                        <span className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : "—"}</span>
                      </div>
                      <div className="text-center flex-1 border-l border-[var(--border-hairline)] pl-3">
                        <span className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-0.5">{tUpper("yacht.stat.guests", "Guests")}</span>
                        <span className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{guestCount}</span>
                      </div>
                    </div>

                    {selectedDatePrice && (
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--border-hairline)]">
                        <span className="text-xs text-[var(--text-muted)]">{t("yacht.estimatedTotal", "Estimated Total")}</span>
                        <span className="text-base font-bold" style={{ color: "var(--iyc-ionian-300)" }}>{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                      </div>
                    )}

                    {/* Staff advisor */}
                    {yacht.staffRep && (
                      <div className="flex items-center gap-3">
                        {yacht.staffRep.image ? (
                          <Image src={yacht.staffRep.image} alt={yacht.staffRep.name} width={44} height={44} className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-[var(--border-hairline)]" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[var(--surface-inverse)] flex items-center justify-center text-white text-xs font-bold shrink-0">IYC</div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[var(--text-body)]">{yacht.staffRep.name}</p>
                          <p className="text-[10px] text-[var(--text-subtle)]">{staffPosition || t("yacht.charterAdvisor", "Charter Advisor")}</p>
                        </div>
                        <span className="text-[9px] text-green-600 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Will confirm shortly
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-8 pt-5 pb-8 text-center">
                  <button onClick={() => setBookingOpen(false)} className="px-8 py-3 rounded-xl text-xs font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[var(--iyc-ionian-600)]/20 active:scale-[0.98] cursor-pointer" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600) 0%, var(--iyc-ionian-700) 100%)" }}>
                    Continue Browsing
                  </button>
                  <p className="text-[10px] text-[var(--text-subtle)] mt-3">A confirmation email has been sent to {bookingForm.email || "your inbox"}</p>
                </div>
              </div>
            ) : (
              /* Booking form */
              <>
                <div className="relative px-6 pt-6 pb-4 rounded-t-2xl" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-900) 0%, var(--iyc-ionian-600) 100%)" }}>
                  <button onClick={() => setBookingOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="flex items-center gap-3">
                    {yacht.staffRep?.image ? (
                      <Image src={yacht.staffRep.image} alt={yacht.staffRep.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white/20" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-sm shrink-0 border border-white/20">IYC</div>
                    )}
                    <div>
                      <h2 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{t("yacht.confirmBooking", "Confirm Your Booking")}</h2>
                      <p className="text-[11px] text-white/60 mt-0.5">{yacht.name}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  {/* Booking summary card */}
                  <div className="bg-[var(--surface-sunken)] rounded-xl p-4 mb-5 border border-[var(--border-hairline)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center flex-1">
                        <span className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-0.5">{tUpper("yacht.checkIn", "Check-in")}</span>
                        <span className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : "—"}</span>
                      </div>
                      <div className="w-6 flex items-center justify-center">
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </div>
                      <div className="text-center flex-1">
                        <span className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-0.5">{tUpper("yacht.checkOut", "Check-out")}</span>
                        <span className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : "—"}</span>
                      </div>
                      <div className="text-center flex-1 border-l border-[var(--border-hairline)] pl-3">
                        <span className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-0.5">{tUpper("yacht.stat.guests", "Guests")}</span>
                        <span className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{guestCount}</span>
                      </div>
                    </div>
                    {selectedDatePrice && (
                      <div className="flex justify-between items-center pt-3 border-t border-[var(--border-hairline)]">
                        <span className="text-xs font-bold text-[var(--text-muted)]">{t("yacht.estimatedTotal", "Estimated Total")}</span>
                        <span className="text-base font-bold" style={{ color: "var(--iyc-ionian-300)" }}>{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                      </div>
                    )}
                    <p className="text-[9px] text-[var(--text-subtle)] mt-1.5">{t("yacht.priceDisclaimer", "Excl. VAT & APA. Final price confirmed in proposal.")}</p>
                  </div>

                  {/* Contact fields */}
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-[var(--text-link)]" />
                    <span className="text-[11px] font-bold text-[var(--text-body)] uppercase tracking-wide">{tUpper("yacht.yourDetails", "Your Details")}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.firstName", "First Name")} *</label>
                        <input type="text" value={bookingForm.firstName} onChange={(e) => setBookingForm({ ...bookingForm, firstName: e.target.value })} placeholder="John" className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition" style={{ color: "var(--text-body)" }} />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.lastName", "Last Name")}</label>
                        <input type="text" value={bookingForm.lastName} onChange={(e) => setBookingForm({ ...bookingForm, lastName: e.target.value })} placeholder="Doe" className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition" style={{ color: "var(--text-body)" }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.email", "Email")} *</label>
                      <input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} placeholder="john@example.com" className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition" style={{ color: "var(--text-body)" }} />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.phone", "Phone")}</label>
                      <input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} placeholder="+30 123 456 7890" className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition" style={{ color: "var(--text-body)" }} />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.specialRequests", "Special Requests")}</label>
                      <textarea value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} placeholder={t("yacht.enquiry.notesPlaceholder", "Celebrations, dietary needs, preferred destinations...")} rows={3} className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition resize-none" style={{ color: "var(--text-body)" }} />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitBooking}
                    disabled={!bookingForm.firstName || !bookingForm.email || bookingSubmitting}
                    className="w-full text-white py-3.5 rounded-xl text-xs font-bold transition-all duration-300 mt-5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-[var(--iyc-ionian-600)]/20 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600) 0%, var(--iyc-ionian-700) 100%)" }}
                  >
                    {bookingSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Confirming your request...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {t("yacht.confirmBookingRequest", "Confirm Booking Request")}
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-[var(--text-subtle)] mt-2.5">{t("yacht.noPayment", "No payment required · Free cancellation")}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating phone button */}
      <div className="fixed right-6 bottom-6 z-50">
        <button
          aria-label={t("yacht.callUs", "Call us about this yacht")}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition" style={{ backgroundColor: "var(--text-subtle)" }}>
          <Phone className="w-6 h-6" />
        </button>
      </div>

      {/* Enquiry Modal */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEnquiryOpen(false)} />
          <div
            ref={enquiryRef}
            className="relative z-[110] bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {enquirySuccess ? (
              /* Success state — personalized marketing message */
              <div className="relative overflow-hidden">
                {/* Gradient hero */}
                <div className="relative px-8 pt-10 pb-8 text-center" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-900) 0%, var(--iyc-ionian-600) 60%, var(--iyc-ionian-500) 100%)" }}>
                  <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

                  {/* Close button */}
                  <button
                    onClick={() => setEnquiryOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>

                  <div className="relative">
                    {/* Animated checkmark */}
                    <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/20">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                      {enquiryForm.firstName ? `Thank You, ${enquiryForm.firstName}!` : "Thank You!"}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto">
                      Your personalized charter proposal for <span className="text-white font-semibold">{yacht.name}</span> is being prepared.
                    </p>
                  </div>
                </div>

                {/* Details card */}
                <div className="px-8 -mt-4 relative z-10">
                  <div className="bg-white rounded-xl shadow-lg border border-[var(--border-hairline)] p-5">
                    {/* Staff advisor */}
                    {yacht.staffRep && (
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border-hairline)]">
                        {yacht.staffRep.image ? (
                          <Image src={yacht.staffRep.image} alt={yacht.staffRep.name} width={44} height={44} className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-[var(--border-hairline)]" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[var(--surface-inverse)] flex items-center justify-center text-white text-xs font-bold shrink-0">IYC</div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[var(--text-body)]">{yacht.staffRep.name}</p>
                          <p className="text-[10px] text-[var(--text-subtle)]">{staffPosition || t("yacht.charterAdvisor", "Charter Advisor")}</p>
                        </div>
                        <span className="text-[9px] text-green-600 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Will respond shortly
                        </span>
                      </div>
                    )}

                    {/* What happens next */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--iyc-ionian-600)]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Mail className="w-3 h-3 text-[var(--text-link)]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-body)]">{t("yacht.confirmationSent", "Confirmation sent")}</p>
                          <p className="text-[10px] text-[var(--text-subtle)]">Check your inbox at {enquiryForm.email || "your email"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--iyc-ionian-600)]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <CalendarDays className="w-3 h-3 text-[var(--text-link)]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-body)]">{t("yacht.proposal24h", "Tailored proposal within 24h")}</p>
                          <p className="text-[10px] text-[var(--text-subtle)]">
                            {selectedMonths.length > 0
                              ? `Availability & pricing for ${selectedMonths.map((m) => { const [y, mo] = m.split("-"); return `${MONTH_NAMES[parseInt(mo) - 1]} ${y}` }).join(", ")}`
                              : "Best available dates and pricing options"
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--iyc-ionian-600)]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Anchor className="w-3 h-3 text-[var(--text-link)]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-body)]">{t("yacht.itinerarySuggestions", "Itinerary suggestions included")}</p>
                          <p className="text-[10px] text-[var(--text-subtle)]">Routes curated for {enquiryGuestCount} guest{enquiryGuestCount !== 1 ? "s" : ""} aboard {yacht.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="px-8 pt-5 pb-8 text-center">
                  <button
                    onClick={() => setEnquiryOpen(false)}
                    className="px-8 py-3 rounded-xl text-xs font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[var(--iyc-ionian-600)]/20 active:scale-[0.98] cursor-pointer"
                    style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600) 0%, var(--iyc-ionian-700) 100%)" }}
                  >
                    Continue Browsing
                  </button>
                  <p className="text-[10px] text-[var(--text-subtle)] mt-3">
                    Have questions? Call us at <span className="font-semibold text-[var(--text-muted)]">+30 210 XXX XXXX</span>
                  </p>
                </div>
              </div>
            ) : (
              /* Form */
              <>
                {/* Modal header with gradient */}
                <div className="relative px-6 pt-6 pb-4" style={{ background: "linear-gradient(135deg, var(--iyc-ionian-900) 0%, var(--iyc-ionian-600) 100%)" }}>
                  <button
                    onClick={() => setEnquiryOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="flex items-center gap-3">
                    {yacht.staffRep?.image ? (
                      <Image src={yacht.staffRep.image} alt={yacht.staffRep.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white/20" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-sm shrink-0 border border-white/20">IYC</div>
                    )}
                    <div>
                      <h2 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{t("yacht.planYourCharter", "Plan Your Charter")}</h2>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        {yacht.staffRep ? `${yacht.staffRep.name} will prepare your proposal` : `Personalized proposal for ${yacht.name}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  {/* Charter preferences */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarDays className="w-4 h-4 text-[var(--text-link)]" />
                      <span className="text-[11px] font-bold text-[var(--text-body)] uppercase tracking-wide">{tUpper("yacht.preferredPeriod", "Preferred Period")}</span>
                    </div>
                    <div className="bg-[var(--surface-sunken)] rounded-xl p-3.5 border border-[var(--border-hairline)]">
                      {(() => {
                        const byYear: Record<number, string[]> = {}
                        for (const m of availableMonths) {
                          const y = parseInt(m.split("-")[0])
                          if (!byYear[y]) byYear[y] = []
                          byYear[y].push(m)
                        }
                        return Object.entries(byYear).map(([year, months]) => (
                          <div key={year} className="mb-2 last:mb-0">
                            <span className="text-[9px] uppercase font-bold text-[var(--text-subtle)] tracking-wider mb-1.5 block">{year}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {months.map((m) => {
                                const selected = selectedMonths.includes(m)
                                const monthIdx = parseInt(m.split("-")[1]) - 1
                                return (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => toggleMonth(m)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 cursor-pointer border ${
                                      selected
                                        ? "text-white border-transparent shadow-sm"
                                        : "border-[var(--border-hairline)] text-[var(--text-muted)] hover:border-[var(--iyc-ionian-600)]/40 hover:text-[var(--text-link)] hover:bg-[var(--iyc-ionian-600)]/5"
                                    }`}
                                    style={selected ? { backgroundColor: "var(--iyc-ionian-600)" } : undefined}
                                  >
                                    {MONTH_NAMES[monthIdx]}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      })()}
                      {availableMonths.length === 0 && (
                        <p className="text-[10px] text-[var(--text-subtle)] italic">{t("yacht.noAvailability", "No availability data yet")}</p>
                      )}

                      {/* Guests inline */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-hairline)]">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">{tUpper("yacht.stat.guests", "Guests")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-6 h-6 rounded-lg border border-[var(--border-hairline)] flex items-center justify-center text-xs text-[var(--text-muted)] hover:bg-white hover:border-[var(--border-input)] transition cursor-pointer">-</button>
                          <span className="text-xs font-bold w-4 text-center" style={{ color: "var(--text-heading)" }}>{guestCount}</span>
                          <button type="button" onClick={() => setGuestCount(Math.min(yacht.maxPersons || 20, guestCount + 1))} className="w-6 h-6 rounded-lg border border-[var(--border-hairline)] flex items-center justify-center text-xs text-[var(--text-muted)] hover:bg-white hover:border-[var(--border-input)] transition cursor-pointer">+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact fields */}
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-[var(--text-link)]" />
                    <span className="text-[11px] font-bold text-[var(--text-body)] uppercase tracking-wide">{tUpper("yacht.yourDetails", "Your Details")}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.firstName", "First Name")} *</label>
                        <input
                          type="text"
                          value={enquiryForm.firstName}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, firstName: e.target.value })}
                          placeholder="John"
                          className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition"
                          style={{ color: "var(--text-body)" }}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.lastName", "Last Name")}</label>
                        <input
                          type="text"
                          value={enquiryForm.lastName}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, lastName: e.target.value })}
                          placeholder="Doe"
                          className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition"
                          style={{ color: "var(--text-body)" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.email", "Email")} *</label>
                      <input
                        type="email"
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition"
                        style={{ color: "var(--text-body)" }}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.phone", "Phone")}</label>
                      <input
                        type="tel"
                        value={enquiryForm.phone}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                        placeholder="+30 123 456 7890"
                        className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition"
                        style={{ color: "var(--text-body)" }}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--text-subtle)] mb-1 tracking-wide">{tUpper("yacht.specialRequests", "Special Requests")}</label>
                      <textarea
                        value={enquiryForm.notes}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                        placeholder={t("yacht.enquiry.notesPlaceholder", "Celebrations, dietary needs, preferred destinations...")}
                        rows={3}
                        className="w-full border border-[var(--border-input)] rounded-[var(--iyc-radius-sm)] px-3 py-2.5 text-xs bg-transparent placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-link)] transition resize-none"
                        style={{ color: "var(--text-body)" }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitEnquiry}
                    disabled={!enquiryForm.firstName || !enquiryForm.email || enquirySubmitting}
                    className="w-full text-white py-3.5 rounded-xl text-xs font-bold transition-all duration-300 mt-5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-[var(--iyc-ionian-600)]/20 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, var(--iyc-ionian-600) 0%, var(--iyc-ionian-700) 100%)" }}
                  >
                    {enquirySubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Preparing your request...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {t("yacht.sendEnquiry", "Send My Charter Request")}
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-[var(--text-subtle)] mt-2.5">
                    {t("yacht.noCommitment", "No commitment · Free personalized proposal")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
