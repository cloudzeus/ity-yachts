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
  { bg: "bg-blue-50", border: "border-blue-100", text: "text-[#0055a9]" },
  { bg: "bg-[#070c26]/5", border: "border-[#070c26]/10", text: "text-[#84776e]" },
  { bg: "bg-[#84776e]/10", border: "border-[#84776e]/20", text: "text-[#84776e]" },
  { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-600" },
  { bg: "bg-green-50", border: "border-green-100", text: "text-green-600" },
  { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-600" },
  { bg: "bg-yellow-50", border: "border-yellow-100", text: "text-yellow-600" },
  { bg: "bg-[#070c26]/5", border: "border-[#070c26]/10", text: "text-[#84776e]" },
]

// Amenity icons list for the top "Equipment & Amenities" quick display
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "air conditioning": <Sun className="w-4 h-4 text-[#84776e]" />,
  generator: <Cpu className="w-4 h-4 text-[#84776e]" />,
  "wi-fi": <Wifi className="w-4 h-4 text-[#84776e]" />,
  wifi: <Wifi className="w-4 h-4 text-[#84776e]" />,
  "bbq grill": <Flame className="w-4 h-4 text-[#84776e]" />,
  bbq: <Flame className="w-4 h-4 text-[#84776e]" />,
  "snorkeling gear": <Anchor className="w-4 h-4 text-[#84776e]" />,
  "smart tv": <Tv className="w-4 h-4 text-[#84776e]" />,
  tv: <Tv className="w-4 h-4 text-[#84776e]" />,
  "water maker": <Zap className="w-4 h-4 text-[#84776e]" />,
  watermaker: <Zap className="w-4 h-4 text-[#84776e]" />,
  "solar panels": <Home className="w-4 h-4 text-[#84776e]" />,
  "hot water": <Droplets className="w-4 h-4 text-[#84776e]" />,
  "life jackets": <HelpCircle className="w-4 h-4 text-[#84776e]" />,
  "dinghy with motor": <Box className="w-4 h-4 text-[#84776e]" />,
  dinghy: <Box className="w-4 h-4 text-[#84776e]" />,
  "cockpit cushions": <BarChart3 className="w-4 h-4 text-[#84776e]" />,
  "bimini top": <Circle className="w-4 h-4 text-[#84776e]" />,
}

function getAmenityIcon(_name: string) {
  return <Anchor className="w-4 h-4 text-[#84776e]" />
}

