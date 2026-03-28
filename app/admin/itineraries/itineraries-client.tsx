"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Route, Search, Loader2, Globe } from "lucide-react"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Itinerary = {
  id: string
  name: Record<string, string>
  slug: string
  status: string
  shortDesc: Record<string, string>
  startFrom: string
  startLatitude: number | null
  startLongitude: number | null
  places: Array<{ name: string; latitude: number; longitude: number }>
  totalDays: number
  totalMiles: number
  _count: { days: number }
  updatedAt: string
}

const statusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    draft:     { bg: "rgba(117,117,117,0.12)", color: "#626262" },
    published: { bg: "rgba(45,106,79,0.12)",   color: "#2D6A4F" },
  }
  const s = styles[status] ?? styles.draft
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.color, borderRadius: "var(--radius-xs)" }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const COLUMNS: ColumnDef<Itinerary>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <Route className="size-3.5 flex-shrink-0" style={{ color: "var(--secondary)" }} />
        <span>{row.name?.en || "Untitled"}</span>
      </div>
    ),
  },
  {
    key: "startFrom",
    header: "Start From",
    sortable: true,
    cell: (row) => <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{row.startFrom || "—"}</span>,
  },
  {
    key: "totalDays",
    header: "Days",
    sortable: true,
    cell: (row) => <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{row.totalDays || "—"}</span>,
  },
  {
    key: "totalMiles",
    header: "Miles",
    sortable: true,
    cell: (row) => <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{row.totalMiles ? `${row.totalMiles} nm` : "—"}</span>,
  },
  { key: "status", header: "Status", sortable: true, cell: (row) => statusBadge(row.status) },
  {
    key: "updatedAt",
    header: "Updated",
    sortable: true,
    cell: (row) => new Date(row.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  },
]

interface Props {
  initialData: { itineraries: Itinerary[]; total: number }
}

