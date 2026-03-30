"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search, RefreshCw, Ship, Anchor, Fuel, Bed,
  ChevronRight, ChevronLeft, DollarSign, Filter, X, Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SyncModal } from "@/components/admin/fleet/sync-modal"

type YachtModel = {
  id: number
  name: string
  category?: { id: number; name: Record<string, string> } | null
  builder?: { id: number; name: string } | null
}

type CharterBase = {
  id: number
  location?: { id: number; name: Record<string, string> } | null
}

type Yacht = {
  id: number
  name: string
  modelId: number | null
  model: YachtModel | null
  base: CharterBase | null
  charterType: string | null
  buildYear: number | null
  cabins: number | null
  berthsTotal: number | null
  maxPersons: number | null
  loa: number | null
  beam: number | null
  engines: number | null
  enginePower: number | null
  mainPictureUrl: string | null
  isPremium: boolean
  isOwnFleet: boolean
  deposit: number | null
  depositCurrency: string | null
  _count: { equipment: number; cabinDefinitions: number; prices: number }
}

type SyncLog = {
  id: string
  syncType: string
  status: string
  itemCount: number
  startedAt: string
  completedAt: string | null
}

type FilterOptions = {
  categories: { id: number; name: string }[]
  bases: { id: number; name: string }[]
  years: number[]
}

type Filters = {
  categoryId: string
  baseId: string
  cabinsMin: string
  cabinsMax: string
  yearMin: string
  yearMax: string
  loaMin: string
  loaMax: string
  berthsMin: string
  isOwnFleet: string
}

const defaultFilters: Filters = {
  categoryId: "", baseId: "", cabinsMin: "", cabinsMax: "",
  yearMin: "", yearMax: "", loaMin: "", loaMax: "",
  berthsMin: "", isOwnFleet: "",
}

type Props = {
  total: number
  lastSync: SyncLog | null
}

