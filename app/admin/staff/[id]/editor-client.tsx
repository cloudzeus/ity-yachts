"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Save, Globe, UserCircle, Loader2, Upload, FolderOpen, X, Sparkles, MapPin,
  Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, Undo, Redo, Minus,
} from "lucide-react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"

// ─── Types ───────────────────────────────────────────────────
type StaffData = {
  id: string
  userId: string | null
  name: string
  email: string
  phone: string
  mobile: string
  address: string
  city: Record<string, string>
  department: Record<string, string>
  position: Record<string, string>
  bio: Record<string, string>
  image: string | null
  latitude: number | null
  longitude: number | null
  sortOrder: number
  status: string
  createdAt: string
  updatedAt: string
}

type UserOption = { id: string; name: string; email: string; image: string | null }

interface Props {
  member: StaffData
  users: UserOption[]
  existingDepartments: Record<string, string>[]
}

// ─── TranslatableField component ─────────────────────────────
const LANG_LABELS: Record<string, string> = { en: "English", el: "Greek", de: "German" }

function TranslatableField({ label, value, onChange, multiline }: {
  label: string
  value: Record<string, string>
  onChange: (val: Record<string, string>) => void
  multiline?: boolean
}) {
  const [translating, setTranslating] = useState(false)
  const [activeTab, setActiveTab] = useState<"en" | "el" | "de">("en")

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
  const inputProps = multiline ? { className: "text-xs min-h-24" } : { className: "h-8 text-xs" }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>{label}</Label>
        <Button variant="ghost" size="sm" onClick={handleTranslate} disabled={translating || !value.en} className="h-5 text-[10px] gap-1 px-1.5" style={{ color: "var(--primary)" }}>
          <Globe className="size-3" />
          {translating ? "…" : "Translate All"}
        </Button>
      </div>
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        {(["en", "el", "de"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveTab(lang)}
            className="px-3 py-1.5 text-[11px] font-medium transition-colors relative"
            style={{
              color: activeTab === lang ? "var(--primary)" : "var(--on-surface-variant)",
            }}
          >
            {LANG_LABELS[lang]}
            {value[lang] && <span className="ml-1 inline-block size-1.5 rounded-full" style={{ background: "var(--primary)", opacity: 0.5 }} />}
            {activeTab === lang && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--primary)" }} />
            )}
          </button>
        ))}
      </div>
      <InputComponent
        value={value[activeTab] || ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [activeTab]: e.target.value })}
        placeholder={`${LANG_LABELS[activeTab]} text…`}
        {...inputProps}
        style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
      />
    </div>
  )
}

// ─── Rich Text Translatable Field ────────────────────────────
function RichTranslatableField({ label, value, onChange }: {
  label: string
  value: Record<string, string>
  onChange: (val: Record<string, string>) => void
}) {
  const [translating, setTranslating] = useState(false)
  const [activeTab, setActiveTab] = useState<"en" | "el" | "de">("en")
  const editorKey = useRef(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false }),
    ],
    content: value[activeTab] || "",
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange({ ...value, [activeTab]: e.getHTML() })
    },
  }, [activeTab, editorKey.current])

  // Sync editor content when tab changes
  useEffect(() => {
    if (editor && editor.getHTML() !== (value[activeTab] || "")) {
      editor.commands.setContent(value[activeTab] || "")
    }
  }, [activeTab, editor])

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
        const updated = { ...value, el: json.translations.el || "", de: json.translations.de || "" }
        onChange(updated)
        editorKey.current++
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
          {translating ? "…" : "Translate All"}
        </Button>
      </div>
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        {(["en", "el", "de"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveTab(lang)}
            className="px-3 py-1.5 text-[11px] font-medium transition-colors relative"
            style={{ color: activeTab === lang ? "var(--primary)" : "var(--on-surface-variant)" }}
          >
            {LANG_LABELS[lang]}
            {value[lang] && <span className="ml-1 inline-block size-1.5 rounded-full" style={{ background: "var(--primary)", opacity: 0.5 }} />}
            {activeTab === lang && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--primary)" }} />
            )}
          </button>
        ))}
      </div>
      {/* Toolbar */}
      {editor && (
        <div className="flex flex-wrap gap-0.5 py-1 px-1 rounded-t border border-b-0" style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}>
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("bold") ? "bg-black/10" : "hover:bg-black/5"}`} title="Bold">
            <Bold className="size-3.5" />
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("italic") ? "bg-black/10" : "hover:bg-black/5"}`} title="Italic">
            <Italic className="size-3.5" />
          </button>
          <span className="w-px mx-1 self-stretch" style={{ background: "var(--outline-variant)" }} />
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-black/10" : "hover:bg-black/5"}`} title="Heading 2">
            <Heading2 className="size-3.5" />
          </button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded transition-colors ${editor.isActive("heading", { level: 3 }) ? "bg-black/10" : "hover:bg-black/5"}`} title="Heading 3">
            <Heading3 className="size-3.5" />
          </button>
          <span className="w-px mx-1 self-stretch" style={{ background: "var(--outline-variant)" }} />
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("bulletList") ? "bg-black/10" : "hover:bg-black/5"}`} title="Bullet List">
            <List className="size-3.5" />
          </button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("orderedList") ? "bg-black/10" : "hover:bg-black/5"}`} title="Ordered List">
            <ListOrdered className="size-3.5" />
          </button>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("blockquote") ? "bg-black/10" : "hover:bg-black/5"}`} title="Quote">
            <Quote className="size-3.5" />
          </button>
          <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-1.5 rounded transition-colors hover:bg-black/5" title="Divider">
            <Minus className="size-3.5" />
          </button>
          <span className="w-px mx-1 self-stretch" style={{ background: "var(--outline-variant)" }} />
          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded transition-colors hover:bg-black/5 disabled:opacity-30" title="Undo">
            <Undo className="size-3.5" />
          </button>
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded transition-colors hover:bg-black/5 disabled:opacity-30" title="Redo">
            <Redo className="size-3.5" />
          </button>
        </div>
      )}
      <div
        className="rounded-b border min-h-48 [&_.tiptap]:outline-none [&_.tiptap]:min-h-44 [&_.tiptap]:p-3 [&_.tiptap]:text-sm [&_.tiptap_h2]:text-lg [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:mt-4 [&_.tiptap_h2]:mb-2 [&_.tiptap_h3]:text-base [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:mt-3 [&_.tiptap_h3]:mb-1 [&_.tiptap_p]:mb-2 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:mb-2 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:mb-2 [&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:pl-3 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:my-2"
        style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// ─── Editor ──────────────────────────────────────────────────
