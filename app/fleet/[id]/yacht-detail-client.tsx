"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
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

function getAmenityIcon(name: string) {
  const lower = name.toLowerCase()
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return <Check className="w-4 h-4 text-[#84776e]" />
}

export function YachtDetailClient({ yacht }: { yacht: YachtData }) {
  const [currentImage, setCurrentImage] = useState(0)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState(2)
  const [showGuestDropdown, setShowGuestDropdown] = useState(false)
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteResult, setQuoteResult] = useState<{ available: boolean; price?: number; currency?: string } | null>(null)

  const images = yacht.images.length > 0 ? yacht.images : []
  const hasImages = images.length > 0

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

  // Get quote based on selected dates
  const handleGetQuote = async () => {
    if (!checkIn || !checkOut) return
    setQuoteLoading(true)
    setQuoteResult(null)
    try {
      const res = await fetch(`/api/fleet/${yacht.id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`)
      const data = await res.json()
      setQuoteResult(data)
    } catch {
      setQuoteResult({ available: false })
    } finally {
      setQuoteLoading(false)
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
        <div className="absolute bottom-8 left-12 right-12 z-20 flex flex-col gap-4 max-w-[1400px] mx-auto">
          <h1 className="text-2xl text-white">
            <span className="font-semibold">{yacht.name}</span>{" "}
            <span className="font-light text-white/70">Gallery</span>
          </h1>

          <div className="flex items-center gap-2">
            {images.slice(0, 3).map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden border relative group/thumb cursor-pointer ${
                  currentImage === i ? "border-white" : "border-white/20"
                }`}
              >
                <Image
                  src={img}
                  alt={`${yacht.name} ${i + 1}`}
                  fill
                  className={`object-cover transition duration-300 group-hover/thumb:scale-110 ${
                    currentImage !== i ? "opacity-70" : ""
                  }`}
                  sizes="64px"
                />
              </button>
            ))}
            {images.length > 3 && (
              <button className="h-12 px-4 bg-white/90 text-xs font-semibold rounded-lg flex items-center justify-center hover:bg-white transition shadow-lg ml-2" style={{ color: "#070c26" }}>
                +{images.length - 3} Photos
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full bg-white py-12 px-6 md:px-10 relative z-10" style={{ color: "#070c26" }}>
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
          <div className="lg:col-span-4 lg:sticky lg:top-8 z-20" id="booking">
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

              {/* Date pickers */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setCheckIn(e.target.value)
                        setQuoteResult(null)
                        if (checkOut && e.target.value >= checkOut) setCheckOut("")
                      }}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs font-medium focus:outline-none focus:border-[#0055a9] transition"
                      style={{ color: "#070c26" }}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setCheckOut(e.target.value)
                        setQuoteResult(null)
                      }}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs font-medium focus:outline-none focus:border-[#0055a9] transition"
                      style={{ color: "#070c26" }}
                    />
                  </div>
                </div>

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

                {/* Quote result */}
                {quoteResult && (
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
                  onClick={handleGetQuote}
                  disabled={!checkIn || !checkOut || quoteLoading}
                  className="w-full text-white py-3 rounded-lg text-xs font-bold hover:opacity-90 transition duration-300 mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#0055a9" }}
                >
                  {quoteLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check Availability & Get Quote"
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-500">You won&apos;t be charged yet</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment & Features Tabs */}
      {categoryTabs.length > 0 && (
        <section className="w-full bg-white py-12 px-6 md:px-10 relative z-10 border-t border-gray-200" style={{ color: "#070c26" }}>
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
              <div className="mt-10 border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">Available Services</h2>
                  <span className="text-xs text-gray-500">Optional add-ons for your charter</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {yacht.services.map((service, i) => {
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

      {/* Seasonal Pricing */}
      {weeklyPrices.length > 0 && (
        <section className="relative w-full py-16 px-6 md:px-10" style={{ backgroundColor: "#070c26" }}>
          <div className="max-w-[1400px] mx-auto relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-white text-2xl font-bold tracking-tight">Charter Rates</h2>
                  {/* Year toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-white/20">
                    {priceYears.map((y) => (
                      <button
                        key={y}
                        onClick={() => setActiveYear(y)}
                        className={`px-3 py-1 text-[11px] font-semibold transition ${
                          activeYear === y
                            ? "bg-white text-[#070c26]"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-white/50 text-xs">{yacht.name} — Weekly rates per period</p>
              </div>
              <Link
                href="#booking"
                className="bg-white/10 border border-white/20 text-white hover:bg-white hover:text-[#070c26] transition duration-300 px-5 py-2.5 rounded-lg text-xs font-semibold self-start"
              >
                Get a Quote
              </Link>
            </div>

            {/* Pricing Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-white/40">Period</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-white/40">Dates</th>
                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-white/40">Weekly Rate</th>
                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-white/40">Daily Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {pricesForYear.map((price, i) => {
                    const from = new Date(price.dateFrom)
                    const to = new Date(price.dateTo)
                    const isCheapest = price.price === cheapestPrice
                    return (
                      <tr
                        key={i}
                        className={`border-b border-white/5 transition hover:bg-white/5 ${isCheapest ? "bg-white/[0.03]" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">
                              {MONTH_NAMES[from.getMonth()]} — {MONTH_NAMES[to.getMonth()]}
                            </span>
                            {isCheapest && (
                              <span className="text-[8px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                                Best Rate
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/50 text-xs">
                          {formatDate(price.dateFrom)} — {formatDate(price.dateTo)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-white font-bold text-sm">{formatPrice(price.price, price.currency)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-white/50 text-xs">{formatPrice(Math.round(price.price / 7), price.currency)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-white/30 text-[10px] mt-3">All prices are per week, exclusive of VAT and APA (Advance Provisioning Allowance).</p>
          </div>
        </section>
      )}

      {/* Floating phone button */}
      <div className="fixed right-6 bottom-6 z-50">
        <button className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition" style={{ backgroundColor: "#8C7D70" }}>
          <Phone className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