export function ItinerariesClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.itineraries)
  const [total, setTotal] = useState(initialData.total)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newNameEn, setNewNameEn] = useState("")
  const [newNameEl, setNewNameEl] = useState("")
  const [newNameDe, setNewNameDe] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [slugOverridden, setSlugOverridden] = useState(false)
  const [creating, setCreating] = useState(false)
  const [translatingName, setTranslatingName] = useState(false)

  // Start from with geocode
  const [newStartFrom, setNewStartFrom] = useState("")
  const [newStartLat, setNewStartLat] = useState<number | null>(null)
  const [newStartLng, setNewStartLng] = useState<number | null>(null)
  const [geocoding, setGeocoding] = useState(false)

  // Suggestions
  type Suggestion = { displayName: string; latitude: number; longitude: number }
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); return }
    setLoadingSuggestions(true)
    try {
      const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const json = await res.json()
        setSuggestions(json.suggestions ?? [])
        setShowSuggestions((json.suggestions ?? []).length > 0)
      }
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleStartFromChange(val: string) {
    setNewStartFrom(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 400)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  function selectSuggestion(s: Suggestion) {
    setNewStartFrom(s.displayName.split(",")[0].trim())
    setNewStartLat(s.latitude)
    setNewStartLng(s.longitude)
    setShowSuggestions(false)
    setSuggestions([])
  }

  function handleNameChange(val: string) {
    setNewNameEn(val)
    if (!slugOverridden) {
      setNewSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    }
  }

  async function handleTranslateName() {
    if (!newNameEn) return
    setTranslatingName(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newNameEn, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewNameEl(json.translations.el || "")
        setNewNameDe(json.translations.de || "")
      }
    } finally {
      setTranslatingName(false)
    }
  }

  async function handleGeocode() {
    if (!newStartFrom) return
    setGeocoding(true)
    try {
      const res = await fetch("/api/admin/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: newStartFrom + ", Greece" }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewStartLat(json.latitude)
        setNewStartLng(json.longitude)
      }
    } finally {
      setGeocoding(false)
    }
  }

  const fetchData = async (params: { page: number; pageSize: number; search: string }) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize),
        search: params.search,
      })
      const res = await fetch(`/api/admin/itineraries?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.itineraries ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }

  function refresh() {
    fetchData({ page, pageSize, search })
  }

  async function handleCreate() {
    if (!newNameEn || !newSlug) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/itineraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: { en: newNameEn, el: newNameEl, de: newNameDe },
          slug: newSlug,
          startFrom: newStartFrom,
          startLatitude: newStartLat,
          startLongitude: newStartLng,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        resetCreateForm()
        router.push(`/admin/itineraries/${json.itinerary.id}`)
      } else {
        const json = await res.json()
        alert(json.error || "Failed to create")
      }
    } finally {
      setCreating(false)
    }
  }

  function resetCreateForm() {
    setCreateOpen(false)
    setNewNameEn("")
    setNewNameEl("")
    setNewNameDe("")
    setNewSlug("")
    setSlugOverridden(false)
    setNewStartFrom("")
    setNewStartLat(null)
    setNewStartLng(null)
    setSuggestions([])
    setShowSuggestions(false)
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/itineraries/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteId(null)
        refresh()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <DataTable
        tableKey="itineraries"
        data={data}
        columns={COLUMNS}
        searchPlaceholder="Search by slug or start location..."
        isLoading={isLoading}
        pagination={{ page, pageSize, total }}
        onPageChange={(p) => { setPage(p); fetchData({ page: p, pageSize, search }) }}
        onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); fetchData({ page: 1, pageSize: ps, search }) }}
        onSearchChange={(q) => { setSearch(q); setPage(1); fetchData({ page: 1, pageSize, search: q }) }}
        onSortChange={() => {}}
        toolbar={
          <Button
            size="sm"
            className="h-9 gap-2 text-xs text-white"
            style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            New Itinerary
          </Button>
        }
        rowActions={(row) => [
          {
            label: "Edit",
            icon: <Pencil className="size-3.5" />,
            onClick: () => router.push(`/admin/itineraries/${row.id}`),
          },
          {
            label: "Delete",
            icon: <Trash2 className="size-3.5" />,
            onClick: () => setDeleteId(row.id),
            variant: "destructive",
            separator: true,
          },
        ]}
      />

      {/* Create Itinerary Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetCreateForm(); else setCreateOpen(true) }}>
        <DialogContent className="sm:max-w-lg" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>New Itinerary</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Create a new sailing itinerary with multilingual names.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {/* Names row */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EN *</Label>
                <Input
                  value={newNameEn}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ionian Islands Cruise"
                  autoFocus
                  autoComplete="off"
                  className="h-7 text-xs"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EL</Label>
                <Input value={newNameEl} onChange={(e) => setNewNameEl(e.target.value)} placeholder="Κρουαζιέρα Ιονίων" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>DE</Label>
                <Input value={newNameDe} onChange={(e) => setNewNameDe(e.target.value)} placeholder="Ionische Inseln Kreuzfahrt" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            <Button variant="outline" onClick={handleTranslateName} disabled={translatingName || !newNameEn} className="w-full h-7 text-xs gap-1.5" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
              <Globe className="size-3" />
              {translatingName ? "Translating…" : "Translate via DeepSeek"}
            </Button>

            {/* Slug */}
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Slug</Label>
              <Input
                value={newSlug}
                onChange={(e) => { setNewSlug(e.target.value); setSlugOverridden(true) }}
                placeholder="ionian-islands-cruise"
                className="h-7 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>

            {/* Start From with suggestions */}
            <div className="flex flex-col gap-1 relative" ref={suggestionsRef}>
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Start From</Label>
              <div className="relative">
                <Input
                  value={newStartFrom}
                  onChange={(e) => handleStartFromChange(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  placeholder="Type a port or marina…"
                  autoComplete="off"
                  className="h-7 text-xs pr-6"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
                {loadingSuggestions && (
                  <Loader2 className="size-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--on-surface-variant)" }} />
                )}
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div
                  className="absolute left-0 right-0 z-50 border shadow-lg overflow-hidden"
                  style={{ top: "calc(100% + 2px)", background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)", borderRadius: "var(--radius-xs)" }}
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-2.5 py-1.5 text-xs flex items-start gap-2 hover:opacity-80 transition-colors cursor-pointer"
                      style={{ color: "var(--on-surface)", borderBottom: i < suggestions.length - 1 ? "1px solid var(--outline-variant)" : "none" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-container)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => selectSuggestion(s)}
                    >
                      <Search className="size-3 flex-shrink-0 mt-0.5" style={{ color: "var(--secondary)" }} />
                      <span className="line-clamp-2">{s.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Coordinates */}
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Start Coordinates</Label>
                <div className="flex gap-2">
                  <Input value={newStartLat ?? ""} onChange={(e) => setNewStartLat(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lat" type="number" step="any" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                  <Input value={newStartLng ?? ""} onChange={(e) => setNewStartLng(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lng" type="number" step="any" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                </div>
              </div>
              <Button variant="outline" onClick={handleGeocode} disabled={geocoding || !newStartFrom} className="h-7 text-xs gap-1 flex-shrink-0" style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}>
                <Search className="size-3" />
                {geocoding ? "…" : "Geocode"}
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetCreateForm} disabled={creating}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !newNameEn || !newSlug} className="h-7 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
                {creating ? "Creating…" : "Create Itinerary"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
          <DialogContent className="sm:max-w-sm" style={{ background: "var(--surface-container-lowest)" }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Itinerary</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this itinerary and all its days and legs. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} disabled={deleting} className="text-white" style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}>
                {deleting ? "Deleting…" : "Delete Itinerary"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
