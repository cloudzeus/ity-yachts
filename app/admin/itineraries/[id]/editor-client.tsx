"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Save, Search, Globe, Image as ImageIcon, Route, Loader2, Upload,
  FolderOpen, X, Plus, Trash2, ChevronDown, ChevronRight, MapPin, Anchor, Navigation, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"
import { MapLegPicker, type MapLegResult } from "@/components/admin/itineraries/map-leg-picker"
import { RouteMap, type RoutePoint } from "@/components/admin/itineraries/route-map"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

// ─── Types ───────────────────────────────────────────────────────────────────

type LegData = {
  id: string
  sortOrder: number
  name: Record<string, string>
  description: Record<string, string>
  latitude: number | null
  longitude: number | null
  images: string[]
}

type DayData = {
  id: string
  dayNumber: number
  description: Record<string, string>
  legs: LegData[]
}

type ItineraryData = {
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
  defaultMedia: string | null
  defaultMediaType: string | null
  metaTitle: string | null
  metaDesc: string | null
  days: DayData[]
  createdAt: string
  updatedAt: string
}

interface Props {
  itinerary: ItineraryData
}

// ─── Translatable Field (Tabbed) ─────────────────────────────────────────────

const FIELD_LANGS = ["en", "el", "de"] as const
const FIELD_LANG_LABELS: Record<string, string> = { en: "English", el: "Greek", de: "German" }

function TranslatableField({ label, value: rawValue, onChange, multiline }: {
  label: string
  value: Record<string, string>
  onChange: (val: Record<string, string>) => void
  multiline?: boolean
}) {
  const value = rawValue ?? { en: "", el: "", de: "" }
  const [activeLang, setActiveLang] = useState<"en" | "el" | "de">("en")
  const [translating, setTranslating] = useState(false)

  async function handleTranslate() {
    if (!value.en) return
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value.en, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        onChange({ ...value, el: json.translations.el || "", de: json.translations.de || "" })
      }
    } finally {
      setTranslating(false)
    }
  }

  const InputComponent = multiline ? Textarea : Input
  const inputProps = multiline ? { className: "text-[10px] min-h-14" } : { className: "h-6 text-[10px]" }

  return (
    <div className="flex flex-col gap-1">
      {/* Tab bar */}
      <div className="flex items-center" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
        <Label className="text-[10px] font-medium mr-2 py-1.5" style={{ color: "var(--on-surface)" }}>{label}</Label>
        <div className="flex-1" />
        {FIELD_LANGS.map((lang) => {
          const isActive = activeLang === lang
          const hasContent = !!value[lang]
          return (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className="relative px-2.5 py-1.5 text-[10px] font-medium transition-colors"
              style={{
                color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                background: isActive ? "rgba(0,99,153,0.06)" : "transparent",
              }}
            >
              <span className="flex items-center gap-1">
                {FIELD_LANG_LABELS[lang]}
                {hasContent && !isActive && (
                  <span className="size-1.5 rounded-full" style={{ background: "var(--secondary)" }} />
                )}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--primary)" }} />
              )}
            </button>
          )
        })}
        {activeLang === "en" && (
          <Button variant="ghost" size="sm" onClick={handleTranslate} disabled={translating || !value.en} className="h-5 text-[10px] gap-1 px-1.5 ml-1" style={{ color: "var(--primary)" }}>
            <Globe className="size-3" />
            {translating ? "…" : "Translate"}
          </Button>
        )}
      </div>
      {/* Active language input */}
      <div className="pt-1">
        <InputComponent
          value={value[activeLang] || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [activeLang]: e.target.value })}
          placeholder={`${label} in ${FIELD_LANG_LABELS[activeLang]}…`}
          {...inputProps}
          style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
        />
      </div>
    </div>
  )
}

// ─── Leg Editor ──────────────────────────────────────────────────────────────

const LANG_LABELS: Record<string, string> = { en: "English", el: "Greek", de: "German" }
const LANGS = ["en", "el", "de"] as const