export function FleetClient({ total: initialTotal, lastSync }: Props) {
  const router = useRouter()
  const [yachts, setYachts] = useState<Yacht[]>([])
  const [total, setTotal] = useState(initialTotal)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchYachts = useCallback(async (p: number, ps: number, s: string, f: Filters) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(p))
    params.set("pageSize", String(ps))
    if (s) params.set("search", s)
    if (f.categoryId) params.set("categoryId", f.categoryId)
    if (f.baseId) params.set("baseId", f.baseId)
    if (f.cabinsMin) params.set("cabinsMin", f.cabinsMin)
    if (f.cabinsMax) params.set("cabinsMax", f.cabinsMax)
    if (f.yearMin) params.set("yearMin", f.yearMin)
    if (f.yearMax) params.set("yearMax", f.yearMax)
    if (f.loaMin) params.set("loaMin", f.loaMin)
    if (f.loaMax) params.set("loaMax", f.loaMax)
    if (f.berthsMin) params.set("berthsMin", f.berthsMin)
    if (f.isOwnFleet) params.set("isOwnFleet", f.isOwnFleet)

    try {
      const res = await fetch(`/api/admin/fleet?${params}`)
      const data = await res.json()
      setYachts(data.yachts ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setYachts([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + filter options
  useEffect(() => {
    fetchYachts(1, pageSize, "", defaultFilters)
    fetch("/api/admin/fleet/filters").then((r) => r.json()).then(setFilterOptions).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchYachts(1, pageSize, search, filters)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  // Page/pageSize/filter changes
  useEffect(() => {
    fetchYachts(page, pageSize, search, filters)
  }, [page, pageSize, filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSync = useCallback(() => {
    setShowSyncModal(true)
  }, [])

  const handleSyncComplete = useCallback(() => {
    router.refresh()
    fetchYachts(page, pageSize, search, filters)
  }, [router, page, pageSize, search, filters, fetchYachts])

  const applyFilter = (key: keyof Filters, value: string) => {
    setPage(1)
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const clearFilters = () => {
    setPage(1)
    setFilters(defaultFilters)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  const lang = (obj: Record<string, string> | null | undefined, fallback = "—") =>
    obj?.en || obj?.el || obj?.de || fallback

  const selectStyle = {
    background: "var(--surface-container-lowest)",
    borderColor: "var(--outline-variant)",
    color: "var(--on-surface)",
    borderRadius: "var(--radius-xs)",
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--on-surface-variant)" }} />
          <Input
            placeholder="Search yachts, models, builders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
            style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          />
        </div>
        <Button
          size="sm" variant="outline" className="h-9 gap-2 text-xs"
          style={{ borderColor: hasFilters ? "var(--primary)" : "var(--outline-variant)", color: hasFilters ? "var(--primary)" : undefined }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="size-3.5" />
          Filters{hasFilters ? " ●" : ""}
        </Button>
        <div className="flex items-center gap-1.5">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="h-9 text-xs px-2 border rounded"
            style={selectStyle}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
        <Button
          size="sm" variant="outline" className="h-9 gap-2 text-xs ml-auto"
          style={{ borderColor: "var(--outline-variant)" }}
          disabled={syncing}
          onClick={handleSync}
        >
          <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync NAUSYS"}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && filterOptions && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-4 rounded-lg"
          style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}
        >
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)" }}>Category</label>
            <select value={filters.categoryId} onChange={(e) => applyFilter("categoryId", e.target.value)} className="h-8 text-xs px-2 border rounded" style={selectStyle}>
              <option value="">All</option>
              {filterOptions.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)" }}>Marina / Base</label>
            <select value={filters.baseId} onChange={(e) => applyFilter("baseId", e.target.value)} className="h-8 text-xs px-2 border rounded" style={selectStyle}>
              <option value="">All</option>
              {filterOptions.bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)" }}>Cabins</label>
            <div className="flex gap-1">
              <input type="number" placeholder="Min" value={filters.cabinsMin} onChange={(e) => applyFilter("cabinsMin", e.target.value)} className="h-8 w-full text-xs px-2 border rounded" style={selectStyle} />
              <input type="number" placeholder="Max" value={filters.cabinsMax} onChange={(e) => applyFilter("cabinsMax", e.target.value)} className="h-8 w-full text-xs px-2 border rounded" style={selectStyle} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)" }}>Year</label>
            <div className="flex gap-1">
              <select value={filters.yearMin} onChange={(e) => applyFilter("yearMin", e.target.value)} className="h-8 w-full text-xs px-1 border rounded" style={selectStyle}>
                <option value="">From</option>
                {filterOptions.years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filters.yearMax} onChange={(e) => applyFilter("yearMax", e.target.value)} className="h-8 w-full text-xs px-1 border rounded" style={selectStyle}>
                <option value="">To</option>
                {filterOptions.years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)" }}>Length (m)</label>
            <div className="flex gap-1">
              <input type="number" step="0.1" placeholder="Min" value={filters.loaMin} onChange={(e) => applyFilter("loaMin", e.target.value)} className="h-8 w-full text-xs px-2 border rounded" style={selectStyle} />
              <input type="number" step="0.1" placeholder="Max" value={filters.loaMax} onChange={(e) => applyFilter("loaMax", e.target.value)} className="h-8 w-full text-xs px-2 border rounded" style={selectStyle} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)" }}>Min Berths</label>
            <input type="number" placeholder="Min" value={filters.berthsMin} onChange={(e) => applyFilter("berthsMin", e.target.value)} className="h-8 text-xs px-2 border rounded" style={selectStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium" style={{ color: "var(--on-surface-variant)" }}>Fleet</label>
            <select value={filters.isOwnFleet} onChange={(e) => applyFilter("isOwnFleet", e.target.value)} className="h-8 text-xs px-2 border rounded" style={selectStyle}>
              <option value="">All yachts</option>
              <option value="true">Our fleet only</option>
            </select>
          </div>
          {hasFilters && (
            <div className="flex items-end">
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={clearFilters}>
                <X className="size-3" /> Clear
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sync info */}
      {lastSync && (
        <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
          Last sync: <span suppressHydrationWarning>{new Date(lastSync.startedAt).toLocaleString()}</span> —{" "}
          <span style={{ color: lastSync.status === "completed" ? "#2D6A4F" : lastSync.status === "failed" ? "#D32F2F" : "var(--on-surface-variant)" }}>
            {lastSync.status}
          </span>
        </p>
      )}

      {/* Fleet grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="size-6 animate-spin" style={{ color: "var(--outline-variant)" }} />
        </div>
      ) : yachts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-3"
          style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)" }}
        >
          <Ship className="size-10" style={{ color: "var(--outline-variant)" }} />
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            {total === 0 ? 'No yachts yet. Click "Sync NAUSYS" to import your fleet.' : "No yachts match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {yachts.map((yacht) => (
            <button
              key={yacht.id}
              onClick={() => router.push(`/admin/fleet/${yacht.id}`)}
              className="flex flex-col text-left transition-shadow hover:shadow-md"
              style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden" }}
            >
              {/* Image */}
              <div
                className="relative aspect-square w-full bg-cover bg-center"
                style={yacht.mainPictureUrl
                  ? { backgroundImage: `url(${yacht.mainPictureUrl})` }
                  : { background: "var(--surface-container)" }
                }
              >
                {!yacht.mainPictureUrl && (
                  <div className="flex items-center justify-center h-full">
                    <Ship className="size-10" style={{ color: "var(--outline-variant)" }} />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {yacht.charterType && (
                    <span className="px-2 py-0.5 text-[10px] font-medium" style={{ background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: "var(--radius-xs)" }}>
                      {yacht.charterType}
                    </span>
                  )}
                  {yacht.isOwnFleet && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1" style={{ background: "#2D6A4F", color: "#fff", borderRadius: "var(--radius-xs)" }}>
                      <Star className="size-2.5" /> Our Fleet
                    </span>
                  )}
                </div>
                {yacht.isPremium && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
                    Premium
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5 p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold leading-tight truncate" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                      {yacht.name}
                    </h3>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--on-surface-variant)" }}>
                      {yacht.model?.builder?.name} {yacht.model?.name}
                      {yacht.buildYear ? ` (${yacht.buildYear})` : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 mt-0.5 shrink-0" style={{ color: "var(--outline-variant)" }} />
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {yacht.cabins != null && (
                    <div className="flex items-center gap-0.5 text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                      <Bed className="size-3" /><span>{yacht.cabins}c</span>
                    </div>
                  )}
                  {yacht.berthsTotal != null && (
                    <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                      {yacht.berthsTotal}b
                    </span>
                  )}
                  {yacht.loa != null && (
                    <div className="flex items-center gap-0.5 text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                      <Anchor className="size-3" /><span>{yacht.loa}m</span>
                    </div>
                  )}
                  {yacht.enginePower != null && (
                    <div className="flex items-center gap-0.5 text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                      <Fuel className="size-3" /><span>{yacht.enginePower}hp</span>
                    </div>
                  )}
                </div>

                {/* Location & pricing info */}
                <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--outline-variant)" }}>
                  <p className="text-[10px] truncate" style={{ color: "var(--on-surface-variant)" }}>
                    {lang(yacht.base?.location?.name as Record<string, string>, "No base")}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {yacht._count.prices > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "#2D6A4F" }}>
                        <DollarSign className="size-2.5" />{yacht._count.prices}
                      </span>
                    )}
                    {yacht._count.equipment > 0 && (
                      <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                        {yacht._count.equipment} eq
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} yachts
          </p>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number
              if (totalPages <= 7) {
                p = i + 1
              } else if (page <= 4) {
                p = i + 1
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i
              } else {
                p = page - 3 + i
              }
              return (
                <Button
                  key={p} size="sm" variant={p === page ? "default" : "outline"}
                  className="h-8 w-8 p-0 text-xs"
                  style={p === page ? { background: "var(--primary)", color: "#fff" } : {}}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            })}
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
      {totalPages <= 1 && total > 0 && (
        <p className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
          Showing {total} yacht{total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <SyncModal
          onClose={() => setShowSyncModal(false)}
          onComplete={handleSyncComplete}
        />
      )}
    </div>
  )
}
