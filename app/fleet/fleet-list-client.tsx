"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  SlidersHorizontal,
  X,
  Ruler,
  Users,
  DoorOpen,
  Anchor,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sailboat,
  Heart,
  Loader2,
} from "lucide-react"

interface YachtCard {
  id: number
  name: string
  image: string
  category: string
  loa: number
  cabins: number
  berths: number
  baseName: string
  builder: string
  buildYear: number
  priceFrom: number
  charterType: string
}

interface FilterOption {
  id: number
  name: string
}

interface FleetListProps {
  initialYachts: YachtCard[]
  initialTotal: number
  categories: FilterOption[]
  bases: FilterOption[]
  builders: FilterOption[]
}

export function FleetListClient({
  initialYachts,
  initialTotal,
  categories,
  bases,
  builders,
}: FleetListProps) {
  const [yachts, setYachts] = useState<YachtCard[]>(initialYachts)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / 12))
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [baseId, setBaseId] = useState("")
  const [builderId, setBuilderId] = useState("")
  const [cabinsMin, setCabinsMin] = useState("")
  const [guestsMin, setGuestsMin] = useState("")
  const [loaMin, setLoaMin] = useState("")
  const [loaMax, setLoaMax] = useState("")
  const [yearMin, setYearMin] = useState("")
  const [charterType, setCharterType] = useState("")
  const [sortBy, setSortBy] = useState("name")

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const fetchYachts = useCallback(
    async (pageNum: number) => {
      setLoading(true)
      const params = new URLSearchParams()
      params.set("page", String(pageNum))
      params.set("pageSize", "12")
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (categoryId) params.set("categoryId", categoryId)
      if (baseId) params.set("baseId", baseId)
      if (builderId) params.set("builderId", builderId)
      if (cabinsMin) params.set("cabinsMin", cabinsMin)
      if (guestsMin) params.set("guestsMin", guestsMin)
      if (loaMin) params.set("loaMin", loaMin)
      if (loaMax) params.set("loaMax", loaMax)
      if (yearMin) params.set("yearMin", yearMin)
      if (charterType) params.set("charterType", charterType)
      if (sortBy) params.set("sortBy", sortBy)

      try {
        const res = await fetch(`/api/fleet?${params.toString()}`)
        const data = await res.json()

        // Transform the API response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cards: YachtCard[] = (data.yachts || []).map((y: any) => {
          const categoryName = y.category
            ? ((y.category?.name as Record<string, string>)?.en || "Yacht")
            : "Yacht"
          const websiteImgs = y.websiteImages as Array<{ url: string }> | null
          const picturesArr = y.picturesUrl as string[] | null
          const image = websiteImgs?.[0]?.url || y.mainPictureUrl || picturesArr?.[0] || ""
          const locationName = y.base?.location
            ? ((y.base.location.name as Record<string, string>)?.en || "")
            : ""
          return {
            id: y.id,
            name: y.name || y.model?.name || "Yacht",
            image,
            category: categoryName,
            loa: y.loa || 0,
            cabins: y.cabins || 0,
            berths: y.berthsTotal || y.maxPersons || 0,
            baseName: locationName,
            builder: y.builder?.name || y.model?.builder?.name || "",
            buildYear: y.buildYear || 0,
            priceFrom: y.prices?.[0]?.price || 0,
            charterType: y.charterType || "",
          }
        })

        setYachts(cards)
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
        setPage(pageNum)
      } catch {
        // keep current state
      } finally {
        setLoading(false)
      }
    },
    [debouncedSearch, categoryId, baseId, builderId, cabinsMin, guestsMin, loaMin, loaMax, yearMin, charterType, sortBy]
  )

  // Refetch when filters change (skip initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    fetchYachts(1)
  }, [fetchYachts])

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(val)
    }, 400)
  }

  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setCategoryId("")
    setBaseId("")
    setBuilderId("")
    setCabinsMin("")
    setGuestsMin("")
    setLoaMin("")
    setLoaMax("")
    setYearMin("")
    setCharterType("")
    setSortBy("name")
  }

  const hasActiveFilters =
    search || categoryId || baseId || builderId || cabinsMin || guestsMin || loaMin || loaMax || yearMin || charterType

  return (
    <div className="w-full flex flex-col" style={{ color: "#070c26" }}>
      {/* Hero Header */}
      <section
        className="relative w-full pt-40 pb-20 px-6 md:px-12"
        style={{ backgroundColor: "#070c26" }}
      >
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0, 119, 182, 0.15)" }}
            >
              <Sailboat className="w-5 h-5" style={{ color: "#0077B6" }} />
            </div>
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#0077B6" }}
            >
              Our Fleet
            </span>
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Yachts & Catamarans
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-[600px] leading-relaxed">
            Browse our curated fleet of sailing yachts and catamarans available for
            charter in the Greek islands.
          </p>

          {/* Search Bar */}
          <div className="mt-10 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, model, or builder..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/15 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-3 h-3 text-white/60" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium transition border ${
                showFilters
                  ? "bg-white text-[#070c26] border-white"
                  : "bg-white/10 text-white border-white/15 hover:bg-white/15"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#0077B6]" />
              )}
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-5 py-3.5 pr-10 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:border-white/30 transition cursor-pointer"
              >
                <option value="name">Sort: Name A-Z</option>
                <option value="newest">Sort: Newest</option>
                <option value="loa_desc">Sort: Length (longest)</option>
                <option value="loa_asc">Sort: Length (shortest)</option>
                <option value="year_desc">Sort: Year (newest)</option>
                <option value="year_asc">Sort: Year (oldest)</option>
                <option value="cabins_desc">Sort: Cabins (most)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-white/30 transition"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Base / Location */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Location
                  </label>
                  <select
                    value={baseId}
                    onChange={(e) => setBaseId(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-white/30 transition"
                  >
                    <option value="">All Locations</option>
                    {bases.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Builder */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Builder
                  </label>
                  <select
                    value={builderId}
                    onChange={(e) => setBuilderId(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-white/30 transition"
                  >
                    <option value="">All Builders</option>
                    {builders.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Charter Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Charter Type
                  </label>
                  <select
                    value={charterType}
                    onChange={(e) => setCharterType(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-white/30 transition"
                  >
                    <option value="">All Types</option>
                    <option value="BAREBOAT">Bareboat</option>
                    <option value="CREWED">Crewed</option>
                  </select>
                </div>

                {/* Cabins Min */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Min Cabins
                  </label>
                  <select
                    value={cabinsMin}
                    onChange={(e) => setCabinsMin(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-white/30 transition"
                  >
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        {n}+ cabins
                      </option>
                    ))}
                  </select>
                </div>

                {/* Guests Min */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Min Guests
                  </label>
                  <select
                    value={guestsMin}
                    onChange={(e) => setGuestsMin(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-white/30 transition"
                  >
                    <option value="">Any</option>
                    {[2, 4, 6, 8, 10, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}+ guests
                      </option>
                    ))}
                  </select>
                </div>

                {/* Length Min */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Min Length (m)
                  </label>
                  <input
                    type="number"
                    value={loaMin}
                    onChange={(e) => setLoaMin(e.target.value)}
                    placeholder="e.g. 10"
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
                  />
                </div>

                {/* Length Max */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Max Length (m)
                  </label>
                  <input
                    type="number"
                    value={loaMax}
                    onChange={(e) => setLoaMax(e.target.value)}
                    placeholder="e.g. 20"
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
                  />
                </div>

                {/* Year Min */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    Built After
                  </label>
                  <input
                    type="number"
                    value={yearMin}
                    onChange={(e) => setYearMin(e.target.value)}
                    placeholder="e.g. 2018"
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
                  />
                </div>

                {/* Clear */}
                <div className="flex flex-col justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2.5 rounded-lg border border-white/15 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-white/50 text-sm">
              <span className="text-white font-semibold">{total}</span> yacht
              {total !== 1 ? "s" : ""} found
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-3 text-[#0077B6] text-xs font-medium hover:underline"
                >
                  Clear filters
                </button>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Yacht Grid */}
      <section className="w-full bg-white py-12 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0055a9]" />
            </div>
          )}

          {!loading && yachts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sailboat className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No yachts found
              </h3>
              <p className="text-gray-400 text-sm mb-6 max-w-md">
                Try adjusting your filters or search terms to find available yachts.
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition"
                style={{ backgroundColor: "#0055a9" }}
              >
                Clear All Filters
              </button>
            </div>
          )}

          {!loading && yachts.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {yachts.map((yacht) => (
                  <YachtGridCard key={yacht.id} yacht={yacht} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => fetchYachts(page - 1)}
                    disabled={page <= 1}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (page <= 4) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i
                    } else {
                      pageNum = page - 3 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchYachts(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                          pageNum === page
                            ? "text-white"
                            : "border border-gray-200 hover:bg-gray-50"
                        }`}
                        style={
                          pageNum === page
                            ? { backgroundColor: "#070c26" }
                            : undefined
                        }
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => fetchYachts(page + 1)}
                    disabled={page >= totalPages}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

/* ─── Yacht Grid Card ───────────────────────────────────────────────── */

function YachtGridCard({ yacht }: { yacht: YachtCard }) {
  const [liked, setLiked] = useState(false)

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-[#070c26] border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
      {/* Image */}
      <Link
        href={`/fleet/${yacht.id}`}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        {yacht.image ? (
          <Image
            src={yacht.image}
            alt={yacht.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(135deg, #006399, #002147)" }}
          />
        )}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(7,12,38,0.7) 0%, rgba(7,12,38,0.1) 50%, transparent 70%)",
          }}
        />

        {/* Category badge */}
        <span
          className="absolute top-3 left-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full text-white bg-white/15 backdrop-blur-md border border-white/15 z-10"
        >
          {yacht.category}
        </span>

        {/* Like button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setLiked(!liked)
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/15 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center hover:bg-white/30 transition z-10"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              liked ? "fill-red-500 text-red-500" : "text-white"
            }`}
          />
        </button>

        {/* Bottom specs on image */}
        <div className="absolute inset-x-0 bottom-0 p-4 z-10">
          <h3
            className="text-lg font-bold text-white mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {yacht.name}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-white/70 text-[11px]">
            {yacht.loa > 0 && (
              <div className="flex items-center gap-1">
                <Ruler className="w-3 h-3" />
                <span>{yacht.loa}m</span>
              </div>
            )}
            {yacht.cabins > 0 && (
              <div className="flex items-center gap-1">
                <DoorOpen className="w-3 h-3" />
                <span>{yacht.cabins} cabins</span>
              </div>
            )}
            {yacht.berths > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{yacht.berths} guests</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Bottom info bar */}
      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {yacht.baseName && (
            <div className="flex items-center gap-1">
              <Anchor className="w-3 h-3" style={{ color: "#0055a9" }} />
              <span className="font-medium" style={{ color: "#0055a9" }}>
                {yacht.baseName}
              </span>
            </div>
          )}
          {yacht.buildYear > 0 && (
            <span className="text-gray-400">{yacht.buildYear}</span>
          )}
          {yacht.builder && (
            <span className="text-gray-400 hidden md:inline">{yacht.builder}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {yacht.priceFrom > 0 && (
            <span className="text-xs">
              <span className="text-gray-400">from </span>
              <span className="font-bold" style={{ color: "#070c26" }}>
                €{yacht.priceFrom.toLocaleString()}
              </span>
              <span className="text-gray-400">/wk</span>
            </span>
          )}
          <Link
            href={`/fleet/${yacht.id}`}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#0055a9" }}
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}
