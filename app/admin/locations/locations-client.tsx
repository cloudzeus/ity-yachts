"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, MapPin, Search, Loader2 } from "lucide-react"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapLocationPicker, type MapPickerResult } from "@/components/admin/locations/map-location-picker"

type Location = {
  id: string
  name: string
  slug: string
  status: string
  nameTranslations: Record<string, string>
  shortDesc: Record<string, string>
  description: Record<string, string>
  prefecture: Record<string, string>
  city: string
  municipality: string
  latitude: number | null
  longitude: number | null
  defaultMedia: string | null
  defaultMediaType: string | null
  images: string[]
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

const COLUMNS: ColumnDef<Location>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <MapPin className="size-3.5 flex-shrink-0" style={{ color: "var(--secondary)" }} />
        <span>{row.name}</span>
      </div>
    ),
  },
  {
    key: "city",
    header: "City",
    sortable: true,
    cell: (row) => <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{row.city || "—"}</span>,
  },
  {
    key: "prefecture",
    header: "Prefecture",
    sortable: false,
    cell: (row) => {
      const pref = row.prefecture as Record<string, string>
      return <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{pref?.en || "—"}</span>
    },
  },
  {
    key: "coordinates",
    header: "Coords",
    sortable: false,
    cell: (row) => row.latitude && row.longitude
      ? <code className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>{row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}</code>
      : <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>—</span>,
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
  initialData: { locations: Location[]; total: number }
}

