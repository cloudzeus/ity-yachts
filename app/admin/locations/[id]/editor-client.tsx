"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Search, Globe, Image as ImageIcon, MapPin, Sparkles, Loader2, Upload, FolderOpen, X, Plus, GripVertical, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"

type LocationData = {
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
  metaTitle: string | null
  metaDesc: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  location: LocationData
}

function TranslatableField({ label, field, value, onChange, multiline }: {
  label: string
  field: string
  value: Record<string, string>
  onChange: (val: Record<string, string>) => void
  multiline?: boolean
}) {
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
  const inputProps = multiline ? { className: "text-xs min-h-16" } : { className: "h-7 text-xs" }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{label}</Label>
        <Button variant="ghost" size="sm" onClick={handleTranslate} disabled={translating || !value.en} className="h-5 text-[10px] gap-1 px-1.5" style={{ color: "var(--primary)" }}>
          <Globe className="size-3" />
          {translating ? "…" : "Translate"}
        </Button>
      </div>
      <div className="flex gap-2">
        {(["en", "el", "de"] as const).map((lang) => (
          <div key={lang} className="flex flex-col gap-1 flex-1">
            <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>{lang}</Label>
            <InputComponent
              value={value[lang] || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [lang]: e.target.value })}
              {...inputProps}
              style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LocationEditorClient({ location }: Props) {
  const router = useRouter()
  const [name, setName] = useState(location.name)
  const [slug, setSlug] = useState(location.slug)
  const [status, setStatus] = useState(location.status)
  const [nameTranslations, setNameTranslations] = useState(location.nameTranslations)
  const [shortDesc, setShortDesc] = useState(location.shortDesc)
  const [description, setDescription] = useState(location.description)
  const [prefecture, setPrefecture] = useState(location.prefecture)
  const [city, setCity] = useState(location.city)
  const [municipality, setMunicipality] = useState(location.municipality)
  const [latitude, setLatitude] = useState(location.latitude)
  const [longitude, setLongitude] = useState(location.longitude)
  const [defaultMedia, setDefaultMedia] = useState(location.defaultMedia ?? "")
  const [defaultMediaType, setDefaultMediaType] = useState(location.defaultMediaType ?? "image")
  const [images, setImages] = useState<string[]>(location.images)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Media pickers
  const [heroPickerOpen, setHeroPickerOpen] = useState(false)
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  function handleHeroPick(media: PickedMedia | PickedMedia[]) {
    const picked = Array.isArray(media) ? media[0] : media
    if (!picked) return
    setDefaultMedia(picked.url)
    setDefaultMediaType(picked.mimeType.startsWith("video/") ? "video" : "image")
  }

  function handleGalleryPick(media: PickedMedia | PickedMedia[]) {
    const picked = Array.isArray(media) ? media : [media]
    const newUrls = picked.map((m) => m.url).filter((u) => !images.includes(u))
    if (newUrls.length > 0) setImages((prev) => [...prev, ...newUrls])
  }

  async function uploadFile(file: File, onDone: (url: string, mime: string) => void) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "locations")
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData })
      if (res.ok) {
        const json = await res.json()
        const media = json.file
        onDone(media.url, media.mimeType)
      } else {
        alert("Upload failed")
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

  function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      uploadFile(file, (url) => {
        setImages((prev) => [...prev, url])
      })
    })
    e.target.value = ""
  }

  function removeGalleryImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, status, nameTranslations, shortDesc, description,
          prefecture, city, municipality, latitude, longitude,
          defaultMedia: defaultMedia || null,
          defaultMediaType: defaultMediaType || null,
          images,
        }),
      })
      if (res.ok) setLastSaved(new Date())
    } finally {
      setSaving(false)
    }
  }, [location.id, name, slug, status, nameTranslations, shortDesc, description, prefecture, city, municipality, latitude, longitude, defaultMedia, defaultMediaType, images])

  // Auto-save debounce
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { save() }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [save])

  async function handleGeocode() {
    const address = [city, municipality, "Greece"].filter(Boolean).join(", ")
    if (!address) return
    setGeocoding(true)
    try {
      const res = await fetch("/api/admin/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
      if (res.ok) {
        const json = await res.json()
        setLatitude(json.latitude)
        setLongitude(json.longitude)
      }
    } finally {
      setGeocoding(false)
    }
  }

  async function handleGenerateContent() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/admin/locations/${location.id}/generate-content`, {
        method: "POST",
      })
      if (res.ok) {
        const json = await res.json()
        if (json.shortDesc) setShortDesc((prev) => ({ ...prev, en: json.shortDesc }))
        if (json.description) setDescription((prev) => ({ ...prev, en: json.description }))
      } else {
        const json = await res.json()
        alert(json.error || "Content generation failed")
      }
    } catch {
      alert("Content generation failed")
    } finally {
      setGenerating(false)
    }
  }

  function handleNameEnChange(val: string) {
    setName(val)
    setNameTranslations((prev) => ({ ...prev, en: val }))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/locations")} className="h-8 w-8 p-0">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              {name || "Untitled Location"}
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              {saving ? "Saving…" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Name translations */}
          <div className="rounded-lg p-4 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <TranslatableField label="Location Name" field="name" value={nameTranslations} onChange={(val) => { setNameTranslations(val); if (val.en) setName(val.en) }} />

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>
          </div>

          {/* Generate content */}
          <Button
            variant="outline"
            onClick={handleGenerateContent}
            disabled={generating || !name}
            className="w-full h-9 text-xs gap-2"
            style={{ borderColor: "var(--primary)", color: "var(--primary)", borderRadius: "var(--radius-xs)" }}
          >
            {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {generating ? "Generating travel content…" : "Generate Content via DeepSeek"}
          </Button>

          {/* Short description */}
          <div className="rounded-lg p-4" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <TranslatableField label="Short Description" field="shortDesc" value={shortDesc} onChange={setShortDesc} multiline />
          </div>

          {/* Full description */}
          <div className="rounded-lg p-4" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <TranslatableField label="Description" field="description" value={description} onChange={setDescription} multiline />
          </div>

          {/* Prefecture */}
          <div className="rounded-lg p-4" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <TranslatableField label="Prefecture" field="prefecture" value={prefecture} onChange={setPrefecture} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Location details */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <MapPin className="size-4" style={{ color: "var(--secondary)" }} />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Location Details</span>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Municipality</Label>
              <Input value={municipality} onChange={(e) => setMunicipality(e.target.value)} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Coordinates</Label>
              <div className="flex gap-2">
                <Input value={latitude ?? ""} onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lat" type="number" step="any" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
                <Input value={longitude ?? ""} onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Lng" type="number" step="any" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <Button variant="outline" size="sm" onClick={handleGeocode} disabled={geocoding || (!city && !municipality)} className="h-7 text-xs gap-1 mt-1 w-full" style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}>
                <Search className="size-3" />
                {geocoding ? "Geocoding…" : "Geocode from City"}
              </Button>
            </div>
          </div>

          {/* Default media */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <ImageIcon className="size-4" style={{ color: "var(--secondary)" }} />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Hero Media</span>
            </div>

            {defaultMedia ? (
              <div className="relative rounded overflow-hidden group" style={{ border: "1px solid var(--outline-variant)" }}>
                {defaultMediaType === "video" ? (
                  <video
                    src={defaultMedia}
                    controls
                    className="w-full h-44 object-contain bg-black"
                  />
                ) : (
                  <img src={defaultMedia} alt={name} className="w-full h-36 object-cover" />
                )}
                <button
                  onClick={() => { setDefaultMedia(""); setDefaultMediaType("image") }}
                  className="absolute top-1.5 right-1.5 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  <X className="size-3 text-white" />
                </button>
                <span className="absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded font-medium text-white" style={{ background: "rgba(0,0,0,0.5)", borderRadius: "var(--radius-xs)" }}>
                  {defaultMediaType === "video" ? "Video" : "Image"}
                </span>
              </div>
            ) : (
              <div className="w-full h-28 rounded flex flex-col items-center justify-center gap-2" style={{ border: "2px dashed var(--outline-variant)", background: "var(--surface-container)" }}>
                <ImageIcon className="size-6" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
                <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>No hero media set</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setHeroPickerOpen(true)}
                className="flex-1 h-7 text-xs gap-1.5"
                style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}
              >
                <FolderOpen className="size-3" />
                Library
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 h-7 text-xs gap-1.5"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                Upload
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleHeroUpload} />
            </div>
          </div>

          {/* Image gallery */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4" style={{ color: "var(--secondary)" }} />
                <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Gallery</span>
                {images.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(0,99,153,0.1)", color: "var(--secondary)", borderRadius: "var(--radius-xs)" }}>
                    {images.length}
                  </span>
                )}
              </div>
            </div>

            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {images.map((url, i) => {
                  const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(url)
                  return (
                    <div key={`${url}-${i}`} className="relative rounded overflow-hidden group aspect-square" style={{ border: "1px solid var(--outline-variant)" }}>
                      {isVideo ? (
                        <>
                          <video src={url} muted preload="metadata" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="rounded-full p-1.5" style={{ background: "rgba(0,0,0,0.5)" }}>
                              <Play className="size-3 text-white" fill="white" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => removeGalleryImage(url)}
                        className="absolute top-1 right-1 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                      >
                        <X className="size-2.5 text-white" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[8px] px-1 py-0.5 rounded font-medium text-white" style={{ background: "rgba(0,0,0,0.5)", borderRadius: "var(--radius-xs)" }}>
                          Cover
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="w-full py-6 rounded flex flex-col items-center justify-center gap-2" style={{ border: "2px dashed var(--outline-variant)", background: "var(--surface-container)" }}>
                <ImageIcon className="size-5" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
                <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>No gallery images yet</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setGalleryPickerOpen(true)}
                className="flex-1 h-7 text-xs gap-1.5"
                style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}
              >
                <FolderOpen className="size-3" />
                From Library
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 h-7 text-xs gap-1.5"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                Upload
              </Button>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
            </div>
          </div>

          {/* Media pickers */}
          <MediaPicker open={heroPickerOpen} onClose={() => setHeroPickerOpen(false)} onSelect={handleHeroPick} accept="all" />
          <MediaPicker open={galleryPickerOpen} onClose={() => setGalleryPickerOpen(false)} onSelect={handleGalleryPick} accept="image" multiple />
        </div>
      </div>
    </div>
  )
}