export function YachtDetailClient({ yacht }: { yacht: YachtData }) {
  const { locale, t, tUpper } = useTranslations()
  const yachtCategory = resolveT(yacht.categoryTranslations, locale, yacht.category)
  const yachtLocation = resolveT(yacht.locationTranslations, locale, yacht.location)
  const yachtDescription = resolveT(yacht.descriptionTranslations, locale, yacht.description)
  const yachtNote = resolveT(yacht.noteTranslations, locale, yacht.note)
  const staffPosition = yacht.staffRep ? resolveT(yacht.staffRep.positionTranslations, locale, yacht.staffRep.position) : ""
  const [currentImage, setCurrentImage] = useState(0)
  const [activeTab, setActiveTab] = useState<string | null>(null)

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
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = ""
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

  // Set initial active tab
  const initialTab = categoryTabs.length > 0 ? categoryTabs[0].id : null
  if (activeTab === null && initialTab) {
    setActiveTab(initialTab)
  }

  const currentTab = categoryTabs.find((tab) => tab.id === activeTab)

  // Build specs list
  const specs: Array<{ label: string; value: string }> = []
  if (yachtCategory) specs.push({ label: t("yacht.spec.yachtType", "Yacht Type"), value: yachtCategory })
  if (yacht.loa) specs.push({ label: t("yacht.spec.length", "Length"), value: `${yacht.loa.toFixed(2)} Meters` })
  if (yacht.beam) specs.push({ label: t("yacht.spec.beam", "Beam"), value: `${yacht.beam.toFixed(2)} Meters` })
  if (yacht.draft) specs.push({ label: t("yacht.spec.draft", "Draft"), value: `${yacht.draft.toFixed(2)} Meters` })
  if (yacht.engineBuilder || yacht.enginePower) {
    const engineStr = [yacht.engineBuilder, yacht.enginePower ? `${yacht.enginePower}HP` : ""].filter(Boolean).join(" ")
    specs.push({ label: t("yacht.spec.engine", "Engine"), value: engineStr })
  }
  if (yacht.fuelType || yacht.fuelTank) {
    const fuelStr = [yacht.fuelType, yacht.fuelTank ? `${yacht.fuelTank}L` : ""].filter(Boolean).join(", ")
    specs.push({ label: t("yacht.spec.fuel", "Fuel"), value: fuelStr })
  }
  if (yacht.waterTank) specs.push({ label: t("yacht.spec.waterTank", "Water Tank"), value: `${yacht.waterTank} Liters` })
  if (yacht.fuelConsumption) specs.push({ label: t("yacht.spec.fuelConsumption", "Fuel Consumption"), value: `${yacht.fuelConsumption}L/hour` })
  if (yacht.buildYear) specs.push({ label: t("yacht.spec.yearBuilt", "Year Built"), value: String(yacht.buildYear) })
  if (yacht.renewed) specs.push({ label: t("yacht.spec.renewed", "Renewed"), value: String(yacht.renewed) })
  if (yacht.cruisingSpeed) specs.push({ label: t("yacht.spec.cruisingSpeed", "Cruising Speed"), value: `${yacht.cruisingSpeed} knots` })
  if (yacht.maxSpeed) specs.push({ label: t("yacht.spec.maxSpeed", "Max Speed"), value: `${yacht.maxSpeed} knots` })
  if (yacht.berthsTotal) specs.push({ label: t("yacht.spec.berths", "Berths"), value: `${yacht.berthsTotal}${yacht.cabins ? ` (${yacht.cabins} Cabins)` : ""}` })
  if (yacht.wc) specs.push({ label: t("yacht.spec.toilets", "Toilets"), value: String(yacht.wc) })
  if (yacht.showers) specs.push({ label: t("yacht.spec.showers", "Showers"), value: String(yacht.showers) })
  if (yacht.mastLength) specs.push({ label: t("yacht.spec.mastLength", "Mast Length"), value: `${yacht.mastLength}m` })
  if (yacht.propulsionType) specs.push({ label: t("yacht.spec.propulsion", "Propulsion"), value: yacht.propulsionType })
  if (yacht.builder) specs.push({ label: t("yacht.spec.builder", "Builder"), value: yacht.builder })

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
    const matcher = (day: Date) => {
      const d = startOfDay(day)
      if (isBefore(d, today)) return true
      return !availableSet.has(d.getTime())
    }
    const sortedPrices = yacht.prices
      .filter((p) => p.priceType === "WEEKLY" && !isBefore(startOfDay(new Date(p.dateTo)), today))
      .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
    const firstDate = sortedPrices.length > 0
      ? (() => { const d = startOfDay(new Date(sortedPrices[0].dateFrom)); return isBefore(d, today) ? today : d })()
      : today
    return { unavailableMatcher: matcher, firstAvailableMonth: firstDate }
  }, [yacht.prices])

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
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKey)
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKey) }
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

  return (
    <div className="w-full flex flex-col antialiased bg-white relative" style={{ color: "#070c26" }}>
      {/* Hero Gallery */}
      <section className="relative w-full h-[720px] flex-shrink-0 group">
        {hasImages ? (
          <Image
            src={images[currentImage]}
            alt={yacht.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#070c26] to-[#0055a9]" />
        )}

        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070c26] via-[#070c26]/60 to-transparent" />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/30 transition z-20"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/30 transition z-20"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        {/* Bottom gallery bar */}
        <div className="absolute bottom-8 left-12 right-12 z-20 flex items-end justify-between max-w-[1400px] mx-auto">
          <h1 className="text-2xl text-white font-semibold">{yacht.name}</h1>

          {/* Avatar-style circular thumbnails */}
          <button
            onClick={() => openGallery(0)}
            className="group/gallery flex flex-col items-end gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold tracking-wide">{t("yacht.gallery", "Gallery")}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#0055a9] to-[#00a4e4] text-white shadow-lg shadow-blue-500/25">
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
      <section className="w-full bg-white py-12 px-6 md:px-10 relative" style={{ color: "#070c26" }}>
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col">
            <h1 className="text-3xl font-bold mb-2">{yacht.modelName || yacht.name}</h1>
            {yachtLocation && (
              <div className="flex items-center gap-2 text-gray-500 mb-8">
                <MapPin className="w-5 h-5 text-[#84776e]" />
                <span className="text-[15px] font-medium">{yachtLocation}</span>
              </div>
            )}

            {/* Quick specs bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-6 border-b border-gray-200 mb-6">
              {yacht.loa && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">{tUpper("yacht.stat.length", "Length")}</span>
                    <span className="text-sm font-semibold">{yacht.loa}m</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yacht.cabins && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">{tUpper("yacht.stat.cabins", "Cabins")}</span>
                    <span className="text-sm font-semibold">{yacht.cabins}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yacht.maxPersons && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">{tUpper("yacht.stat.guests", "Guests")}</span>
                    <span className="text-sm font-semibold">{yacht.maxPersons}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yacht.buildYear && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">{tUpper("yacht.stat.year", "Year")}</span>
                    <span className="text-sm font-semibold">{yacht.buildYear}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yacht.builder && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">{tUpper("yacht.stat.builder", "Builder")}</span>
                    <span className="text-sm font-semibold">{yacht.builder}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yachtCategory && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">{tUpper("yacht.stat.hullType", "Hull Type")}</span>
                  <span className="text-sm font-semibold">{yachtCategory}</span>
                </div>
              )}
            </div>

            {/* About */}
            {(yachtDescription || yachtNote) && (
              <>
                <h2 className="text-sm font-bold mb-2">{t("yacht.aboutHeading", "About this Yacht")}</h2>
                <div className="prose max-w-none text-gray-600 leading-relaxed mb-6 text-xs">
                  {yachtDescription && (
                    <p className="mb-3 whitespace-pre-line">{yachtDescription}</p>
                  )}
                  {yachtNote && (
                    <p className="whitespace-pre-line">{yachtNote}</p>
                  )}
                </div>
              </>
            )}

            {/* Full Specifications */}
            {specs.length > 0 && (
              <>
                <h2 className="text-sm font-bold mb-3">{t("yacht.fullSpecsHeading", "Full Specifications")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-1 mb-8">
                  {specs.map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 text-xs">{s.label}</span>
                      <span className="font-medium text-right text-xs">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Quick Equipment & Amenities */}
            {quickAmenities.length > 0 && (
              <>
                <h2 className="text-sm font-bold mb-3">{t("yacht.equipmentHeading", "Equipment & Amenities")}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-4">
                  {quickAmenities.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {getAmenityIcon(item)}
                      <span className="text-xs font-medium text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Column - Booking Planner */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 z-40" id="booking">
            <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-gray-100/80">
              {/* Premium header */}
              <div className="relative px-5 pt-5 pb-4 rounded-t-2xl" style={{ background: "linear-gradient(135deg, #070c26 0%, #0055a9 100%)" }}>
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
                    <div className="w-5 h-5 rounded-full bg-[#0055a9] flex items-center justify-center text-white text-[9px] font-bold shrink-0">1</div>
                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">{tUpper("yacht.selectDates", "Select Dates")}</span>
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
                    className="w-full border border-gray-200 rounded-xl p-3 hover:border-gray-300 transition cursor-pointer flex items-center justify-between bg-gray-50/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <CalendarDays className="w-4 h-4 text-[#0055a9] shrink-0" />
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="text-left">
                          <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5 tracking-wide">{tUpper("yacht.checkIn", "Check-in")}</span>
                          <span className="text-xs font-semibold" style={{ color: dateRange?.from ? "#070c26" : "#aaa" }}>
                            {dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : t("yacht.selectDate", "Select date")}
                          </span>
                        </div>
                        <div className="text-left border-l border-gray-200 pl-3">
                          <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5 tracking-wide">{tUpper("yacht.checkOut", "Check-out")}</span>
                          <span className="text-xs font-semibold" style={{ color: dateRange?.to ? "#070c26" : "#aaa" }}>
                            {dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : t("yacht.selectDate", "Select date")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showCalendar ? "rotate-180" : ""}`} />
                  </button>

                  {/* Calendar dropdown */}
                  {showCalendar && (
                    <div
                      ref={calendarRef}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[200] bg-white rounded-2xl shadow-2xl border border-gray-200 p-5"
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
                      <div className="flex items-center justify-center gap-5 pt-3 mt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0055a9]" />
                          <span className="text-[10px] text-gray-500 font-medium">{t("yacht.selected", "Selected")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <span className="text-[10px] text-gray-500 font-medium">{t("yacht.unavailable", "Unavailable")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Guests */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#0055a9] flex items-center justify-center text-white text-[9px] font-bold shrink-0">2</div>
                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">{tUpper("yacht.partySize", "Party Size")}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50/50 rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#84776e]" />
                      <span className="text-xs font-medium text-gray-700">{guestCount} guest{guestCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-500 hover:bg-white hover:border-gray-300 transition cursor-pointer"
                      >-</button>
                      <span className="text-sm font-bold w-5 text-center" style={{ color: "#070c26" }}>{guestCount}</span>
                      <button
                        onClick={() => setGuestCount(Math.min(yacht.maxPersons || 20, guestCount + 1))}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-500 hover:bg-white hover:border-gray-300 transition cursor-pointer"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Price estimate */}
                {selectedDatePrice && (
                  <div className="rounded-xl p-4 border border-[#0055a9]/15" style={{ background: "linear-gradient(135deg, rgba(0,85,169,0.04) 0%, rgba(7,12,38,0.03) 100%)" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">{formatPrice(selectedDatePrice.perWeek, selectedDatePrice.currency)} x {selectedDatePrice.days} days</span>
                      <span className="text-xs font-semibold" style={{ color: "#070c26" }}>{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#0055a9]/10">
                      <span className="text-xs font-bold" style={{ color: "#070c26" }}>{t("yacht.estimatedTotal", "Estimated Total")}</span>
                      <span className="text-base font-bold" style={{ color: "#0055a9" }}>{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1.5">{t("yacht.priceDisclaimer", "Excl. VAT & APA. Final price confirmed in proposal.")}</p>
                  </div>
                )}

                {/* Booking CTA */}
                <button
                  onClick={() => { setBookingSuccess(false); setBookingOpen(true) }}
                  disabled={!checkIn || !checkOut || checkIn === checkOut}
                  className="w-full text-white py-3.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-[#0055a9]/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #0055a9 0%, #003d7a 100%)" }}
                >
                  <Send className="w-3.5 h-3.5" />
                  {checkIn && checkOut && checkIn !== checkOut ? t("yacht.requestBooking", "Request This Booking") : t("yacht.selectDatesToContinue", "Select dates to continue")}
                </button>

                <p className="text-center text-[10px] text-gray-400">You won&apos;t be charged &middot; Free cancellation</p>

                {/* Staff advisor */}
                {yacht.staffRep && (
                  <div className="flex items-center gap-2.5 pt-4 mt-2 border-t border-gray-100">
                    {yacht.staffRep.image ? (
                      <Image src={yacht.staffRep.image} alt={yacht.staffRep.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-gray-100" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#070c26] flex items-center justify-center text-white text-[9px] font-bold shrink-0">IYC</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-gray-800 truncate">{yacht.staffRep.name}</p>
                      <p className="text-[9px] text-gray-400">{staffPosition || t("yacht.charterAdvisor", "Charter Advisor")}</p>
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

      {/* Equipment & Features Tabs */}
      {categoryTabs.length > 0 && (
        <section className="w-full bg-white py-12 px-6 md:px-10 relative z-[1] border-t border-gray-200" style={{ color: "#070c26" }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold">{t("yacht.equipmentFeaturesHeading", "Equipment & Features")}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-white px-2 py-1 rounded" style={{ backgroundColor: "#070c26" }}>{categoryTabs.length}</span>
                <span>categories</span>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={activeTab === tab.id ? { backgroundColor: "#070c26" } : undefined}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Active Tab Content */}
            {currentTab && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {currentTab.items.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${currentTab.theme.bg} ${currentTab.theme.border}`}
                  >
                    <Check className={`w-4 h-4 ${currentTab.theme.text}`} />
                    <span className="text-xs font-medium">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Services */}
            {yacht.services.length > 0 && (
              <div className="mt-10 border-t border-gray-200 pt-8 pb-[100px]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">{t("yacht.availableServices", "Available Services")}</h2>
                  <span className="text-xs text-gray-500">{t("yacht.optionalAddons", "Optional add-ons for your charter")}</span>
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
                            : "border-2 border-gray-200 text-gray-600 hover:border-[#84776e] hover:text-[#84776e] transition cursor-pointer"
                        }`}
                        style={isObligatory ? { backgroundColor: i < 3 ? "#070c26" : "#84776e" } : undefined}
                      >
                        {!isObligatory && service.price > 0 && (
                          <span
                            className="absolute -top-2 -right-2 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: "#070c26" }}
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

      {/* Seasonal Pricing — Card Grid */}
      {weeklyPrices.length > 0 && (
        <section className="relative w-full px-6 md:px-10 overflow-hidden" style={{ backgroundColor: "#070c26", paddingTop: 150, paddingBottom: 150 }}>
          {/* Background SVG */}
          <div
            className="absolute inset-0 pointer-events-none select-none overflow-hidden"
            aria-hidden
            style={{ backgroundImage: "url(https://iycweb.b-cdn.net/1774937080534-bg.svg)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.2 }}
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
                        background: activeYear === y ? "#8C7D70" : "rgba(255,255,255,0.1)",
                        color: activeYear === y ? "#fff" : "rgba(255,255,255,0.5)",
                        border: activeYear === y ? "none" : "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      Season {y}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight mb-1" style={{ color: "#fff" }}>{yacht.name}</p>
                  <h2 className="text-sm font-semibold whitespace-nowrap" style={{ color: "#8C7D70" }}>
                    Weekly Rates
                  </h2>
                  <div className="w-10 h-[3px] rounded-full mt-3" style={{ background: "#8C7D70" }} />
                </div>
                <Link
                  href="#booking"
                  className="inline-flex items-center gap-2 hover:opacity-90 transition duration-300 px-4 py-2 rounded-lg text-xs font-semibold self-start"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  Show Details
                </Link>
              </div>

              {/* Center: Price cards grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {pricesForYear.map((price, i) => {
                  const from = new Date(price.dateFrom)
                  return (
                    <div
                      key={i}
                      className="px-5 py-4 flex flex-col gap-2 transition hover:opacity-90"
                      style={{ background: "#070c26", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 18 }}
                    >
                      <span className="text-white/70 text-sm font-medium">{MONTH_NAMES[from.getMonth()]}</span>
                      <span className="text-white text-xl font-bold tracking-tight">
                        {formatPrice(price.price, price.currency)}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-md self-start mt-1"
                        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
                      >
                        Per Week+ VAT & APA
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Right: Enquire CTA */}
              <div
                className="hidden lg:flex flex-col gap-4 rounded-xl p-5 shrink-0 w-[260px]"
                style={{ background: "#0055a9" }}
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

      {/* Booking Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBookingOpen(false)} />
          <div className="relative z-[110] bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">

            {bookingSuccess ? (
              /* Success */
              <div className="relative overflow-hidden">
                <div className="relative px-8 pt-10 pb-8 text-center" style={{ background: "linear-gradient(135deg, #070c26 0%, #0055a9 60%, #0077cc 100%)" }}>
                  <button onClick={() => setBookingOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/20">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ color: "#ffffff" }}>
                      {bookingForm.firstName ? `${t("yacht.excellentChoice", "Excellent Choice")}, ${bookingForm.firstName}!` : t("yacht.excellentChoiceAlt", "Excellent Choice!")}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto">
                      Your booking request for <span className="text-white font-semibold">{yacht.name}</span> has been received.
                    </p>
                  </div>
                </div>

                <div className="px-8 -mt-4 relative z-10">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
                    {/* Booking summary */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                      <div className="text-center flex-1">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">{tUpper("yacht.checkIn", "Check-in")}</span>
                        <span className="text-xs font-bold" style={{ color: "#070c26" }}>{dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : "—"}</span>
                      </div>
                      <div className="w-8 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                      <div className="text-center flex-1">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">{tUpper("yacht.checkOut", "Check-out")}</span>
                        <span className="text-xs font-bold" style={{ color: "#070c26" }}>{dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : "—"}</span>
                      </div>
                      <div className="text-center flex-1 border-l border-gray-100 pl-3">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">{tUpper("yacht.stat.guests", "Guests")}</span>
                        <span className="text-xs font-bold" style={{ color: "#070c26" }}>{guestCount}</span>
                      </div>
                    </div>

                    {selectedDatePrice && (
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                        <span className="text-xs text-gray-500">{t("yacht.estimatedTotal", "Estimated Total")}</span>
                        <span className="text-base font-bold" style={{ color: "#0055a9" }}>{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                      </div>
                    )}

                    {/* Staff advisor */}
                    {yacht.staffRep && (
                      <div className="flex items-center gap-3">
                        {yacht.staffRep.image ? (
                          <Image src={yacht.staffRep.image} alt={yacht.staffRep.name} width={44} height={44} className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-gray-100" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#070c26] flex items-center justify-center text-white text-xs font-bold shrink-0">IYC</div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-800">{yacht.staffRep.name}</p>
                          <p className="text-[10px] text-gray-400">{staffPosition || t("yacht.charterAdvisor", "Charter Advisor")}</p>
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
                  <button onClick={() => setBookingOpen(false)} className="px-8 py-3 rounded-xl text-xs font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#0055a9]/20 active:scale-[0.98] cursor-pointer" style={{ background: "linear-gradient(135deg, #0055a9 0%, #003d7a 100%)" }}>
                    Continue Browsing
                  </button>
                  <p className="text-[10px] text-gray-400 mt-3">A confirmation email has been sent to {bookingForm.email || "your inbox"}</p>
                </div>
              </div>
            ) : (
              /* Booking form */
              <>
                <div className="relative px-6 pt-6 pb-4 rounded-t-2xl" style={{ background: "linear-gradient(135deg, #070c26 0%, #0055a9 100%)" }}>
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
                      <h2 className="text-base font-bold text-white">{t("yacht.confirmBooking", "Confirm Your Booking")}</h2>
                      <p className="text-[11px] text-white/60 mt-0.5">{yacht.name}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  {/* Booking summary card */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center flex-1">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">{tUpper("yacht.checkIn", "Check-in")}</span>
                        <span className="text-xs font-bold" style={{ color: "#070c26" }}>{dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : "—"}</span>
                      </div>
                      <div className="w-6 flex items-center justify-center">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                      <div className="text-center flex-1">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">{tUpper("yacht.checkOut", "Check-out")}</span>
                        <span className="text-xs font-bold" style={{ color: "#070c26" }}>{dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : "—"}</span>
                      </div>
                      <div className="text-center flex-1 border-l border-gray-200 pl-3">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">{tUpper("yacht.stat.guests", "Guests")}</span>
                        <span className="text-xs font-bold" style={{ color: "#070c26" }}>{guestCount}</span>
                      </div>
                    </div>
                    {selectedDatePrice && (
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="text-xs font-bold text-gray-500">{t("yacht.estimatedTotal", "Estimated Total")}</span>
                        <span className="text-base font-bold" style={{ color: "#0055a9" }}>{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                      </div>
                    )}
                    <p className="text-[9px] text-gray-400 mt-1.5">{t("yacht.priceDisclaimer", "Excl. VAT & APA. Final price confirmed in proposal.")}</p>
                  </div>

                  {/* Contact fields */}
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-[#0055a9]" />
                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">{tUpper("yacht.yourDetails", "Your Details")}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.firstName", "First Name")} *</label>
                        <input type="text" value={bookingForm.firstName} onChange={(e) => setBookingForm({ ...bookingForm, firstName: e.target.value })} placeholder="John" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition bg-gray-50/50" style={{ color: "#070c26" }} />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.lastName", "Last Name")}</label>
                        <input type="text" value={bookingForm.lastName} onChange={(e) => setBookingForm({ ...bookingForm, lastName: e.target.value })} placeholder="Doe" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition bg-gray-50/50" style={{ color: "#070c26" }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.email", "Email")} *</label>
                      <input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} placeholder="john@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition bg-gray-50/50" style={{ color: "#070c26" }} />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.phone", "Phone")}</label>
                      <input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} placeholder="+30 123 456 7890" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition bg-gray-50/50" style={{ color: "#070c26" }} />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.specialRequests", "Special Requests")}</label>
                      <textarea value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} placeholder="Celebrations, dietary needs, preferred destinations..." rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition resize-none bg-gray-50/50" style={{ color: "#070c26" }} />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitBooking}
                    disabled={!bookingForm.firstName || !bookingForm.email || bookingSubmitting}
                    className="w-full text-white py-3.5 rounded-xl text-xs font-bold transition-all duration-300 mt-5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-[#0055a9]/20 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #0055a9 0%, #003d7a 100%)" }}
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
                  <p className="text-center text-[10px] text-gray-400 mt-2.5">No payment required &middot; Free cancellation</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating phone button */}
      <div className="fixed right-6 bottom-6 z-50">
        <button className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition" style={{ backgroundColor: "#8C7D70" }}>
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
                <div className="relative px-8 pt-10 pb-8 text-center" style={{ background: "linear-gradient(135deg, #070c26 0%, #0055a9 60%, #0077cc 100%)" }}>
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

                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      {enquiryForm.firstName ? `Thank You, ${enquiryForm.firstName}!` : "Thank You!"}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto">
                      Your personalized charter proposal for <span className="text-white font-semibold">{yacht.name}</span> is being prepared.
                    </p>
                  </div>
                </div>

                {/* Details card */}
                <div className="px-8 -mt-4 relative z-10">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
                    {/* Staff advisor */}
                    {yacht.staffRep && (
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                        {yacht.staffRep.image ? (
                          <Image src={yacht.staffRep.image} alt={yacht.staffRep.name} width={44} height={44} className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-gray-100" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#070c26] flex items-center justify-center text-white text-xs font-bold shrink-0">IYC</div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-800">{yacht.staffRep.name}</p>
                          <p className="text-[10px] text-gray-400">{staffPosition || t("yacht.charterAdvisor", "Charter Advisor")}</p>
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
                        <div className="w-6 h-6 rounded-full bg-[#0055a9]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Mail className="w-3 h-3 text-[#0055a9]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{t("yacht.confirmationSent", "Confirmation sent")}</p>
                          <p className="text-[10px] text-gray-400">Check your inbox at {enquiryForm.email || "your email"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#0055a9]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <CalendarDays className="w-3 h-3 text-[#0055a9]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">Tailored proposal within 24h</p>
                          <p className="text-[10px] text-gray-400">
                            {selectedMonths.length > 0
                              ? `Availability & pricing for ${selectedMonths.map((m) => { const [y, mo] = m.split("-"); return `${MONTH_NAMES[parseInt(mo) - 1]} ${y}` }).join(", ")}`
                              : "Best available dates and pricing options"
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#0055a9]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Anchor className="w-3 h-3 text-[#0055a9]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{t("yacht.itinerarySuggestions", "Itinerary suggestions included")}</p>
                          <p className="text-[10px] text-gray-400">Routes curated for {enquiryGuestCount} guest{enquiryGuestCount !== 1 ? "s" : ""} aboard {yacht.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="px-8 pt-5 pb-8 text-center">
                  <button
                    onClick={() => setEnquiryOpen(false)}
                    className="px-8 py-3 rounded-xl text-xs font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#0055a9]/20 active:scale-[0.98] cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #0055a9 0%, #003d7a 100%)" }}
                  >
                    Continue Browsing
                  </button>
                  <p className="text-[10px] text-gray-400 mt-3">
                    Have questions? Call us at <span className="font-semibold text-gray-500">+30 210 XXX XXXX</span>
                  </p>
                </div>
              </div>
            ) : (
              /* Form */
              <>
                {/* Modal header with gradient */}
                <div className="relative px-6 pt-6 pb-4" style={{ background: "linear-gradient(135deg, #070c26 0%, #0055a9 100%)" }}>
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
                      <h2 className="text-base font-bold text-white">{t("yacht.planYourCharter", "Plan Your Charter")}</h2>
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
                      <CalendarDays className="w-4 h-4 text-[#0055a9]" />
                      <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">{tUpper("yacht.preferredPeriod", "Preferred Period")}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                      {(() => {
                        const byYear: Record<number, string[]> = {}
                        for (const m of availableMonths) {
                          const y = parseInt(m.split("-")[0])
                          if (!byYear[y]) byYear[y] = []
                          byYear[y].push(m)
                        }
                        return Object.entries(byYear).map(([year, months]) => (
                          <div key={year} className="mb-2 last:mb-0">
                            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 block">{year}</span>
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
                                        : "border-gray-200 text-gray-500 hover:border-[#0055a9]/40 hover:text-[#0055a9] hover:bg-[#0055a9]/5"
                                    }`}
                                    style={selected ? { backgroundColor: "#0055a9" } : undefined}
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
                        <p className="text-[10px] text-gray-400 italic">No availability data yet</p>
                      )}

                      {/* Guests inline */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{tUpper("yacht.stat.guests", "Guests")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-6 h-6 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500 hover:bg-white hover:border-gray-300 transition cursor-pointer">-</button>
                          <span className="text-xs font-bold w-4 text-center" style={{ color: "#070c26" }}>{guestCount}</span>
                          <button type="button" onClick={() => setGuestCount(Math.min(yacht.maxPersons || 20, guestCount + 1))} className="w-6 h-6 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500 hover:bg-white hover:border-gray-300 transition cursor-pointer">+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact fields */}
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-[#0055a9]" />
                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">{tUpper("yacht.yourDetails", "Your Details")}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.firstName", "First Name")} *</label>
                        <input
                          type="text"
                          value={enquiryForm.firstName}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, firstName: e.target.value })}
                          placeholder="John"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition bg-gray-50/50"
                          style={{ color: "#070c26" }}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.lastName", "Last Name")}</label>
                        <input
                          type="text"
                          value={enquiryForm.lastName}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, lastName: e.target.value })}
                          placeholder="Doe"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition bg-gray-50/50"
                          style={{ color: "#070c26" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.email", "Email")} *</label>
                      <input
                        type="email"
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition bg-gray-50/50"
                        style={{ color: "#070c26" }}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.phone", "Phone")}</label>
                      <input
                        type="tel"
                        value={enquiryForm.phone}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                        placeholder="+30 123 456 7890"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition bg-gray-50/50"
                        style={{ color: "#070c26" }}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{tUpper("yacht.specialRequests", "Special Requests")}</label>
                      <textarea
                        value={enquiryForm.notes}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                        placeholder="Celebrations, dietary needs, preferred destinations..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] focus:ring-1 focus:ring-[#0055a9]/20 transition resize-none bg-gray-50/50"
                        style={{ color: "#070c26" }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitEnquiry}
                    disabled={!enquiryForm.firstName || !enquiryForm.email || enquirySubmitting}
                    className="w-full text-white py-3.5 rounded-xl text-xs font-bold transition-all duration-300 mt-5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-[#0055a9]/20 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #0055a9 0%, #003d7a 100%)" }}
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
                  <p className="text-center text-[10px] text-gray-400 mt-2.5">
                    No commitment &middot; Free personalized proposal
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