export function LocationsClient({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState(initialData.locations)
  const [total, setTotal] = useState(initialData.total)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newNameEl, setNewNameEl] = useState("")
  const [newNameDe, setNewNameDe] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newMunicipality, setNewMunicipality] = useState("")
  const [slugOverridden, setSlugOverridden] = useState(false)
  const [creating, setCreating] = useState(false)
  const [translatingName, setTranslatingName] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [newLat, setNewLat] = useState<number | null>(null)
  const [newLng, setNewLng] = useState<number | null>(null)

  // Place suggestions
  type Suggestion = { displayName: string; latitude: number; longitude: number }
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function parseSuggestionParts(displayName: string) {
    const parts = displayName.split(",").map((s) => s.trim())
    // geocode.maps.co returns: name, city/town, municipality/county, region, country
    const name = parts[0] || ""
    const city = parts[1] || parts[0] || ""
    const municipality = parts[2] || ""
    return { name, city, municipality }
  }

  function selectSuggestion(s: Suggestion) {
    const parsed = parseSuggestionParts(s.displayName)
    setNewName(parsed.name)
    if (!slugOverridden) {
      setNewSlug(parsed.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    }
    setNewCity(parsed.city)
    setNewMunicipality(parsed.municipality)
    setNewLat(s.latitude)
    setNewLng(s.longitude)
    setShowSuggestions(false)
    setSuggestions([])
  }

  // Map picker
  const [mapPickerOpen, setMapPickerOpen] = useState(false)

  async function handleMapPickerConfirm(result: MapPickerResult) {
    const slug = result.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    // Create directly via API
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.name,
          slug,
          nameTranslations: { en: result.name },
          city: result.city,
          municipality: result.municipality,
          latitude: result.latitude,
          longitude: result.longitude,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        router.push(`/admin/locations/${json.location.id}`)
      } else {
        const json = await res.json()
        alert(json.error || "Failed to create")
      }
    } catch {
      alert("Failed to create location")
    }
  }

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async (params: { page: number; pageSize: number; search: string }) => {
    setIsLoading(true)
    try {
      const qs = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize),
        search: params.search,
      })
      const res = await fetch(`/api/admin/locations?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.locations ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }

  function refresh() {
    fetchData({ page, pageSize, search })
  }

  function handleNameChange(val: string) {
    setNewName(val)
    if (!slugOverridden) {
      setNewSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    }
    // Debounced place suggestions
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 400)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  async function handleTranslateName() {
    if (!newName) return
    setTranslatingName(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newName, languages: ["el", "de"] }),
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
    const address = [newName, newCity, "Greece"].filter(Boolean).join(", ")
    if (!newName) return
    setGeocoding(true)
    try {
      const res = await fetch("/api/admin/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewLat(json.latitude)
        setNewLng(json.longitude)
      }
    } finally {
      setGeocoding(false)
    }
  }

  async function handleCreate() {
    if (!newName || !newSlug) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          nameTranslations: { en: newName, el: newNameEl, de: newNameDe },
          city: newCity,
          municipality: newMunicipality,
          latitude: newLat,
          longitude: newLng,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        resetCreateForm()
        router.push(`/admin/locations/${json.location.id}`)
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
    setNewName("")
    setNewNameEl("")
    setNewNameDe("")
    setNewSlug("")
    setNewCity("")
    setNewMunicipality("")
    setSlugOverridden(false)
    setNewLat(null)
    setNewLng(null)
    setSuggestions([])
    setShowSuggestions(false)
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/locations/${id}`, { method: "DELETE" })
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
        tableKey="locations"
        data={data}
        columns={COLUMNS}
        searchPlaceholder="Search by name, slug, or city..."
        isLoading={isLoading}
        pagination={{ page, pageSize, total }}
        onPageChange={(p) => { setPage(p); fetchData({ page: p, pageSize, search }) }}
        onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); fetchData({ page: 1, pageSize: ps, search }) }}
        onSearchChange={(q) => { setSearch(q); setPage(1); fetchData({ page: 1, pageSize, search: q }) }}
        onSortChange={() => {}}
        toolbar={
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-9 gap-2 text-xs text-white"
              style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              New Location
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-2 text-xs"
              style={{ borderColor: "var(--secondary)", color: "var(--secondary)", borderRadius: "var(--radius-xs)" }}
              onClick={() => setMapPickerOpen(true)}
            >
              <MapPin className="size-4" />
              New from Map
            </Button>
          </div>
        }
        rowActions={(row) => [
          {
            label: "Edit",
            icon: <Pencil className="size-3.5" />,
            onClick: () => router.push(`/admin/locations/${row.id}`),
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

      {/* Create Location Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetCreateForm(); else setCreateOpen(true) }}>
        <DialogContent className="sm:max-w-lg" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>New Location</DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Create a new location with multilingual names.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {/* Names row */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1 relative" ref={suggestionsRef}>
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EN *</Label>
                <div className="relative">
                  <Input
                    value={newName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                    placeholder="Start typing a place…"
                    autoFocus
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
                    style={{
                      top: "calc(100% + 2px)",
                      background: "var(--surface-container-lowest)",
                      borderColor: "var(--outline-variant)",
                      borderRadius: "var(--radius-xs)",
                    }}
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
                        <MapPin className="size-3 flex-shrink-0 mt-0.5" style={{ color: "var(--secondary)" }} />
                        <span className="line-clamp-2">{s.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EL</Label>
                <Input value={newNameEl} onChange={(e) => setNewNameEl(e.target.value)} placeholder="Λευκάδα" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>DE</Label>
                <Input value={newNameDe} onChange={(e) => setNewNameDe(e.target.value)} placeholder="Lefkada" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            <Button variant="outline" onClick={handleTranslateName} disabled={translatingName || !newName} className="w-full h-7 text-xs" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
              {translatingName ? "Translating…" : "Translate via DeepSeek"}
            </Button>

            {/* City + Municipality */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>City</Label>
                <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Lefkada" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Municipality</Label>
                <Input value={newMunicipality} onChange={(e) => setNewMunicipality(e.target.value)} placeholder="Lefkada" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>

            {/* Geocode */}
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Coordinates</Label>
                <div className="flex gap-2">
                  <Input value={newLat ?? ""} onChange={(e) => setNewLat(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lat" type="number" step="any" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                  <Input value={newLng ?? ""} onChange={(e) => setNewLng(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lng" type="number" step="any" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                </div>
              </div>
              <Button variant="outline" onClick={handleGeocode} disabled={geocoding || !newName} className="h-7 text-xs gap-1 flex-shrink-0" style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}>
                <Search className="size-3" />
                {geocoding ? "…" : "Geocode"}
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetCreateForm} disabled={creating}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !newName || !newSlug} className="h-7 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
                {creating ? "Creating…" : "Create Location"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Picker */}
      <MapLocationPicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        onConfirm={handleMapPickerConfirm}
      />

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
          <DialogContent className="sm:max-w-sm" style={{ background: "var(--surface-container-lowest)" }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Delete Location</DialogTitle>
              <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
                This will permanently delete this location. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} disabled={deleting} className="text-white" style={{ background: "var(--error)", borderRadius: "var(--radius-xs)" }}>
                {deleting ? "Deleting…" : "Delete Location"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
