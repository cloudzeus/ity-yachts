"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Globe, Star, Image as ImageIcon, Upload, FolderOpen, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"

type ReviewData = {
  id: string
  name: string
  email: string
  date: string
  content: Record<string, string>
  rating: number
  status: string
  sortOrder: number
  image: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  review: ReviewData
}

function TranslatableRichField({ label, value, onChange }: {
  label: string
  value: Record<string, string>
  onChange: (val: Record<string, string>) => void
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{label}</Label>
        <Button variant="ghost" size="sm" onClick={handleTranslate} disabled={translating || !value.en} className="h-5 text-[10px] gap-1 px-1.5" style={{ color: "var(--primary)" }}>
          <Globe className="size-3" />
          {translating ? "…" : "Translate"}
        </Button>
      </div>
      {(["en", "el", "de"] as const).map((lang) => (
        <div key={lang} className="flex flex-col gap-1">
          <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>{lang}</Label>
          <Textarea
            value={value[lang] || ""}
            onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            className="text-xs min-h-24"
            placeholder={lang === "en" ? "Write the review content…" : `Translation (${lang.toUpperCase()})…`}
            style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          />
        </div>
      ))}
    </div>
  )
}

export function ReviewEditorClient({ review }: Props) {
  const router = useRouter()
  const [name, setName] = useState(review.name)
  const [email, setEmail] = useState(review.email)
  const [date, setDate] = useState(review.date.slice(0, 10))
  const [content, setContent] = useState(review.content)
  const [rating, setRating] = useState(review.rating)
  const [status, setStatus] = useState(review.status)
  const [image, setImage] = useState(review.image ?? "")

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Media
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePick(media: PickedMedia | PickedMedia[]) {
    const picked = Array.isArray(media) ? media[0] : media
    if (picked) setImage(picked.url)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "reviews")
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData })
      if (res.ok) {
        const json = await res.json()
        setImage(json.file.url)
      }
    } finally {
      setUploading(false)
    }
    e.target.value = ""
  }

  // Auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, date, content, rating, status,
          image: image || null,
        }),
      })
      if (res.ok) setLastSaved(new Date())
    } finally {
      setSaving(false)
    }
  }, [review.id, name, email, date, content, rating, status, image])

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { save() }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [save])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/reviews")} className="h-8 w-8 p-0">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              {name || "Untitled Review"}
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
          {/* Review content (rich text per language) */}
          <div className="rounded-lg p-4" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <TranslatableRichField label="Review Content" value={content} onChange={setContent} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Reviewer info */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <Star className="size-4" style={{ color: "#F59E0B" }} fill="#F59E0B" />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Reviewer Info</span>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Date</Label>
              <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>Rating</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setRating(i + 1)} className="p-0">
                    <Star className="size-5" style={{ color: i < rating ? "#F59E0B" : "var(--outline-variant)" }} fill={i < rating ? "#F59E0B" : "none"} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reviewer image */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <ImageIcon className="size-4" style={{ color: "var(--secondary)" }} />
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>Reviewer Photo</span>
            </div>

            {image ? (
              <div className="relative rounded overflow-hidden group" style={{ border: "1px solid var(--outline-variant)" }}>
                <img src={image} alt={name} className="w-full h-32 object-cover" />
                <button
                  onClick={() => setImage("")}
                  className="absolute top-1.5 right-1.5 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  <X className="size-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full h-24 rounded flex flex-col items-center justify-center gap-2" style={{ border: "2px dashed var(--outline-variant)", background: "var(--surface-container)" }}>
                <ImageIcon className="size-5" style={{ color: "var(--on-surface-variant)", opacity: 0.4 }} />
                <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>No photo</span>
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
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>

          <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePick} accept="image" />
        </div>
      </div>
    </div>
  )
}
