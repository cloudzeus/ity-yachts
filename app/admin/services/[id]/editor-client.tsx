"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Globe, Sparkles, Image as ImageIcon, Upload, FolderOpen, Loader2, X, Languages, ChevronDown, Check, Link2 } from "lucide-react"
import { icons } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

type ServiceData = {
  id: string
  title: Record<string, string>
  slug: string
  status: string
  label: Record<string, string>
  header: Record<string, string>
  shortDesc: Record<string, string>
  description: Record<string, string>
  defaultMedia: string | null
  defaultMediaType: string | null
  icon: string | null
  certification: Certification | null
  link: string | null
  showOnHomepage: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

type PageOption = { id: string; name: string; slug: string; status: string }

/** An accrediting body, when a service leads to one. */
type Certification = {
  logo?: string
  name?: Record<string, string>
  body?: Record<string, string>
}

interface Props {
  service: ServiceData
}

const LANGS = ["en", "el", "de"] as const
type Lang = (typeof LANGS)[number]
const LANG_LABELS: Record<Lang, string> = { en: "English", el: "Greek", de: "German" }
const LANG_FLAGS: Record<Lang, string> = { en: "🇬🇧", el: "🇬🇷", de: "🇩🇪" }

// Get all lucide icon names for the picker
const ALL_ICON_NAMES = Object.keys(icons).sort()

// ─── Dynamic Lucide Icon Renderer ───────────────────────────────────────────

function LucideIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = icons[name as keyof typeof icons]
  if (!IconComponent) return null
  return <IconComponent className={className} style={style} />
}

