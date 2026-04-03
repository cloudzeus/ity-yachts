"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { DayPicker, type DateRange } from "react-day-picker"
import { format, isWithinInterval, eachDayOfInterval, isBefore, startOfDay } from "date-fns"
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

interface YachtData {
  id: number
  name: string
  modelName: string
  category: string
  images: string[]
  location: string
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
  note: string
  equipmentByCategory: Record<string, { categoryName: string; items: string[] }>
  services: Array<{ name: string; price: number; currency: string; obligatory: boolean }>
  prices: Array<{ dateFrom: string; dateTo: string; price: number; currency: string; priceType: string }>
  mastLength: number | null
  propulsionType: string | null
  staffRep: { name: string; position: string; image: string } | null
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
  const [currentImage, setCurrentImage] = useState(0)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState(2)
  const [showGuestDropdown, setShowGuestDropdown] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteResult, setQuoteResult] = useState<{ available: boolean; price?: number; currency?: string } | null>(null)

  const [showCalendar, setShowCalendar] = useState(false)
  const checkIn = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""
  const checkOut = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : ""

  // Compute available date ranges from pricing periods
  const { availableDays, unavailableMatcher, firstAvailableMonth } = useMemo(() => {
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
    // Find earliest available date to set default month
    const sortedPrices = yacht.prices
      .filter((p) => p.priceType === "WEEKLY" && !isBefore(startOfDay(new Date(p.dateTo)), today))
      .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
    const firstDate = sortedPrices.length > 0
      ? (() => { const d = startOfDay(new Date(sortedPrices[0].dateFrom)); return isBefore(d, today) ? today : d })()
      : today
    return { availableDays: allAvailable, unavailableMatcher: matcher, firstAvailableMonth: firstDate }
  }, [yacht.prices])
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryTransition, setGalleryTransition] = useState(false)
  const [galleryDirection, setGalleryDirection] = useState<"left" | "right">("right")
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [enquiryForm, setEnquiryForm] = useState({ firstName: "", lastName: "", email: "", phone: "", notes: "" })
  const [enquirySubmitting, setEnquirySubmitting] = useState(false)
  const [enquirySuccess, setEnquirySuccess] = useState(false)
  const enquiryRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Close calendar on click outside
  useEffect(() => {
    if (!showCalendar) return
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showCalendar])

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
      name: data.categoryName,
      items: data.items,
      theme: THEME_LIST[i % THEME_LIST.length],
    }))
  }, [yacht.equipmentByCategory])

  // Set initial active tab
  const initialTab = categoryTabs.length > 0 ? categoryTabs[0].id : null
  if (activeTab === null && initialTab) {
    setActiveTab(initialTab)
  }

  const currentTab = categoryTabs.find((t) => t.id === activeTab)

  // Build specs list
  const specs: Array<{ label: string; value: string }> = []
  if (yacht.category) specs.push({ label: "Yacht Type", value: yacht.category })
  if (yacht.loa) specs.push({ label: "Length", value: `${yacht.loa.toFixed(2)} Meters` })
  if (yacht.beam) specs.push({ label: "Beam", value: `${yacht.beam.toFixed(2)} Meters` })
  if (yacht.draft) specs.push({ label: "Draft", value: `${yacht.draft.toFixed(2)} Meters` })
  if (yacht.engineBuilder || yacht.enginePower) {
    const engineStr = [yacht.engineBuilder, yacht.enginePower ? `${yacht.enginePower}HP` : ""].filter(Boolean).join(" ")
    specs.push({ label: "Engine", value: engineStr })
  }
  if (yacht.fuelType || yacht.fuelTank) {
    const fuelStr = [yacht.fuelType, yacht.fuelTank ? `${yacht.fuelTank}L` : ""].filter(Boolean).join(", ")
    specs.push({ label: "Fuel", value: fuelStr })
  }
  if (yacht.waterTank) specs.push({ label: "Water Tank", value: `${yacht.waterTank} Liters` })
  if (yacht.fuelConsumption) specs.push({ label: "Fuel Consumption", value: `${yacht.fuelConsumption}L/hour` })
  if (yacht.buildYear) specs.push({ label: "Year Built", value: String(yacht.buildYear) })
  if (yacht.renewed) specs.push({ label: "Renewed", value: String(yacht.renewed) })
  if (yacht.cruisingSpeed) specs.push({ label: "Cruising Speed", value: `${yacht.cruisingSpeed} knots` })
  if (yacht.maxSpeed) specs.push({ label: "Max Speed", value: `${yacht.maxSpeed} knots` })
  if (yacht.berthsTotal) specs.push({ label: "Berths", value: `${yacht.berthsTotal}${yacht.cabins ? ` (${yacht.cabins} Cabins)` : ""}` })
  if (yacht.wc) specs.push({ label: "Toilets", value: String(yacht.wc) })
  if (yacht.showers) specs.push({ label: "Showers", value: String(yacht.showers) })
  if (yacht.mastLength) specs.push({ label: "Mast Length", value: `${yacht.mastLength}m` })
  if (yacht.propulsionType) specs.push({ label: "Propulsion", value: yacht.propulsionType })
  if (yacht.builder) specs.push({ label: "Builder", value: yacht.builder })

  // Quick amenities from all equipment (first 13)
  const allEquipmentItems = categoryTabs.flatMap((t) => t.items)
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

  // Auto-check availability when dates change
  useEffect(() => {
    if (!checkIn || !checkOut) return
    setQuoteLoading(true)
    setQuoteResult(null)
    const controller = new AbortController()
    fetch(`/api/fleet/${yacht.id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setQuoteResult(data))
      .catch((err) => { if (err.name !== "AbortError") setQuoteResult({ available: false }) })
      .finally(() => setQuoteLoading(false))
    return () => controller.abort()
  }, [checkIn, checkOut, yacht.id])

  // Enquiry modal escape key + body lock
  useEffect(() => {
    if (!enquiryOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setEnquiryOpen(false) }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKey)
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKey) }
  }, [enquiryOpen])

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
          checkIn,
          checkOut,
          guests: guestCount,
          estimatedPrice: selectedDatePrice?.total || null,
          currency: selectedDatePrice?.currency || "EUR",
        }),
      })
      setEnquirySuccess(true)
    } catch {
      // silent fail - form stays open
    } finally {
      setEnquirySubmitting(false)
    }
  }

  // Compute price for selected dates from local price data
  const selectedDatePrice = useMemo(() => {
    if (!checkIn || !checkOut) return null
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
              <span className="text-white text-sm font-bold tracking-wide">Gallery</span>
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
            {yacht.location && (
              <div className="flex items-center gap-2 text-gray-500 mb-8">
                <MapPin className="w-5 h-5 text-[#84776e]" />
                <span className="text-[15px] font-medium">{yacht.location}</span>
              </div>
            )}

            {/* Quick specs bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-6 border-b border-gray-200 mb-6">
              {yacht.loa && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Length</span>
                    <span className="text-sm font-semibold">{yacht.loa}m</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yacht.cabins && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Cabins</span>
                    <span className="text-sm font-semibold">{yacht.cabins}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yacht.maxPersons && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Guests</span>
                    <span className="text-sm font-semibold">{yacht.maxPersons}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yacht.buildYear && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Year</span>
                    <span className="text-sm font-semibold">{yacht.buildYear}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yacht.builder && (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Builder</span>
                    <span className="text-sm font-semibold">{yacht.builder}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              {yacht.category && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Hull Type</span>
                  <span className="text-sm font-semibold">{yacht.category}</span>
                </div>
              )}
            </div>

            {/* About */}
            {(yacht.description || yacht.note) && (
              <>
                <h2 className="text-sm font-bold mb-2">About this Yacht</h2>
                <div className="prose max-w-none text-gray-600 leading-relaxed mb-6 text-xs">
                  {yacht.description && (
                    <p className="mb-3 whitespace-pre-line">{yacht.description}</p>
                  )}
                  {yacht.note && (
                    <p className="whitespace-pre-line">{yacht.note}</p>
                  )}
                </div>
              </>
            )}

            {/* Full Specifications */}
            {specs.length > 0 && (
              <>
                <h2 className="text-sm font-bold mb-3">Full Specifications</h2>
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
                <h2 className="text-sm font-bold mb-3">Equipment & Amenities</h2>
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
            <div className="bg-white rounded-xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-gray-100">
              {/* Price header */}
              <div className="flex flex-col mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[#84776e] text-xs font-medium">From</span>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold tracking-tight" style={{ color: "#070c26" }}>
                        {cheapestPrice ? formatPrice(cheapestPrice, "EUR") : "On Request"}
                      </span>
                      {cheapestPrice && (
                        <span className="text-gray-500 text-sm font-medium mb-0.5">/ week</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date range picker */}
              <div className="flex flex-col gap-3">
                {/* Date selector button */}
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 hover:border-gray-400 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <CalendarDays className="w-4 h-4 text-[#84776e] shrink-0" />
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div className="text-left">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Check-in</span>
                        <span className="text-xs font-semibold" style={{ color: dateRange?.from ? "#070c26" : "#aaa" }}>
                          {dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : "Select"}
                        </span>
                      </div>
                      <div className="text-left border-l border-gray-200 pl-3">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Check-out</span>
                        <span className="text-xs font-semibold" style={{ color: dateRange?.to ? "#070c26" : "#aaa" }}>
                          {dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : "Select"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showCalendar ? "rotate-180" : ""}`} />
                </button>

                {/* Calendar overlay - 2 months side by side, opens left over content */}
                {showCalendar && (
                  <div
                    ref={calendarRef}
                    className="absolute right-0 mt-2 z-[70] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ width: "min(680px, 90vw)" }}
                  >
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range)
                          setQuoteResult(null)
                          // Only close when a true range is selected (different from/to dates)
                          if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
                            setShowCalendar(false)
                          }
                        }}
                        disabled={unavailableMatcher}
                        numberOfMonths={2}
                        defaultMonth={firstAvailableMonth}
                        showOutsideDays={false}
                        classNames={{
                          root: "w-full",
                          months: "flex gap-6",
                          month: "flex-1 relative",
                          month_caption: "flex items-center justify-center h-8 mb-3",
                          caption_label: "text-sm font-bold text-[#070c26]",
                          nav: "absolute inset-x-0 top-0 flex justify-between z-10",
                          button_previous: "w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition cursor-pointer",
                          button_next: "w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition cursor-pointer",
                          month_grid: "w-full border-collapse",
                          weekdays: "flex",
                          weekday: "w-full text-[10px] font-bold text-gray-400 uppercase text-center py-1",
                          week: "flex w-full",
                          day: "w-full aspect-square text-center text-xs p-0.5 relative [&:has([aria-selected])]:bg-[#0055a9]/10 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg",
                          day_button: "w-full h-full flex items-center justify-center text-xs font-medium rounded-lg transition-colors hover:bg-[#0055a9]/10 cursor-pointer aria-selected:opacity-100",
                          selected: "bg-[#0055a9] text-white hover:bg-[#0055a9] rounded-lg font-bold",
                          range_start: "bg-[#0055a9] text-white rounded-l-lg rounded-r-none font-bold",
                          range_end: "bg-[#0055a9] text-white rounded-r-lg rounded-l-none font-bold",
                          range_middle: "bg-[#0055a9]/10 text-[#070c26] rounded-none",
                          today: "font-bold text-[#0055a9]",
                          outside: "text-gray-300 opacity-50",
                          disabled: "text-red-300 line-through opacity-60 cursor-not-allowed hover:bg-transparent",
                          hidden: "invisible",
                          chevron: "fill-gray-500 w-4 h-4",
                        }}
                      />
                      {/* Legend */}
                      <div className="flex items-center justify-center gap-5 pt-4 mt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0055a9]" />
                          <span className="text-[10px] text-gray-500 font-medium">Selected</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                          <span className="text-[10px] text-gray-500 font-medium">Unavailable</span>
                        </div>
                      </div>
                  </div>
                )}

                {/* Guests */}
                <div
                  className="border border-gray-300 rounded-lg p-2.5 hover:border-gray-400 transition cursor-pointer relative flex justify-between items-center"
                  onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                >
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Guests</label>
                    <div className="text-xs font-medium" style={{ color: "#070c26" }}>
                      {guestCount} guest{guestCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                  {showGuestDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Guests</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setGuestCount(Math.max(1, guestCount - 1)) }}
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold w-4 text-center">{guestCount}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setGuestCount(Math.min(yacht.maxPersons || 20, guestCount + 1))
                            }}
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price estimate */}
                {selectedDatePrice && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-500">{formatPrice(selectedDatePrice.perWeek, selectedDatePrice.currency)} × {selectedDatePrice.days} days</span>
                      <span className="text-xs font-semibold">{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
                      <span className="text-xs font-bold">Estimated Total</span>
                      <span className="text-sm font-bold" style={{ color: "#070c26" }}>{formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1">Excl. VAT & APA. Final price on request.</p>
                  </div>
                )}

                {/* Availability status */}
                {quoteLoading && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#0055a9]/30 border-t-[#0055a9] rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">Checking availability...</span>
                  </div>
                )}

                {quoteResult && !quoteLoading && (
                  <div className={`rounded-lg p-3 border text-xs ${
                    quoteResult.available
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                    {quoteResult.available ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span className="font-semibold">Available for these dates!</span>
                      </div>
                    ) : (
                      <span className="font-semibold">Not available for these dates. Try different dates.</span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setEnquirySuccess(false); setEnquiryOpen(true) }}
                  disabled={!checkIn || !checkOut}
                  className="w-full text-white py-3 rounded-lg text-xs font-bold hover:opacity-90 transition duration-300 mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: "#0055a9" }}
                >
                  <Send className="w-3.5 h-3.5" />
                  Get Quote
                </button>
                <p className="text-center text-[10px] text-gray-500">You won&apos;t be charged yet</p>
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
              <h2 className="text-lg font-bold">Equipment & Features</h2>
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
                  <h2 className="text-lg font-bold">Available Services</h2>
                  <span className="text-xs text-gray-500">Optional add-ons for your charter</span>
                </div>
                <div className="flex flex-wrap gap-2">
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
                        {service.name}
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
                <p className="text-white text-sm font-medium">Would you like to receive a quote for this yacht?</p>
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
                    <span className="text-white/60 text-[10px]">{yacht.staffRep?.position || "Charter Advisor"}</span>
                  </div>
                  <Link
                    href="#booking"
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition hover:bg-white/30"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
                  >
                    Enquire
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEnquiryOpen(false)} />
          <div
            ref={enquiryRef}
            className="relative z-[110] bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-300 overflow-hidden"
          >
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#070c26" }}>Request a Quote</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{yacht.name}</p>
                </div>
                <button
                  onClick={() => setEnquiryOpen(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {enquirySuccess ? (
              /* Success state */
              <div className="px-6 py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#070c26" }}>Quote Request Sent!</h3>
                <p className="text-sm text-gray-500 max-w-xs mb-6">
                  We&apos;ve received your request and sent a confirmation to your email. Our team will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setEnquiryOpen(false)}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: "#0055a9" }}
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form */
              <div className="px-6 py-5">
                {/* Booking summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Check-in</span>
                      <span className="text-xs font-semibold" style={{ color: "#070c26" }}>
                        {checkIn ? new Date(checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Check-out</span>
                      <span className="text-xs font-semibold" style={{ color: "#070c26" }}>
                        {checkOut ? new Date(checkOut).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Guests</span>
                      <span className="text-xs font-semibold" style={{ color: "#070c26" }}>{guestCount}</span>
                    </div>
                  </div>
                  {selectedDatePrice && (
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs font-bold text-gray-500">Estimated Total</span>
                      <span className="text-base font-bold" style={{ color: "#070c26" }}>
                        {formatPrice(selectedDatePrice.total, selectedDatePrice.currency)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">First Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={enquiryForm.firstName}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, firstName: e.target.value })}
                          placeholder="John"
                          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] transition"
                          style={{ color: "#070c26" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={enquiryForm.lastName}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, lastName: e.target.value })}
                        placeholder="Doe"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] transition"
                        style={{ color: "#070c26" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="email"
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] transition"
                        style={{ color: "#070c26" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="tel"
                        value={enquiryForm.phone}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                        placeholder="+30 123 456 7890"
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] transition"
                        style={{ color: "#070c26" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Notes</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                      <textarea
                        value={enquiryForm.notes}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                        placeholder="Any special requests or questions..."
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0055a9] transition resize-none"
                        style={{ color: "#070c26" }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmitEnquiry}
                  disabled={!enquiryForm.firstName || !enquiryForm.email || enquirySubmitting}
                  className="w-full text-white py-3 rounded-lg text-xs font-bold hover:opacity-90 transition duration-300 mt-5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: "#0055a9" }}
                >
                  {enquirySubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Quote Request
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-2">
                  We&apos;ll send a confirmation to your email
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
