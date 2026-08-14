"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { FleetRanges } from "@/lib/fleet-ranges"
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
import { useTranslations } from "@/lib/use-translations"
import { yachtThumb } from "@/lib/yacht-images"
import { removeGreekTonos } from "@/lib/greek-utils"

interface YachtCard {
  id: number
  name: string
  image: string
  category: string
  categoryTranslations?: Record<string, string> | null
  loa: number
  cabins: number
  berths: number
  baseName: string
  baseNameTranslations?: Record<string, string> | null
  builder: string
  buildYear: number
  priceFrom: number
  charterType: string
}

interface FilterOption {
  id: number
  name: string
  nameTranslations?: Record<string, string> | null
}

interface HeroContent {
  badge?: Record<string, string>
  title?: Record<string, string>
  subtitle?: Record<string, string>
}

interface FleetListProps {
  initialYachts: YachtCard[]
  initialTotal: number
  categories: FilterOption[]
  builders: FilterOption[]
  hero?: HeroContent | null
  ranges: FleetRanges
}

export function FleetListClient({
  initialYachts,
  initialTotal,
  categories,
  builders,
  hero,
  ranges,
}: FleetListProps) {
  const { locale, t, tUpper } = useTranslations()

  function rHero(field: Record<string, string> | undefined, fallback: string) {
    if (!field) return fallback
    return field[locale] || field.en || fallback
  }
  const [yachts, setYachts] = useState<YachtCard[]>(initialYachts)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / 12))
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  /* The homepage search bar pushes its selection here as `?guests=5-8&
     cabins=1-2&length=12-14`, and none of it was ever read: you chose four
     berths, pressed search, and landed on the unfiltered fleet. Seed the
     filters from the URL so the search actually carries over.

     The bar sends ranges but the API takes minima, so the low end of each
     range is what applies; length maps to both ends because loaMin/loaMax
     exist. */
  const q = useSearchParams()
  const rangeStart = (key: string) => {
    const raw = q.get(key)
    if (!raw) return ""
    const from = Number(raw.split("-")[0])
    return Number.isFinite(from) && from > 0 ? String(from) : ""
  }
  const rangeEnd = (key: string) => {
    const raw = q.get(key)
    if (!raw) return ""
    const to = Number(raw.split("-")[1])
    return Number.isFinite(to) && to > 0 ? String(to) : ""
  }

  // Filter state
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [builderId, setBuilderId] = useState("")
  const [cabinsMin, setCabinsMin] = useState(() => rangeStart("cabins"))
  /* The guests select only offers even numbers, so a bar selection of "5 – 8"
     rounds down to 4. Down, not up: 4+ is a superset of 5+, so the boat the
     visitor asked for is still in the list. Rounding up would hide it. */
  const [guestsMin, setGuestsMin] = useState(() => {
    const from = Number(rangeStart("guests"))
    return from >= 2 ? String(Math.max(2, Math.floor(from / 2) * 2)) : ""
  })
  const [loaMin, setLoaMin] = useState(() => rangeStart("length"))
  const [loaMax, setLoaMax] = useState(() => rangeEnd("length"))
  const [yearMin, setYearMin] = useState("")
  const [charterType, setCharterType] = useState("")
  const [sortBy, setSortBy] = useState("name")

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  /* Normally the first render is skipped, because the server already sent the
     first page. When the URL seeded a filter that no longer holds — those
     yachts are the unfiltered list — so let the first fetch through. */
  const isFirstRender = useRef(!(cabinsMin || guestsMin || loaMin || loaMax))

  const fetchYachts = useCallback(
    async (pageNum: number) => {
      setLoading(true)
      const params = new URLSearchParams()
      params.set("page", String(pageNum))
      params.set("pageSize", "12")
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (categoryId) params.set("categoryId", categoryId)
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
          const catName = y.category?.name as Record<string, string> | undefined
          const image = yachtThumb(y)
          const locName = y.base?.location?.name as Record<string, string> | undefined
          return {
            id: y.id,
            name: y.name || y.model?.name || "Yacht",
            image,
            category: catName?.en || "Yacht",
            categoryTranslations: catName || null,
            loa: y.loa || 0,
            cabins: y.cabins || 0,
            berths: y.berthsTotal || y.maxPersons || 0,
            baseName: locName?.en || "",
            baseNameTranslations: locName || null,
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
    [debouncedSearch, categoryId, builderId, cabinsMin, guestsMin, loaMin, loaMax, yearMin, charterType, sortBy, locale]
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
    search || categoryId || builderId || cabinsMin || guestsMin || loaMin || loaMax || yearMin || charterType

  return (
    <div
      className="w-full flex flex-col"
      style={{ color: "var(--iyc-ionian-900)", background: "var(--surface-page)" }}
    >
      {/* Hero Header — photographic, per the design system: the hero is a
          photograph under --scrim-hero with the copy sitting directly on it.
          It was a flat navy panel, which the kit rules out ("deep-sea
          gradients, not capsules"). */}
      <section
        className="relative w-full pt-40 pb-56 px-6 md:px-12"
        style={{ background: "var(--surface-page)" }}
      >
        {/* Mirrored. The white hull fills the left of the original frame —
            exactly where the headline sits — and white copy on a white sail
            cannot be rescued by any scrim. Flipping puts the hull on the right
            and open water behind the text, which fixes the contrast by
            composition instead of by darkening the picture.
            The flip lives on the wrapper because the parallax driver writes
            its own transform to the image and would overwrite it. */}
        <div aria-hidden className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
          <Image
            src="https://iycweb.b-cdn.net/general/1786438819655-happy-friends-diving-from-sailing-boat-into-the-se-2026-03-19-21-49-52-utc.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_34%]"
            data-parallax="0.18"
          />
        </div>

        {/* One vertical gradient, exactly the formula the design kit uses on
            its own hero — it ends *in* the page colour, so the photograph
            resolves into the ivory instead of stopping against it. The extra
            layers this had before (a left-to-right wash and a second scrim)
            were mine, not the kit's; stacked, they greyed the picture out and
            left a muddy band at the hand-off. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,13,25,.55) 0%, rgba(4,13,25,.28) 45%, var(--surface-page) 100%)",
          }}
        />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(226,150,60,0.18)" }}
            >
              <Sailboat className="w-5 h-5" style={{ color: "var(--iyc-sun-300)" }} />
            </div>
            {/* Eyebrow in sunset amber — the kit's rule for hero overlines. */}
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--iyc-sun-300)" }}
            >
              {removeGreekTonos(rHero(hero?.badge, t("fleet.badge", "Our Fleet"))).toUpperCase()}
            </span>
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            {rHero(hero?.title, t("fleet.title", "Yachts & Catamarans"))}
          </h1>
          {/* Sand, not white-at-60%: the palette's warm off-white keeps the
              lead legible on the photograph and ties it to the ivory below.
              Only the h1 stays pure white. */}
          <p
            className="text-sm md:text-base max-w-[600px] leading-relaxed"
            style={{ color: "var(--iyc-sand-200)" }}
          >
            {rHero(hero?.subtitle, t("fleet.subtitle", "Browse our curated fleet of sailing yachts and catamarans available for charter in the Greek islands."))}
          </p>

          {/* Search Bar */}
          {/* Search bar — the homepage charter form's language, so the two
              pages read as one site: a near-solid white bar on the photograph,
              cells divided by hairlines rather than floated as separate pills,
              and the accent reserved for the single action. It also settles the
              contrast for good — ink on white beats any glass over open water. */}
          <div className="mt-10 w-full max-w-3xl">
            <div
              className="overflow-hidden"
              style={{
                borderRadius: "var(--iyc-radius-lg)",
                background: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "var(--shadow-photo)",
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-stretch">
                <div className="relative flex items-center gap-3 px-5 py-3.5 border-b md:border-b-0 md:border-r border-[var(--border-hairline)]">
                  <Search className="w-[18px] h-[18px] shrink-0" style={{ color: "var(--text-link)" }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={t("fleet.searchPlaceholder", "Search by name, model, or builder...")}
                    className="w-full bg-transparent text-sm focus:outline-none placeholder:text-[var(--text-subtle)]"
                    style={{ color: "var(--text-body)" }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      aria-label={t("fleet.filter.clearFilters", "Clear filters")}
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition hover:bg-black/[0.06]"
                    >
                      <X className="w-3 h-3" style={{ color: "var(--text-subtle)" }} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  aria-expanded={showFilters}
                  className="flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm font-semibold transition-all cursor-pointer active:scale-[0.985]"
                  style={
                    showFilters
                      ? { background: "var(--action-accent)", color: "var(--text-on-accent)", fontFamily: "var(--font-display)" }
                      : { background: "transparent", color: "var(--text-body)", fontFamily: "var(--font-display)" }
                  }
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {t("fleet.filters", "Filters")}
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full" style={{ background: "var(--action-accent)" }} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div
              className="mt-4 w-full max-w-3xl p-6"
              style={{
                borderRadius: "var(--iyc-radius-lg)",
                background: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "var(--shadow-photo)",
              }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
                    {tUpper("fleet.filter.category", "Category")}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="px-3 py-2.5 rounded-[var(--iyc-radius-sm)] text-xs transition focus:outline-none bg-transparent border border-[var(--border-input)] text-[var(--text-body)] focus:border-[var(--text-link)]"
                  >
                    <option value="">{t("fleet.filter.allCategories", "All Categories")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameTranslations?.[locale] || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Builder */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
                    {tUpper("fleet.filter.builder", "Builder")}
                  </label>
                  <select
                    value={builderId}
                    onChange={(e) => setBuilderId(e.target.value)}
                    className="px-3 py-2.5 rounded-[var(--iyc-radius-sm)] text-xs transition focus:outline-none bg-transparent border border-[var(--border-input)] text-[var(--text-body)] focus:border-[var(--text-link)]"
                  >
                    <option value="">{t("fleet.filter.allBuilders", "All Builders")}</option>
                    {builders.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Charter Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
                    {tUpper("fleet.filter.charterType", "Charter Type")}
                  </label>
                  <select
                    value={charterType}
                    onChange={(e) => setCharterType(e.target.value)}
                    className="px-3 py-2.5 rounded-[var(--iyc-radius-sm)] text-xs transition focus:outline-none bg-transparent border border-[var(--border-input)] text-[var(--text-body)] focus:border-[var(--text-link)]"
                  >
                    <option value="">{t("fleet.filter.allTypes", "All Types")}</option>
                    <option value="BAREBOAT">{t("fleet.filter.bareboat", "Bareboat")}</option>
                    <option value="CREWED">{t("fleet.filter.crewed", "Crewed")}</option>
                  </select>
                </div>

                {/* Cabins Min */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
                    {tUpper("fleet.filter.minCabins", "Min Cabins")}
                  </label>
                  <select
                    value={cabinsMin}
                    onChange={(e) => setCabinsMin(e.target.value)}
                    className="px-3 py-2.5 rounded-[var(--iyc-radius-sm)] text-xs transition focus:outline-none bg-transparent border border-[var(--border-input)] text-[var(--text-body)] focus:border-[var(--text-link)]"
                  >
                    <option value="">{t("fleet.filter.any", "Any")}</option>
                    {/* 1..max from the fleet. The old list ran to 8 against a
                        fleet whose biggest boat has 5 — three dead options. */}
                    {Array.from({ length: ranges.maxCabins }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}+ {t("fleet.filter.cabins", "cabins")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Guests Min */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
                    {tUpper("fleet.filter.minGuests", "Min Guests")}
                  </label>
                  <select
                    value={guestsMin}
                    onChange={(e) => setGuestsMin(e.target.value)}
                    className="px-3 py-2.5 rounded-[var(--iyc-radius-sm)] text-xs transition focus:outline-none bg-transparent border border-[var(--border-input)] text-[var(--text-body)] focus:border-[var(--text-link)]"
                  >
                    <option value="">{t("fleet.filter.any", "Any")}</option>
                    {Array.from({ length: Math.floor(ranges.maxBerths / 2) }, (_, i) => (i + 1) * 2).map((n) => (
                      <option key={n} value={n}>
                        {n}+ {t("fleet.filter.guests", "guests")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Length Min */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
                    {tUpper("fleet.filter.minLength", "Min Length (m)")}
                  </label>
                  <input
                    type="number"
                    value={loaMin}
                    onChange={(e) => setLoaMin(e.target.value)}
                    min={ranges.minLoa}
                    max={ranges.maxLoa}
                    placeholder={String(ranges.minLoa)}
                    className="px-3 py-2.5 rounded-[var(--iyc-radius-sm)] text-xs transition focus:outline-none bg-transparent border border-[var(--border-input)] text-[var(--text-body)] focus:border-[var(--text-link)] placeholder:text-[var(--text-subtle)]"
                  />
                </div>

                {/* Length Max */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
                    {tUpper("fleet.filter.maxLength", "Max Length (m)")}
                  </label>
                  <input
                    type="number"
                    value={loaMax}
                    onChange={(e) => setLoaMax(e.target.value)}
                    min={ranges.minLoa}
                    max={ranges.maxLoa}
                    placeholder={String(ranges.maxLoa)}
                    className="px-3 py-2.5 rounded-[var(--iyc-radius-sm)] text-xs transition focus:outline-none bg-transparent border border-[var(--border-input)] text-[var(--text-body)] focus:border-[var(--text-link)] placeholder:text-[var(--text-subtle)]"
                  />
                </div>

                {/* Year Min */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
                    {tUpper("fleet.filter.builtAfter", "Built After")}
                  </label>
                  <input
                    type="number"
                    value={yearMin}
                    onChange={(e) => setYearMin(e.target.value)}
                    placeholder="e.g. 2018"
                    className="px-3 py-2.5 rounded-[var(--iyc-radius-sm)] text-xs transition focus:outline-none bg-transparent border border-[var(--border-input)] text-[var(--text-body)] focus:border-[var(--text-link)] placeholder:text-[var(--text-subtle)]"
                  />
                </div>

                {/* Clear */}
                <div className="flex flex-col justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2.5 rounded-lg border border-white/15 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition"
                  >
                    {t("fleet.filter.clearAll", "Clear All Filters")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results count. Sand, not ink — the grid now rides up over the
              photograph, so this line sits on open water rather than on the
              ivory it used to reach by this height. */}
          <div className="mt-6 flex items-center justify-between">
            <p
              className="text-sm"
              style={{
                color: "var(--iyc-sand-200)",
                // A shadow rather than a heavier scrim: this line sits wherever
                // the water happens to be light or dark, and a shadow travels
                // with the text instead of dimming the whole photograph.
                textShadow: "0 1px 3px rgba(4,13,25,.62), 0 1px 14px rgba(4,13,25,.38)",
              }}
            >
              <span className="font-semibold" style={{ color: "var(--iyc-sand-50)" }}>{total}</span>{" "}
              {t("fleet.yachtsFound", "yachts found")}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-3 text-xs font-medium hover:underline"
                  style={{ color: "var(--iyc-sun-300)" }}
                >
                  {t("fleet.filter.clearFilters", "Clear filters")}
                </button>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Yacht Grid — pulled up so the first row sits on the water rather than
          below the photograph. Transparent background: an opaque one would
          paint ivory straight over the sea it is meant to float on. */}
      <section className="relative z-10 -mt-20 w-full pb-12 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" />
            </div>
          )}

          {!loading && yachts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sailboat className="w-16 h-16 text-[var(--text-muted)] mb-4" />
              <h3 className="text-xl font-semibold text-[var(--text-body)] mb-2">
                {t("fleet.noResults", "No yachts found")}
              </h3>
              <p className="text-[var(--text-subtle)] text-sm mb-6 max-w-md">
                {t("fleet.noResultsHint", "Try adjusting your filters or search terms to find available yachts.")}
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition"
                style={{ backgroundColor: "var(--iyc-ionian-600)" }}
              >
                {t("fleet.filter.clearAll", "Clear All Filters")}
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
                    className="w-10 h-10 rounded-lg border border-[var(--border-hairline)] flex items-center justify-center hover:bg-[var(--surface-sunken)] transition disabled:opacity-30 disabled:cursor-not-allowed"
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
                            : "border border-[var(--border-hairline)] hover:bg-[var(--surface-sunken)]"
                        }`}
                        style={
                          pageNum === page
                            ? { backgroundColor: "var(--text-heading)" }
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
                    className="w-10 h-10 rounded-lg border border-[var(--border-hairline)] flex items-center justify-center hover:bg-[var(--surface-sunken)] transition disabled:opacity-30 disabled:cursor-not-allowed"
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
  const { locale, t, tUpper } = useTranslations()
  const category = yacht.categoryTranslations?.[locale] || yacht.category

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white border border-[var(--border-hairline)] shadow-sm hover:shadow-xl transition-shadow duration-300">
      {/* Image */}
      <Link
        href={`/fleet/${yacht.id}`}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        {yacht.image ? (
          <Image
            src={yacht.image}
            alt={`${yacht.name}${yacht.category ? `, a ${yacht.category.toLowerCase()}` : ""} for charter from ${yacht.baseName || "Lefkada"}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(135deg, var(--iyc-ionian-500), var(--iyc-ionian-700))" }}
          />
        )}
        {/* Subtle gradient for text readability */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background:
              "var(--scrim-card)",
          }}
        />

        {/* Category badge */}
        <span
          className="absolute top-3 left-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full text-[var(--text-on-accent)] bg-[var(--action-accent)] z-10"
        >
          {removeGreekTonos(category)}
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
            className="text-lg font-bold text-[var(--text-heading)] mb-2 tracking-tight truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {yacht.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--text-muted)] text-[11px]">
            {yacht.loa > 0 && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Ruler className="w-3 h-3" />
                <span>{yacht.loa}m</span>
              </div>
            )}
            {yacht.cabins > 0 && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <DoorOpen className="w-3 h-3" />
                <span>{yacht.cabins} {t("fleet.card.cabins", "cabins")}</span>
              </div>
            )}
            {yacht.berths > 0 && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Users className="w-3 h-3" />
                <span>{yacht.berths} {t("fleet.card.guests", "guests")}</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Bottom info bar. Two rows, not one: at a third of the viewport this
          was cramming home port, year, builder, price and a button onto a
          single line, so every one of them wrapped mid-word. Metadata gets its
          own line and truncates; the price and the action get theirs. */}
      <div className="bg-white px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3 text-xs min-w-0">
          {yacht.buildYear > 0 && (
            <span className="shrink-0 whitespace-nowrap" style={{ color: "var(--text-subtle)" }}>
              {yacht.buildYear}
            </span>
          )}
          {yacht.builder && (
            <span
              className="truncate min-w-0"
              style={{ color: "var(--text-subtle)" }}
              title={yacht.builder}
            >
              {yacht.builder}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          {yacht.priceFrom > 0 ? (
            <span className="text-xs whitespace-nowrap">
              <span style={{ color: "var(--text-subtle)" }}>{t("fleet.card.from", "from")} </span>
              <span className="font-bold" style={{ color: "var(--text-heading)" }}>
                €{yacht.priceFrom.toLocaleString("en-US")}
              </span>
              <span style={{ color: "var(--text-subtle)" }}>/{t("fleet.card.week", "wk")}</span>
            </span>
          ) : (
            <span />
          )}
          <Link
            href={`/fleet/${yacht.id}`}
            title={yacht.name}
            className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--iyc-ionian-600)" }}
          >
            {/* Hidden, so every card's link says which boat rather than a
                page full of links all reading "Details". */}
            <span className="sr-only">{yacht.name} — </span>
            {t("fleet.card.details", "Details")}
          </Link>
        </div>
      </div>
    </div>
  )
}