export function StaffEditorClient({ member, users, existingDepartments }: Props) {
  const router = useRouter()

  // Basic fields
  const [name, setName] = useState(member.name)
  const [email, setEmail] = useState(member.email)
  const [phone, setPhone] = useState(member.phone)
  const [mobile, setMobile] = useState(member.mobile)
  const [userId, setUserId] = useState(member.userId ?? "")
  const [status, setStatus] = useState(member.status)
  const [sortOrder, setSortOrder] = useState(member.sortOrder)
  const [image, setImage] = useState(member.image ?? "")

  // Address with geocode autocomplete
  const [address, setAddress] = useState(member.address)
  const [latitude, setLatitude] = useState(member.latitude)
  const [longitude, setLongitude] = useState(member.longitude)
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display: string; lat: number; lon: number; city?: string }>>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const addressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Translatable fields
  const [city, setCity] = useState(member.city)
  const [department, setDepartment] = useState(member.department)
  const [position, setPosition] = useState(member.position)
  const [bio, setBio] = useState(member.bio)

  // Department suggestions
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Address autocomplete ───────────────────────────────────
  function handleAddressChange(val: string) {
    setAddress(val)
    if (addressTimeout.current) clearTimeout(addressTimeout.current)
    if (val.length < 3) {
      setAddressSuggestions([])
      return
    }
    addressTimeout.current = setTimeout(async () => {
      setAddressLoading(true)
      try {
        const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(val)}&limit=5`)
        if (res.ok) {
          const json = await res.json()
          setAddressSuggestions(
            (json.suggestions ?? []).map((s: { displayName: string; latitude: number; longitude: number }) => ({
              display: s.displayName,
              lat: s.latitude,
              lon: s.longitude,
            }))
          )
        }
      } finally {
        setAddressLoading(false)
      }
    }, 400)
  }

  function selectAddress(suggestion: { display: string; lat: number; lon: number }) {
    setAddress(suggestion.display)
    setLatitude(suggestion.lat)
    setLongitude(suggestion.lon)
    // Extract city from display name (usually second part)
    const parts = suggestion.display.split(",").map((p) => p.trim())
    if (parts.length > 1) {
      setCity((prev) => ({ ...prev, en: parts[0] }))
    }
    setAddressSuggestions([])
  }

  // ─── Department selection ───────────────────────────────────
  function selectDepartment(dept: Record<string, string>) {
    setDepartment(dept)
    setShowDeptSuggestions(false)
  }

  // ─── Image handling ─────────────────────────────────────────
  function handleImagePick(media: PickedMedia | PickedMedia[]) {
    const picked = Array.isArray(media) ? media[0] : media
    if (picked) setImage(picked.url)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "staff")
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData })
      if (res.ok) {
        const json = await res.json()
        setImage(json.file.url)
      }
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  // ─── Generate bio via DeepSeek ──────────────────────────────
  const [generating, setGenerating] = useState(false)
  async function handleGenerateBio() {
    if (!name) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/admin/staff/${member.id}/generate-bio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department, position }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.bio) setBio(json.bio)
      } else {
        const err = await res.json().catch(() => ({ error: "Failed" }))
        alert(err.error || "Bio generation failed")
      }
    } finally {
      setGenerating(false)
    }
  }

  // ─── Save ───────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone, mobile,
          userId: userId || null,
          address, latitude, longitude,
          city, department, position, bio,
          image: image || null,
          status, sortOrder,
        }),
      })
      if (res.ok) setLastSaved(new Date())
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/staff")} className="h-8 gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
          <ArrowLeft className="size-3.5" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>{name || "New Staff Member"}</h1>
          {lastSaved && <p className="text-[10px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Last saved {lastSaved.toLocaleTimeString()}</p>}
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-28 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 gap-1.5 text-xs" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
          {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Save
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column - main info */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Basic info card */}
          <div className="rounded-lg border p-4 flex flex-col gap-4" style={{ background: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>Basic Information</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Full Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Mobile</Label>
                <Input value={mobile} onChange={(e) => setMobile(e.target.value)} className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Linked User Account</Label>
              <Select value={userId || "none"} onValueChange={(v) => {
                const uid = v === "none" ? "" : v
                setUserId(uid)
                if (uid) {
                  const user = users.find((u) => u.id === uid)
                  if (user) {
                    setName(user.name || name)
                    setEmail(user.email || email)
                  }
                }
              }}>
                <SelectTrigger className="h-8 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                  <SelectValue placeholder="No linked account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked account</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name || u.email} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="h-8 text-xs w-24" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
            </div>
          </div>

          {/* Address + Role side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Address card */}
            <div className="rounded-lg border p-4 flex flex-col gap-4" style={{ background: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}>
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>
                <MapPin className="size-3.5" /> Address
              </h2>
              <div className="relative">
                <Label className="text-xs" style={{ color: "var(--on-surface)" }}>Address</Label>
                <div className="relative">
                  <Input
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Start typing to search…"
                    className="h-8 text-xs"
                    style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                  />
                  {addressLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-3 animate-spin" style={{ color: "var(--primary)" }} />}
                </div>
                {addressSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border shadow-lg max-h-48 overflow-y-auto" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
                    {addressSuggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 transition-colors"
                        style={{ color: "var(--on-surface)" }}
                        onClick={() => selectAddress(s)}
                      >
                        {s.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <TranslatableField label="City" value={city} onChange={setCity} />

              {latitude && longitude && (
                <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                  Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              )}
            </div>

            {/* Role card */}
            <div className="rounded-lg border p-4 flex flex-col gap-4" style={{ background: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}>
              <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>Role</h2>

              {/* Department with suggestions */}
              <div className="relative">
                <TranslatableField label="Department" value={department} onChange={setDepartment} />
                {existingDepartments.length > 0 && (
                  <div className="mt-1">
                    <button
                      className="text-[10px] underline"
                      style={{ color: "var(--primary)" }}
                      onClick={() => setShowDeptSuggestions(!showDeptSuggestions)}
                    >
                      {showDeptSuggestions ? "Hide" : "Choose from"} existing departments
                    </button>
                    {showDeptSuggestions && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {existingDepartments.map((d, i) => (
                          <button
                            key={i}
                            onClick={() => selectDepartment(d)}
                            className="px-2 py-1 text-[10px] rounded border transition-colors hover:bg-black/5"
                            style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
                          >
                            {d.en}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <TranslatableField label="Position" value={position} onChange={setPosition} />
            </div>
          </div>

          {/* Bio card - full width, rich text */}
          <div className="rounded-lg border p-4 flex flex-col gap-4" style={{ background: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>Bio</h2>
              <Button variant="outline" size="sm" onClick={handleGenerateBio} disabled={generating || !name} className="h-7 text-[10px] gap-1" style={{ borderColor: "var(--outline-variant)", color: "var(--primary)" }}>
                {generating ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                {generating ? "Generating…" : "Generate via DeepSeek"}
              </Button>
            </div>
            <RichTranslatableField label="Bio" value={bio} onChange={setBio} />
          </div>
        </div>

        {/* Right column - image */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}>Photo</h2>

            {image ? (
              <div className="relative group">
                <img src={image} alt={name} className="w-full aspect-square rounded-lg object-cover" />
                <button
                  onClick={() => setImage("")}
                  className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  <X className="size-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center aspect-square rounded-lg border-2 border-dashed" style={{ borderColor: "var(--outline-variant)" }}>
                <UserCircle className="size-16" style={{ color: "var(--outline-variant)" }} />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setImagePickerOpen(true)} className="flex-1 h-7 text-[10px] gap-1" style={{ borderColor: "var(--outline-variant)" }}>
                <FolderOpen className="size-3" /> Library
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1 h-7 text-[10px] gap-1" style={{ borderColor: "var(--outline-variant)" }}>
                {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />} Upload
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>
        </div>
      </div>

      {/* Media picker */}
      <MediaPicker
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={handleImagePick}
        accept="image"
      />
    </div>
  )
}