// ─── Icon Picker Combobox ───────────────────────────────────────────────────

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!search) return ALL_ICON_NAMES.slice(0, 80)
    const q = search.toLowerCase()
    return ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 80)
  }, [search])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch("") }}
        className="flex items-center justify-between w-full h-8 px-2 text-xs rounded-md border gap-2"
        style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
      >
        <span className="flex items-center gap-2 min-w-0">
          {value ? (
            <>
              <LucideIcon name={value} className="size-4 shrink-0" style={{ color: "var(--primary)" }} />
              <span className="truncate" style={{ color: "var(--on-surface)" }}>{value}</span>
            </>
          ) : (
            <span style={{ color: "var(--on-surface-variant)", opacity: 0.6 }}>Select icon…</span>
          )}
        </span>
        <ChevronDown className="size-3.5 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border shadow-lg flex flex-col"
          style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)", maxHeight: 320 }}
        >
          <div className="p-1.5 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons…"
              className="h-7 text-xs"
              style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 264 }}>
            {value && (
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-black/5 transition-colors italic"
                style={{ color: "var(--on-surface-variant)" }}
                onClick={() => { onChange(""); setOpen(false); setSearch("") }}
              >
                Clear selection
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-center" style={{ color: "var(--on-surface-variant)" }}>No icons found</p>
            ) : (
              <div className="grid grid-cols-1 gap-0">
                {filtered.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-black/5 transition-colors flex items-center gap-2"
                    style={{ color: "var(--on-surface)", background: name === value ? "rgba(0,99,153,0.06)" : undefined }}
                    onClick={() => { onChange(name); setOpen(false); setSearch("") }}
                  >
                    <LucideIcon name={name} className="size-4 shrink-0" style={{ color: name === value ? "var(--primary)" : "var(--on-surface-variant)" }} />
                    <span className="truncate flex-1">{name}</span>
                    {name === value && <Check className="size-3 shrink-0" style={{ color: "var(--primary)" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!search && (
            <div className="px-3 py-1.5 border-t text-[10px]" style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}>
              Type to search {ALL_ICON_NAMES.length} icons
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page Link Combobox ─────────────────────────────────────────────────────

function PageLinkPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [pages, setPages] = useState<PageOption[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fetched = useRef(false)

  // Fetch pages on first open
  useEffect(() => {
    if (open && !fetched.current) {
      fetched.current = true
      setLoading(true)
      fetch("/api/admin/pages?pageSize=100")
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.pages) setPages(json.pages)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!search) return pages
    const q = search.toLowerCase()
    return pages.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
  }, [search, pages])

  const selectedPage = pages.find((p) => `/${p.slug}` === value || p.slug === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch("") }}
        className="flex items-center justify-between w-full h-8 px-2 text-xs rounded-md border gap-2"
        style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
      >
        <span className="flex items-center gap-2 min-w-0">
          {value ? (
            <>
              <Link2 className="size-3.5 shrink-0" style={{ color: "var(--primary)" }} />
              <span className="truncate" style={{ color: "var(--on-surface)" }}>
                {selectedPage ? selectedPage.name : value}
              </span>
            </>
          ) : (
            <span style={{ color: "var(--on-surface-variant)", opacity: 0.6 }}>Select page…</span>
          )}
        </span>
        <ChevronDown className="size-3.5 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border shadow-lg flex flex-col"
          style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)", maxHeight: 280 }}
        >
          <div className="p-1.5 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages…"
              className="h-7 text-xs"
              style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 224 }}>
            {value && (
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-black/5 transition-colors italic"
                style={{ color: "var(--on-surface-variant)" }}
                onClick={() => { onChange(""); setOpen(false); setSearch("") }}
              >
                Clear selection
              </button>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 className="size-3.5 animate-spin" style={{ color: "var(--on-surface-variant)" }} />
                <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Loading pages…</span>
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-center" style={{ color: "var(--on-surface-variant)" }}>No pages found</p>
            ) : (
              filtered.map((page) => {
                const pageLink = `/${page.slug}`
                const isSelected = pageLink === value
                return (
                  <button
                    key={page.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 transition-colors flex items-center gap-2"
                    style={{ color: "var(--on-surface)", background: isSelected ? "rgba(0,99,153,0.06)" : undefined }}
                    onClick={() => { onChange(pageLink); setOpen(false); setSearch("") }}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{page.name}</span>
                      <span className="block truncate mt-0.5" style={{ color: "var(--on-surface-variant)", fontSize: 10 }}>/{page.slug}</span>
                    </div>
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium"
                      style={{
                        background: page.status === "published" ? "rgba(45,106,79,0.12)" : "rgba(117,117,117,0.12)",
                        color: page.status === "published" ? "#4F7A46" : "#6B5F57",
                      }}
                    >
                      {page.status}
                    </span>
                    {isSelected && <Check className="size-3 shrink-0" style={{ color: "var(--primary)" }} />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Editor ────────────────────────────────────────────────────────────

export function ServiceEditorClient({ service }: Props) {
  const router = useRouter()
  const [activeLang, setActiveLang] = useState<Lang>("en")
  const [title, setTitle] = useState(service.title)
  const [slug, setSlug] = useState(service.slug)
  const [status, setStatus] = useState(service.status)
  const [label, setLabel] = useState(service.label)
  const [header, setHeader] = useState(service.header)
  const [shortDesc, setShortDesc] = useState(service.shortDesc)
  const [description, setDescription] = useState(service.description)
  const [defaultMedia, setDefaultMedia] = useState(service.defaultMedia ?? "")
  const [defaultMediaType, setDefaultMediaType] = useState(service.defaultMediaType ?? "")
  const [icon, setIcon] = useState(service.icon ?? "")
  const [certification, setCertification] = useState<Certification | null>(service.certification ?? null)
  const [certPickerOpen, setCertPickerOpen] = useState(false)
  const [link, setLink] = useState(service.link ?? "")
  const [showOnHomepage, setShowOnHomepage] = useState(service.showOnHomepage)

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [translatingAll, setTranslatingAll] = useState(false)
  const [generatingContent, setGeneratingContent] = useState(false)

  // Media
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePick(media: PickedMedia | PickedMedia[]) {
    const picked = Array.isArray(media) ? media[0] : media
    if (picked) {
      setDefaultMedia(picked.url)
      setDefaultMediaType(picked.mimeType.startsWith("video/") ? "video" : "image")
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "services")
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData })
      if (res.ok) {
        const json = await res.json()
        setDefaultMedia(json.file.url)
        setDefaultMediaType(json.file.mimeType.startsWith("video/") ? "video" : "image")
      }
    } finally {
      setUploading(false)
    }
    e.target.value = ""
  }

  // Translate all fields from EN → EL + DE
  async function handleTranslateAll() {
    const fields = [
      { key: "title", value: title?.en },
      { key: "label", value: label?.en },
      { key: "header", value: header?.en },
      { key: "shortDesc", value: shortDesc?.en },
      { key: "description", value: description?.en },
    ].filter((f) => f.value)

    if (fields.length === 0) return
    setTranslatingAll(true)
    try {
      for (const field of fields) {
        const res = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: field.value, languages: ["el", "de"] }),
        })
        if (!res.ok) continue
        const json = await res.json()
        const t = json.translations
        switch (field.key) {
          case "title": setTitle((prev) => ({ ...prev, el: t.el || prev.el, de: t.de || prev.de })); break
          case "label": setLabel((prev) => ({ ...prev, el: t.el || prev.el, de: t.de || prev.de })); break
          case "header": setHeader((prev) => ({ ...prev, el: t.el || prev.el, de: t.de || prev.de })); break
          case "shortDesc": setShortDesc((prev) => ({ ...prev, el: t.el || prev.el, de: t.de || prev.de })); break
          case "description": setDescription((prev) => ({ ...prev, el: t.el || prev.el, de: t.de || prev.de })); break
        }
      }
    } finally {
      setTranslatingAll(false)
    }
  }

  // Generate all content with AI assistance (EN + translations to EL & DE)
  async function handleGenerateContent() {
    setGeneratingContent(true)
    try {
      const res = await fetch(`/api/admin/services/${service.id}/generate-content`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        alert(err.error || "Content generation failed")
        return
      }
      const data = await res.json()
      if (data.description) setDescription(data.description)
    } finally {
      setGeneratingContent(false)
    }
  }

  function langHasContent(lang: Lang) {
    return !!(title?.[lang] || label?.[lang] || header?.[lang] || shortDesc?.[lang] || description?.[lang])
  }

  // Auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, slug, status, label, header, shortDesc, description,
          defaultMedia: defaultMedia || null,
          defaultMediaType: defaultMediaType || null,
          icon: icon || null,
          certification,
          link: link || null,
          showOnHomepage,
        }),
      })
      if (res.ok) setLastSaved(new Date())
    } finally {
      setSaving(false)
    }
  }, [service.id, title, slug, status, label, header, shortDesc, description, defaultMedia, defaultMediaType, icon, certification, link, showOnHomepage])

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { save() }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [save])

  const updateField = (setter: React.Dispatch<React.SetStateAction<Record<string, string>>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setter((prev) => ({ ...prev, [activeLang]: e.target.value }))

  /* The rich editor hands back a string rather than an event. */
  const updateValue = (setter: React.Dispatch<React.SetStateAction<Record<string, string>>>) =>
    (value: string) =>
      setter((prev) => ({ ...prev, [activeLang]: value }))

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/services")} className="h-8 w-8 p-0">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              {title?.en || "Untitled Service"}
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
        <div className="lg:col-span-2 flex flex-col gap-0">

          {/* Language tab bar + translate all */}
          {/* Wraps rather than overflowing: on a narrow column the two action
              buttons were pushed off the right edge and could not be reached. */}
          <div
            className="flex flex-wrap items-center justify-between gap-y-2 rounded-t-lg px-4 py-0"
            style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)", borderBottom: "none" }}
          >
            <div className="flex items-center gap-0">
              <Languages className="size-4 mr-2" style={{ color: "var(--on-surface-variant)" }} />
              {LANGS.map((lang) => {
                const isActive = activeLang === lang
                const hasContent = langHasContent(lang)
                return (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className="relative px-4 py-3 text-xs font-medium transition-colors"
                    style={{
                      color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                      background: isActive ? "rgba(0,99,153,0.06)" : "transparent",
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{LANG_FLAGS[lang]}</span>
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
            </div>

            <div className="flex items-center gap-2 py-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateContent}
                disabled={generatingContent || !title?.en}
                className="h-7 text-[10px] gap-1.5"
                style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}
                title={!title?.en ? "Add an English title first" : "Generate the full description in EN, EL and DE with AI assistance"}
              >
                {generatingContent ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                {generatingContent ? "Generating…" : "Generate Content"}
              </Button>

              {activeLang === "en" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTranslateAll}
                  disabled={translatingAll}
                  className="h-7 text-[10px] gap-1.5"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                >
                  <Globe className="size-3" />
                  {translatingAll ? "Translating…" : "Translate All → EL & DE"}
                </Button>
              )}
            </div>
          </div>

          {/* All translatable fields for active language */}
          <div
            className="rounded-b-lg p-5 flex flex-col gap-5"
            style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}
          >
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                Service Title
              </Label>
              <Input
                value={title?.[activeLang] || ""}
                onChange={updateField(setTitle)}
                placeholder={`Service title in ${LANG_LABELS[activeLang]}…`}
                className="h-9 text-sm"
                style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
              />
            </div>

            {/* Label / Badge */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                Label / Badge
              </Label>
              <Input
                value={label?.[activeLang] || ""}
                onChange={updateField(setLabel)}
                placeholder={`Badge text in ${LANG_LABELS[activeLang]}…`}
                className="h-9 text-sm"
                style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
              />
              <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                Small tag shown above the title (e.g. &quot;Tailored Journeys&quot;)
              </span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                Header
              </Label>
              <Input
                value={header?.[activeLang] || ""}
                onChange={updateField(setHeader)}
                placeholder={`Header in ${LANG_LABELS[activeLang]}…`}
                className="h-9 text-sm"
                style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
              />
            </div>

            {/* Divider */}
            <div className="h-px" style={{ background: "var(--outline-variant)" }} />

            {/* Short Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                Short Description
              </Label>
              {/* Compact mode: a card summary wants emphasis and a link at most,
                  not headings and images. */}
              <RichTextEditor
                compact
                value={shortDesc?.[activeLang] || ""}
                onChange={updateValue(setShortDesc)}
                placeholder={`Short description in ${LANG_LABELS[activeLang]}…`}
              />
              <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                Displayed on the homepage card and the services list
              </span>
            </div>

            {/* Full Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                Full Description
              </Label>
              <RichTextEditor
                value={description?.[activeLang] || ""}
                onChange={updateValue(setDescription)}
                placeholder={`Full description in ${LANG_LABELS[activeLang]}…`}
              />
              <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                Detailed description shown on the service page
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Settings */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <Sparkles className="size-4" style={{ color: "var(--secondary)" }} />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Settings</span>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-7 text-xs" style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Link (internal page)</Label>
              <PageLinkPicker value={link} onChange={setLink} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Icon</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            {/* Certification. Follows the language tab above, so the name and
                the sentence are written one language at a time like everything
                else on this page. */}
            <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid var(--outline-variant)" }}>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
                  Certification ({LANG_LABELS[activeLang]})
                </Label>
                {certification && (
                  <button
                    onClick={() => setCertification(null)}
                    className="text-[10px] underline"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {certification?.logo ? (
                <div className="relative h-16 w-full overflow-hidden rounded-md" style={{ background: "#ffffff", border: "1px solid var(--outline-variant)" }}>
                  <Image src={certification.logo} alt="" fill sizes="240px" className="object-contain p-2" />
                </div>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => setCertPickerOpen(true)}
                style={{ borderColor: "var(--outline-variant)" }}
              >
                <ImageIcon className="mr-1.5 size-3" />
                {certification?.logo ? "Change logo" : "Choose logo"}
              </Button>

              <Input
                value={certification?.name?.[activeLang] ?? ""}
                onChange={(e) =>
                  setCertification((prev) => ({
                    ...prev,
                    name: { ...(prev?.name ?? {}), [activeLang]: e.target.value },
                  }))
                }
                placeholder="Awarding body"
                className="h-7 text-xs"
                style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
              />
              <textarea
                value={certification?.body?.[activeLang] ?? ""}
                onChange={(e) =>
                  setCertification((prev) => ({
                    ...prev,
                    body: { ...(prev?.body ?? {}), [activeLang]: e.target.value },
                  }))
                }
                placeholder="What the certificate is, in one or two sentences"
                rows={4}
                className="rounded-md px-2 py-1.5 text-xs"
                style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", color: "var(--on-surface)" }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowOnHomepage(!showOnHomepage)}
                className="flex items-center gap-2 text-xs"
                style={{ color: "var(--on-surface)" }}
              >
                {showOnHomepage ? (
                  <div className="w-8 h-[18px] rounded-full flex items-center px-0.5 transition-colors" style={{ background: "var(--primary)" }}>
                    <div className="w-3.5 h-3.5 rounded-full bg-white translate-x-3.5 transition-transform" />
                  </div>
                ) : (
                  <div className="w-8 h-[18px] rounded-full flex items-center px-0.5 transition-colors" style={{ background: "var(--outline-variant)" }}>
                    <div className="w-3.5 h-3.5 rounded-full bg-white transition-transform" />
                  </div>
                )}
                Show on Homepage
              </button>
            </div>
          </div>

          {/* Media */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <ImageIcon className="size-4" style={{ color: "var(--secondary)" }} />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Media</span>
            </div>

            {defaultMedia ? (
              <div className="relative rounded overflow-hidden group" style={{ border: "1px solid var(--outline-variant)" }}>
                {defaultMediaType === "video" ? (
                  <video src={defaultMedia} className="w-full h-40 object-cover" muted controls />
                ) : (
                  <Image src={defaultMedia} alt={title?.en || ""} width={640} height={160} className="w-full h-40 object-cover" />
                )}
                <button
                  onClick={() => { setDefaultMedia(""); setDefaultMediaType("") }}
                  className="absolute top-1.5 right-1.5 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  <X className="size-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full h-28 rounded flex flex-col items-center justify-center gap-2" style={{ border: "2px dashed var(--outline-variant)", background: "var(--surface-container)" }}>
                <ImageIcon className="size-5" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
                <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>No media</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="flex-1 h-7 text-xs gap-1.5" style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}>
                <FolderOpen className="size-3" />
                Library
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1 h-7 text-xs gap-1.5" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                Upload
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>

          <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePick} accept="all" />

          <MediaPicker
            open={certPickerOpen}
            accept="image"
            onClose={() => setCertPickerOpen(false)}
            onSelect={(media) => {
              const one = Array.isArray(media) ? media[0] : (media as PickedMedia)
              if (one) setCertification((prev) => ({ ...prev, logo: one.url }))
              setCertPickerOpen(false)
            }}
          />
        </div>
      </div>
    </div>
  )
}