function LegEditor({ leg, onChange, onDelete, legIndex }: {
  leg: LegData
  onChange: (leg: LegData) => void
  onDelete: () => void
  legIndex: number
}) {
  const [expanded, setExpanded] = useState(true)
  const [activeLang, setActiveLang] = useState<"en" | "el" | "de">("en")
  const [translating, setTranslating] = useState(false)
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [geocoding, setGeocoding] = useState(false)

  async function handleTranslateName() {
    if (!leg.name.en) return
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: leg.name.en, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        onChange({ ...leg, name: { ...leg.name, el: json.translations.el || "", de: json.translations.de || "" } })
      }
    } finally {
      setTranslating(false)
    }
  }

  async function uploadFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "itineraries")
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData })
      if (res.ok) {
        const json = await res.json()
        onChange({ ...leg, images: [...leg.images, json.file.url] })
      }
    } finally {
      setUploading(false)
    }
  }

  function handleGalleryPick(media: PickedMedia | PickedMedia[]) {
    const picked = Array.isArray(media) ? media : [media]
    const newUrls = picked.map((m) => m.url).filter((u) => !leg.images.includes(u))
    if (newUrls.length > 0) onChange({ ...leg, images: [...leg.images, ...newUrls] })
  }

  function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => uploadFile(file))
    e.target.value = ""
  }

  async function handleGeocodeLeg() {
    if (!leg.name.en) return
    setGeocoding(true)
    try {
      const res = await fetch("/api/admin/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: leg.name.en + ", Greece" }),
      })
      if (res.ok) {
        const json = await res.json()
        onChange({ ...leg, latitude: json.latitude, longitude: json.longitude })
      }
    } finally {
      setGeocoding(false)
    }
  }

  return (
    <TooltipProvider>
    <div className="rounded-md border" style={{ borderColor: "var(--outline-variant)", background: "rgba(255,255,255,0.6)" }}>
      {/* Leg header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        style={{ borderBottom: expanded ? "1px solid var(--outline-variant)" : "none" }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="size-3.5" style={{ color: "var(--on-surface-variant)" }} /> : <ChevronRight className="size-3.5" style={{ color: "var(--on-surface-variant)" }} />}
        <Navigation className="size-3.5" style={{ color: "var(--secondary)" }} />
        <span className="text-[10px] font-medium flex-1" style={{ color: "var(--on-surface)" }}>
          Leg {legIndex + 1}{leg.name?.en ? `: ${leg.name.en}` : ""}
        </span>
        {leg.images.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(0,99,153,0.1)", color: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
            {leg.images.length} img
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setGalleryPickerOpen(true) }} style={{ color: "var(--secondary)" }}>
              <FolderOpen className="size-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Media Library</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click() }} disabled={uploading} style={{ color: "var(--primary)" }}>
              {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Upload Images</TooltipContent>
        </Tooltip>
        <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); onDelete() }} style={{ color: "var(--error)" }}>
              <Trash2 className="size-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Delete Leg</TooltipContent>
        </Tooltip>
      </div>

      {expanded && (
        <div className="p-3 flex flex-col gap-3">
          {/* Language tabs */}
          <div className="flex items-center gap-0" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
            {LANGS.map((lang) => {
              const isActive = activeLang === lang
              const hasContent = !!leg.name[lang]
              return (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className="relative px-3 py-1.5 text-[10px] font-medium transition-colors"
                  style={{
                    color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                    background: isActive ? "rgba(0,99,153,0.06)" : "transparent",
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    {LANG_LABELS[lang]}
                    {hasContent && !isActive && (
                      <span className="size-1.5 rounded-full" style={{ background: "var(--secondary)" }} />
                    )}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--primary)" }} />
                  )}
                </button>
              )
            })}
            <div className="flex-1" />
            {activeLang === "en" && (
              <Button
                variant="ghost" size="sm"
                onClick={handleTranslateName}
                disabled={translating || !leg.name.en}
                className="h-5 text-[10px] gap-1 px-1.5"
                style={{ color: "var(--primary)" }}
              >
                <Globe className="size-3" />
                {translating ? "Translating…" : "Translate"}
              </Button>
            )}
          </div>

          {/* Name field for active language */}
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
              Leg Name ({LANG_LABELS[activeLang]})
            </Label>
            <Input
              value={leg.name[activeLang] || ""}
              onChange={(e) => onChange({ ...leg, name: { ...leg.name, [activeLang]: e.target.value } })}
              placeholder={`Enter leg name in ${LANG_LABELS[activeLang]}…`}
              className="h-7 text-[10px]"
              style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
            />
          </div>

          {/* Coordinates */}
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Coordinates</Label>
              <div className="flex gap-2">
                <Input
                  value={leg.latitude ?? ""}
                  onChange={(e) => onChange({ ...leg, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Lat" type="number" step="any" className="h-6 text-[10px]"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
                <Input
                  value={leg.longitude ?? ""}
                  onChange={(e) => onChange({ ...leg, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Lng" type="number" step="any" className="h-6 text-[10px]"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleGeocodeLeg} disabled={geocoding || !leg.name.en} className="h-6 w-6 p-0 flex-shrink-0" style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}>
                  {geocoding ? <Loader2 className="size-3 animate-spin" /> : <Search className="size-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Geocode from Name</TooltipContent>
            </Tooltip>
          </div>

          {/* Images */}
          {leg.images.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5">
              {leg.images.map((url, i) => (
                <div key={`${url}-${i}`} className="relative rounded overflow-hidden group aspect-square" style={{ border: "1px solid var(--outline-variant)" }}>
                  <img src={url} alt={`Leg ${legIndex + 1} img ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onChange({ ...leg, images: leg.images.filter((_, idx) => idx !== i) })}
                    className="absolute top-1 right-1 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                  >
                    <X className="size-2.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <MediaPicker open={galleryPickerOpen} onClose={() => setGalleryPickerOpen(false)} onSelect={handleGalleryPick} accept="image" multiple />
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}

// ─── Day Editor ──────────────────────────────────────────────────────────────

function DayEditor({ day, onChange, onDelete }: {
  day: DayData
  onChange: (day: DayData) => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [mapPickerOpen, setMapPickerOpen] = useState(false)

  function addLeg() {
    const newLeg: LegData = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sortOrder: day.legs.length,
      name: { en: "", el: "", de: "" },
      description: { en: "", el: "", de: "" },
      latitude: null,
      longitude: null,
      images: [],
    }
    onChange({ ...day, legs: [...day.legs, newLeg] })
  }

  function addLegFromMap(result: MapLegResult) {
    const newLeg: LegData = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sortOrder: day.legs.length,
      name: { en: result.name, el: "", de: "" },
      description: { en: "", el: "", de: "" },
      latitude: result.latitude,
      longitude: result.longitude,
      images: [],
    }
    onChange({ ...day, legs: [...day.legs, newLeg] })
  }

  function updateLeg(index: number, updated: LegData) {
    const legs = [...day.legs]
    legs[index] = updated
    onChange({ ...day, legs })
  }

  function deleteLeg(index: number) {
    onChange({ ...day, legs: day.legs.filter((_, i) => i !== index) })
  }

  return (
    <TooltipProvider>
    <div className="rounded-lg border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container)" }}>
      {/* Day header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
        style={{ borderBottom: expanded ? "1px solid var(--outline-variant)" : "none" }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="size-4" style={{ color: "var(--on-surface-variant)" }} /> : <ChevronRight className="size-4" style={{ color: "var(--on-surface-variant)" }} />}
        <Anchor className="size-4" style={{ color: "var(--primary)" }} />
        <span className="text-xs font-semibold flex-1" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
          Day {day.dayNumber}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(0,99,153,0.1)", color: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
          {day.legs.length} leg{day.legs.length !== 1 ? "s" : ""}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); addLeg() }} style={{ color: "var(--secondary)" }}>
              <Plus className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Add Leg</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setMapPickerOpen(true) }} style={{ color: "var(--primary)" }}>
              <MapPin className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Add Leg from Map</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onDelete() }} style={{ color: "var(--error)" }}>
              <Trash2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Delete Day</TooltipContent>
        </Tooltip>
      </div>

      {expanded && (
        <div className="p-4 flex flex-col gap-3">
          {/* Day description */}
          <TranslatableField
            label="Day Description"
            value={day.description}
            onChange={(val) => onChange({ ...day, description: val })}
            multiline
          />

          {day.legs.map((leg, legIndex) => (
            <LegEditor
              key={leg.id}
              leg={leg}
              legIndex={legIndex}
              onChange={(updated) => updateLeg(legIndex, updated)}
              onDelete={() => deleteLeg(legIndex)}
            />
          ))}

          <MapLegPicker
            open={mapPickerOpen}
            onOpenChange={setMapPickerOpen}
            onConfirm={addLegFromMap}
            title={`Add Leg to Day ${day.dayNumber}`}
            description="Click on the map to place a pin for this leg. The name and coordinates will be filled automatically."
          />
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}

// ─── Add Place Modal ─────────────────────────────────────────────────────────

function AddPlaceModal({ open, onOpenChange, onConfirm }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (place: { name: string; latitude: number; longitude: number }) => void
}) {
  const [placeName, setPlaceName] = useState("")
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  type Suggestion = { displayName: string; latitude: number; longitude: number }
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleNameChange(val: string) {
    setPlaceName(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        setLoadingSuggestions(true)
        try {
          const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(val)}`)
          if (res.ok) {
            const json = await res.json()
            setSuggestions(json.suggestions ?? [])
            setShowSuggestions((json.suggestions ?? []).length > 0)
          }
        } finally {
          setLoadingSuggestions(false)
        }
      }, 400)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  function selectSuggestion(s: Suggestion) {
    setPlaceName(s.displayName.split(",")[0].trim())
    setLat(s.latitude)
    setLng(s.longitude)
    setShowSuggestions(false)
    setSuggestions([])
  }

  async function handleGeocode() {
    if (!placeName) return
    setGeocoding(true)
    try {
      const res = await fetch("/api/admin/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: placeName + ", Greece" }),
      })
      if (res.ok) {
        const json = await res.json()
        setLat(json.latitude)
        setLng(json.longitude)
      }
    } finally {
      setGeocoding(false)
    }
  }

  function handleConfirm() {
    if (!placeName || lat === null || lng === null) return
    onConfirm({ name: placeName, latitude: lat, longitude: lng })
    handleClose()
  }

  function handleClose() {
    onOpenChange(false)
    setPlaceName("")
    setLat(null)
    setLng(null)
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true) }}>
      <DialogContent className="sm:max-w-md" style={{ background: "var(--surface-container-lowest)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Add Place</DialogTitle>
          <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
            Search for a place to add to the itinerary route.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {/* Name with suggestions */}
          <div className="flex flex-col gap-1 relative" ref={suggestionsRef}>
            <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Place Name *</Label>
            <div className="relative">
              <Input
                value={placeName}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                placeholder="Type a place name…"
                autoFocus
                autoComplete="off"
                className="h-8 text-xs pr-6"
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
                    <MapPin className="size-3 flex-shrink-0 mt-0.5" style={{ color: "var(--secondary)" }} />
                    <span className="line-clamp-2">{s.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coordinates */}
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Coordinates</Label>
              <div className="flex gap-2">
                <Input value={lat ?? ""} onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lat" type="number" step="any" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                <Input value={lng ?? ""} onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lng" type="number" step="any" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleGeocode} disabled={geocoding || !placeName} className="h-8 text-xs gap-1 flex-shrink-0" style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}>
              <Search className="size-3" />
              {geocoding ? "…" : "Geocode"}
            </Button>
          </div>

          {/* Coordinate preview badge */}
          {lat !== null && lng !== null && (
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-medium text-white"
                style={{ background: "#16A34A", borderRadius: "var(--radius-xs)" }}
              >
                <MapPin className="size-2.5" />
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleClose}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!placeName || lat === null || lng === null}
              className="h-8 text-xs text-white gap-1.5"
              style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
            >
              <Plus className="size-3.5" />
              Add Place
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

export function ItineraryEditorClient({ itinerary }: Props) {
  const router = useRouter()
  const [name, setName] = useState(itinerary.name)
  const [slug, setSlug] = useState(itinerary.slug)
  const [status, setStatus] = useState(itinerary.status)
  const [shortDesc, setShortDesc] = useState(itinerary.shortDesc)
  const [startFrom, setStartFrom] = useState(itinerary.startFrom)
  const [startLatitude, setStartLatitude] = useState(itinerary.startLatitude)
  const [startLongitude, setStartLongitude] = useState(itinerary.startLongitude)
  const [places, setPlaces] = useState(itinerary.places)
  const [totalDays, setTotalDays] = useState(itinerary.totalDays)
  const [totalMiles, setTotalMiles] = useState(itinerary.totalMiles)
  const [defaultMedia, setDefaultMedia] = useState(itinerary.defaultMedia ?? "")
  const [defaultMediaType, setDefaultMediaType] = useState(itinerary.defaultMediaType ?? "image")
  const [days, setDays] = useState<DayData[]>(itinerary.days)

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [generatingStory, setGeneratingStory] = useState(false)

  // Media pickers
  const [heroPickerOpen, setHeroPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Start from suggestions
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
    setStartFrom(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 400)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  function selectSuggestion(s: Suggestion) {
    setStartFrom(s.displayName.split(",")[0].trim())
    setStartLatitude(s.latitude)
    setStartLongitude(s.longitude)
    setShowSuggestions(false)
    setSuggestions([])
  }

  function handleHeroPick(media: PickedMedia | PickedMedia[]) {
    const picked = Array.isArray(media) ? media[0] : media
    if (!picked) return
    setDefaultMedia(picked.url)
    setDefaultMediaType(picked.mimeType.startsWith("video/") ? "video" : "image")
  }

  async function uploadFile(file: File, onDone: (url: string, mime: string) => void) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "itineraries")
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData })
      if (res.ok) {
        const json = await res.json()
        onDone(json.file.url, json.file.mimeType)
      }
    } finally {
      setUploading(false)
    }
  }

  function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadFile(file, (url, mime) => {
      setDefaultMedia(url)
      setDefaultMediaType(mime.startsWith("video/") ? "video" : "image")
    })
    e.target.value = ""
  }

  async function handleGeocodeStart() {
    if (!startFrom) return
    setGeocoding(true)
    try {
      const res = await fetch("/api/admin/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: startFrom + ", Greece" }),
      })
      if (res.ok) {
        const json = await res.json()
        setStartLatitude(json.latitude)
        setStartLongitude(json.longitude)
      }
    } finally {
      setGeocoding(false)
    }
  }

  // ─── Generate Story ──────────────────────────────────────────────────────

  async function handleGenerateStory() {
    setGeneratingStory(true)
    try {
      const res = await fetch(`/api/admin/itineraries/${itinerary.id}/generate-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name?.en || "",
          startFrom,
          totalDays,
          totalMiles,
          places,
          days: days.map((d) => ({
            dayNumber: d.dayNumber,
            description: d.description?.en || "",
            legs: d.legs.map((l) => ({
              name: l.name?.en || "",
              description: l.description?.en || "",
            })),
          })),
        }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.title) {
          setName((prev) => ({ ...prev, en: json.title }))
        }
        if (json.shortDesc) {
          setShortDesc((prev) => ({ ...prev, en: json.shortDesc }))
        }
      } else {
        const json = await res.json().catch(() => ({}))
        alert(json.error || "Story generation failed")
      }
    } catch {
      alert("Story generation failed")
    } finally {
      setGeneratingStory(false)
    }
  }

  // ─── Days management ─────────────────────────────────────────────────────

  function addDay() {
    const newDay: DayData = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      dayNumber: days.length + 1,
      description: { en: "", el: "", de: "" },
      legs: [],
    }
    setDays([...days, newDay])
  }

  function updateDay(index: number, updated: DayData) {
    const newDays = [...days]
    newDays[index] = updated
    setDays(newDays)
  }

  function deleteDay(index: number) {
    const newDays = days.filter((_, i) => i !== index)
    // Renumber days
    setDays(newDays.map((d, i) => ({ ...d, dayNumber: i + 1 })))
  }

  // ─── Places management ───────────────────────────────────────────────────

  const [placeModalOpen, setPlaceModalOpen] = useState(false)

  function addPlace(place: { name: string; latitude: number; longitude: number }) {
    setPlaces([...places, place])
  }

  function deletePlace(index: number) {
    setPlaces(places.filter((_, i) => i !== index))
  }

  // ─── Save ────────────────────────────────────────────────────────────────

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextAutoSave = useRef(false)

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/itineraries/${itinerary.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, status, shortDesc,
          startFrom, startLatitude, startLongitude,
          places, totalDays, totalMiles,
          defaultMedia: defaultMedia || null,
          defaultMediaType: defaultMediaType || null,
          days: days.map((d) => ({
            dayNumber: d.dayNumber,
            description: d.description,
            legs: d.legs.map((l, li) => ({
              sortOrder: li,
              name: l.name,
              description: l.description,
              latitude: l.latitude,
              longitude: l.longitude,
              images: l.images,
            })),
          })),
        }),
      })
      if (res.ok) {
        setLastSaved(new Date())
      }
    } finally {
      setSaving(false)
    }
  }, [itinerary.id, name, slug, status, shortDesc, startFrom, startLatitude, startLongitude, places, totalDays, totalMiles, defaultMedia, defaultMediaType, days])

  // Auto-save debounce — skip the initial render
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { save() }, 2000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [save])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/itineraries")} className="h-8 w-8 p-0">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              {name?.en || "Untitled Itinerary"}
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              {saving ? "Saving…" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleGenerateStory}
            disabled={generatingStory || days.length === 0}
            className="h-7 gap-1.5 text-xs text-white"
            style={{ background: "linear-gradient(135deg, #991B1B, #DC2626)", borderRadius: "var(--radius-xs)" }}
          >
            {generatingStory ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            {generatingStory ? "Generating…" : "Generate Story"}
          </Button>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft" className="text-xs">Draft</SelectItem>
              <SelectItem value="published" className="text-xs">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={save} disabled={saving} className="h-7 gap-1.5 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
            <Save className="size-3" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Main content (2/3) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Name + slug */}
          <div className="rounded-lg p-4 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <TranslatableField label="Itinerary Name" value={name} onChange={(val) => setName(val)} />
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-6 text-[10px]" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>
          </div>

          {/* Short description */}
          <div className="rounded-lg p-4" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <TranslatableField label="Short Description" value={shortDesc} onChange={setShortDesc} multiline />
          </div>

          {/* Places list */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-4" style={{ color: "var(--secondary)" }} />
                <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>Places</Label>
                {places.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(0,99,153,0.1)", color: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
                    {places.length}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPlaceModalOpen(true)} className="h-5 text-[10px] gap-1 px-1.5" style={{ color: "var(--primary)" }}>
                <Plus className="size-3" />
                Add Place
              </Button>
            </div>

            {places.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {places.map((place, i) => (
                  <div
                    key={i}
                    className="group inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1.5 rounded-[4px]"
                    style={{ backgroundImage: "linear-gradient(135deg, #7F1D1D, #991B1B, #7F1D1D)" }}
                  >
                    <MapPin className="size-3 text-white flex-shrink-0" />
                    <span className="text-xs font-medium text-white">{place.name}</span>
                    <span className="text-[9px] font-mono text-white/70 ml-0.5">
                      {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                    </span>
                    <button
                      onClick={() => deletePlace(i)}
                      className="ml-0.5 p-0.5 opacity-70 hover:opacity-100 transition-opacity rounded-[4px] bg-black"
                    >
                      <X className="size-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-center py-2" style={{ color: "var(--on-surface-variant)" }}>No places added yet</p>
            )}
          </div>

          <AddPlaceModal
            open={placeModalOpen}
            onOpenChange={setPlaceModalOpen}
            onConfirm={addPlace}
          />

          {/* ─── Days Tree View ────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="size-4" style={{ color: "var(--primary)" }} />
                <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
                  Itinerary Days
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(0,99,153,0.1)", color: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
                  {days.length} day{days.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                size="sm"
                onClick={addDay}
                className="h-7 gap-1.5 text-xs text-white"
                style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
              >
                <Plus className="size-3.5" />
                Add Day
              </Button>
            </div>

            {days.length === 0 && (
              <div className="w-full py-8 rounded-lg flex flex-col items-center justify-center gap-2" style={{ border: "2px dashed var(--outline-variant)", background: "var(--surface-container)" }}>
                <Route className="size-6" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
                <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>No days added yet. Click &quot;Add Day&quot; to start building.</span>
              </div>
            )}

            {days.map((day, dayIndex) => (
              <DayEditor
                key={day.id}
                day={day}
                onChange={(updated) => updateDay(dayIndex, updated)}
                onDelete={() => deleteDay(dayIndex)}
              />
            ))}

            {days.length > 0 && (
              <Button
                variant="outline" size="sm"
                onClick={addDay}
                className="h-9 text-xs gap-1.5 w-full"
                style={{ borderColor: "var(--primary)", color: "var(--primary)", borderStyle: "dashed" }}
              >
                <Plus className="size-3.5" />
                Add Day {days.length + 1}
              </Button>
            )}
          </div>
        </div>

        {/* ─── Sidebar (1/3) ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Start from */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <MapPin className="size-4" style={{ color: "var(--secondary)" }} />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Start Location</span>
            </div>

            <div className="flex flex-col gap-1 relative" ref={suggestionsRef}>
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Start From</Label>
              <div className="relative">
                <Input
                  value={startFrom}
                  onChange={(e) => handleStartFromChange(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  placeholder="Type a port or marina…"
                  autoComplete="off"
                  className="h-6 text-[10px] pr-6"
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
                      className="w-full text-left px-2.5 py-1.5 text-[10px] flex items-start gap-2 hover:opacity-80 transition-colors cursor-pointer"
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

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Coordinates</Label>
              <div className="flex gap-2">
                <Input value={startLatitude ?? ""} onChange={(e) => setStartLatitude(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lat" type="number" step="any" className="h-6 text-[10px]" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                <Input value={startLongitude ?? ""} onChange={(e) => setStartLongitude(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lng" type="number" step="any" className="h-6 text-[10px]" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <Button variant="outline" size="sm" onClick={handleGeocodeStart} disabled={geocoding || !startFrom} className="h-6 text-[10px] gap-1 mt-1 w-full" style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}>
                <Search className="size-3" />
                {geocoding ? "Geocoding…" : "Geocode"}
              </Button>
            </div>
          </div>

          {/* Itinerary details */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <Route className="size-4" style={{ color: "var(--secondary)" }} />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Details</span>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Number of Days</Label>
              <Input value={totalDays} onChange={(e) => setTotalDays(parseInt(e.target.value) || 0)} type="number" className="h-6 text-[10px]" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Total Miles (nm)</Label>
              <Input value={totalMiles} onChange={(e) => setTotalMiles(parseFloat(e.target.value) || 0)} type="number" step="any" className="h-6 text-[10px]" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>
          </div>

          {/* Hero Media */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <ImageIcon className="size-4" style={{ color: "var(--secondary)" }} />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Hero Media</span>
            </div>

            {defaultMedia ? (
              <div className="relative rounded overflow-hidden group" style={{ border: "1px solid var(--outline-variant)" }}>
                {defaultMediaType === "video" ? (
                  <video src={defaultMedia} controls className="w-full h-36 object-contain bg-black" />
                ) : (
                  <img src={defaultMedia} alt={name?.en || ""} className="w-full h-36 object-cover" />
                )}
                <button
                  onClick={() => { setDefaultMedia(""); setDefaultMediaType("image") }}
                  className="absolute top-1.5 right-1.5 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  <X className="size-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full h-28 rounded flex flex-col items-center justify-center gap-2" style={{ border: "2px dashed var(--outline-variant)", background: "var(--surface-container)" }}>
                <ImageIcon className="size-6" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
                <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>No hero media set</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setHeroPickerOpen(true)} className="flex-1 h-6 text-[10px] gap-1.5" style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}>
                <FolderOpen className="size-3" />
                Library
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1 h-6 text-[10px] gap-1.5" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                Upload
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleHeroUpload} />
            </div>
          </div>

          <MediaPicker open={heroPickerOpen} onClose={() => setHeroPickerOpen(false)} onSelect={handleHeroPick} accept="all" />

          {/* Route Map */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <Route className="size-4" style={{ color: "var(--secondary)" }} />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Route Map</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(0,99,153,0.1)", color: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
                {(() => {
                  let count = 0
                  if (startLatitude && startLongitude) count++
                  for (const p of places) { if (p.latitude && p.longitude) count++ }
                  for (const d of days) { for (const l of d.legs) { if (l.latitude && l.longitude) count++ } }
                  return `${count} point${count !== 1 ? "s" : ""}`
                })()}
              </span>
            </div>
            {(() => {
              const routePoints: RoutePoint[] = []
              const pointSources: Array<{ kind: "place"; placeIndex: number }> = []
              let order = 1
              places.forEach((p, pi) => {
                if (p.latitude && p.longitude) {
                  routePoints.push({ lat: p.latitude, lng: p.longitude, label: p.name, type: "place", order: order++ })
                  pointSources.push({ kind: "place", placeIndex: pi })
                }
              })

              function handlePointDrag(pointIndex: number, lat: number, lng: number) {
                const src = pointSources[pointIndex]
                if (!src) return
                const newPlaces = [...places]
                newPlaces[src.placeIndex] = { ...newPlaces[src.placeIndex], latitude: lat, longitude: lng }
                setPlaces(newPlaces)
              }

              return <RouteMap points={routePoints} onPointDrag={handlePointDrag} />
            })()}
            {/* Points list */}
            {(() => {
              const allPoints = places.filter((p) => p.latitude && p.longitude)
              if (allPoints.length === 0) return null
              return (
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {allPoints.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                      <span
                        className="size-2 rounded-full flex-shrink-0"
                        style={{ background: "var(--secondary)" }}
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                      <code className="text-[9px] font-mono">{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</code>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
