"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft, Save, Globe, ImageIcon, Upload, X, Plus, Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"

type ArticleData = {
  id: string
  title: Record<string, string>
  slug: string
  status: string
  date: string
  category: Record<string, string>
  author: string
  shortDesc: Record<string, string>
  description: Record<string, string>
  defaultMedia: string | null
  defaultMediaType: string | null
  media: string[]
  sortOrder: number
  metaTitle: string | null
  metaDesc: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  article: ArticleData
}

/* ─── Translatable Field ──────────────────────────────────────────────── */

function TranslatableField({ label, value, onChange, multiline }: {
  label: string
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
  const inputProps = multiline
    ? { className: "text-xs min-h-16 resize-none" }
    : { className: "h-7 text-xs" }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{label}</Label>
        <Button variant="ghost" size="sm" onClick={handleTranslate} disabled={translating || !value.en} className="h-5 text-[10px] gap-1 px-1.5" style={{ color: "var(--primary)" }}>
          <Globe className="size-3" />
          {translating ? "..." : "Translate"}
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

/* ─── Main Editor ─────────────────────────────────────────────────────── */

export function ArticleEditorClient({ article }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(article.title)
  const [slug, setSlug] = useState(article.slug)
  const [status, setStatus] = useState(article.status)
  const [date, setDate] = useState(article.date.slice(0, 10))
  const [category, setCategory] = useState(article.category)
  const [author, setAuthor] = useState(article.author)
  const [shortDesc, setShortDesc] = useState(article.shortDesc)
  const [description, setDescription] = useState(article.description)
  const [defaultMedia, setDefaultMedia] = useState(article.defaultMedia ?? "")
  const [defaultMediaType, setDefaultMediaType] = useState(article.defaultMediaType ?? "image")
  const [media, setMedia] = useState<string[]>(article.media)
  const [metaTitle, setMetaTitle] = useState(article.metaTitle ?? "")
  const [metaDesc, setMetaDesc] = useState(article.metaDesc ?? "")
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Media pickers
  const [heroPickerOpen, setHeroPickerOpen] = useState(false)
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)

  function handleHeroPick(m: PickedMedia | PickedMedia[]) {
    const picked = Array.isArray(m) ? m[0] : m
    if (!picked) return
    setDefaultMedia(picked.url)
    setDefaultMediaType(picked.mimeType.startsWith("video/") ? "video" : "image")
  }

  function handleGalleryPick(m: PickedMedia | PickedMedia[]) {
    const picked = Array.isArray(m) ? m : [m]
    const newUrls = picked.map((p) => p.url).filter((u) => !media.includes(u))
    if (newUrls.length > 0) setMedia((prev) => [...prev, ...newUrls])
  }

  function removeMedia(url: string) {
    setMedia((prev) => prev.filter((u) => u !== url))
  }

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, slug, status, date, category, author,
          shortDesc, description,
          defaultMedia: defaultMedia || null,
          defaultMediaType: defaultMediaType || null,
          media,
          metaTitle: metaTitle || null,
          metaDesc: metaDesc || null,
        }),
      })
      if (res.ok) setLastSaved(new Date())
    } finally {
      setSaving(false)
    }
  }, [article.id, title, slug, status, date, category, author, shortDesc, description, defaultMedia, defaultMediaType, media, metaTitle, metaDesc])

  // Auto-save debounce (1.5s)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { save() }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [save])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/articles")} className="h-8 w-8 p-0" style={{ color: "var(--primary)" }}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
              {title.en || "Untitled Article"}
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              /{slug}
              {lastSaved && (
                <span className="ml-3">
                  Saved {lastSaved.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {saving && <span className="ml-3">Saving...</span>}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={save} disabled={saving} className="h-8 gap-2 text-xs text-white" style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}>
          <Save className="size-3.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Content grid: 2/3 main + 1/3 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Title */}
          <TranslatableField label="Title" value={title} onChange={setTitle} />

          {/* Slug */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="h-7 text-xs font-mono"
              style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
            />
          </div>

          {/* Category */}
          <TranslatableField label="Category" value={category} onChange={setCategory} />

          {/* Short Description */}
          <TranslatableField label="Short Description" value={shortDesc} onChange={setShortDesc} multiline />

          {/* Description (rich) */}
          <TranslatableField label="Full Description" value={description} onChange={setDescription} multiline />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Author */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>Author</Label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className="h-7 text-xs"
              style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>Date</Label>
            <Input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              className="h-7 text-xs"
              style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
            />
          </div>

          {/* Default Media */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>Featured Image / Video</Label>
            {defaultMedia ? (
              <div className="relative rounded-md overflow-hidden" style={{ border: "1px solid var(--outline-variant)" }}>
                {defaultMediaType === "video" ? (
                  <div className="flex items-center justify-center h-32 bg-black/80">
                    <Play className="size-8 text-white/60" />
                    <span className="text-xs text-white/60 ml-2 truncate max-w-[160px]">
                      {defaultMedia.split("/").pop()}
                    </span>
                  </div>
                ) : (
                  <div className="relative h-32">
                    <Image src={defaultMedia} alt="Featured" fill className="object-cover" sizes="300px" />
                  </div>
                )}
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    onClick={() => setHeroPickerOpen(true)}
                    className="flex items-center justify-center h-6 w-6 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <Upload className="size-3" />
                  </button>
                  <button
                    onClick={() => { setDefaultMedia(""); setDefaultMediaType("image") }}
                    className="flex items-center justify-center h-6 w-6 rounded bg-black/60 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setHeroPickerOpen(true)}
                className="flex flex-col items-center justify-center gap-2 h-32 rounded-md transition-colors hover:bg-[var(--surface-container-high)]"
                style={{ border: "2px dashed var(--outline-variant)", color: "var(--on-surface-variant)" }}
              >
                <ImageIcon className="size-5" />
                <span className="text-[10px] uppercase tracking-wide font-medium">Choose Media</span>
              </button>
            )}
          </div>

          {/* SEO */}
          <div className="flex flex-col gap-3 rounded-lg p-4" style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)" }}>
            <Label className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>SEO / Meta</Label>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Meta Title</Label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SEO title (defaults to article title)"
                className="h-7 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Meta Description</Label>
              <Textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder="SEO description (defaults to short description)"
                className="text-xs min-h-16 resize-none"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            </div>
          </div>

          {/* Media Gallery */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>Media Gallery</Label>
              <Button variant="ghost" size="sm" onClick={() => setGalleryPickerOpen(true)} className="h-5 text-[10px] gap-1 px-1.5" style={{ color: "var(--primary)" }}>
                <Plus className="size-3" />
                Add
              </Button>
            </div>
            {media.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {media.map((url, i) => {
                  const isVideo = url.match(/\.(mp4|mov|webm|avi)$/i)
                  return (
                    <div key={i} className="relative group rounded overflow-hidden aspect-square" style={{ border: "1px solid var(--outline-variant)" }}>
                      {isVideo ? (
                        <div className="w-full h-full bg-black/80 flex items-center justify-center">
                          <Play className="size-4 text-white/60" />
                        </div>
                      ) : (
                        <Image src={url} alt="" fill className="object-cover" sizes="100px" />
                      )}
                      <button
                        onClick={() => removeMedia(url)}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded bg-black/60 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div
                className="rounded-md p-4 text-center text-[11px]"
                style={{ border: "1px dashed var(--outline-variant)", color: "var(--on-surface-variant)" }}
              >
                No media added yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Pickers */}
      <MediaPicker
        open={heroPickerOpen}
        onClose={() => setHeroPickerOpen(false)}
        onSelect={handleHeroPick}
        accept="all"
      />
      <MediaPicker
        open={galleryPickerOpen}
        onClose={() => setGalleryPickerOpen(false)}
        onSelect={handleGalleryPick}
        accept="all"
        multiple
      />
    </div>
  )
}
