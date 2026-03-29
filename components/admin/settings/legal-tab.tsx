"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  Scale, Plus, Trash2, ChevronDown, ChevronUp, Globe,
  Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, Undo, Redo, Minus,
} from "lucide-react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import LinkExtension from "@tiptap/extension-link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const LANGS = ["en", "el", "de"] as const
const LANG_LABELS: Record<string, string> = { en: "English", el: "Greek", de: "German" }

interface LegalPage {
  id: string
  slug: string
  title: Record<string, string>
  content: Record<string, string>
}

interface LegalData {
  pages: LegalPage[]
}

const PRESETS = [
  { slug: "data-protection", title: "Data Protection" },
  { slug: "terms-and-conditions", title: "Terms and Conditions" },
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "cookie-policy", title: "Cookie Policy" },
  { slug: "imprint", title: "Imprint" },
  { slug: "cancellation-policy", title: "Cancellation Policy" },
]

function newPage(slug = "", title = ""): LegalPage {
  return {
    id: crypto.randomUUID(),
    slug,
    title: { en: title, el: "", de: "" },
    content: { en: "", el: "", de: "" },
  }
}

/* ─── Translatable Input with Language Tabs ──────────────────── */
function TranslatableField({ label, value, onChange }: {
  label: string
  value: Record<string, string>
  onChange: (val: Record<string, string>) => void
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--on-surface-variant)" }}>{label}</Label>
        <Button variant="ghost" size="sm" onClick={handleTranslate} disabled={translating || !value.en} className="h-5 text-[10px] gap-1 px-1.5" style={{ color: "var(--primary)" }}>
          <Globe className="size-3" />
          {translating ? "…" : "Translate"}
        </Button>
      </div>
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        {LANGS.map((lang) => (
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
      <Input
        value={value[activeTab] || ""}
        onChange={(e) => onChange({ ...value, [activeTab]: e.target.value })}
        placeholder={`${LANG_LABELS[activeTab]} text…`}
        className="h-8 text-xs"
        style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
      />
    </div>
  )
}

/* ─── Rich Text Translatable Field ───────────────────────────── */
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
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: value[activeTab] || "",
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange({ ...value, [activeTab]: e.getHTML() })
    },
  }, [activeTab, editorKey.current])

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
        <Label className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--on-surface-variant)" }}>{label}</Label>
        <Button variant="ghost" size="sm" onClick={handleTranslate} disabled={translating || !value.en} className="h-5 text-[10px] gap-1 px-1.5" style={{ color: "var(--primary)" }}>
          <Globe className="size-3" />
          {translating ? "…" : "Translate"}
        </Button>
      </div>
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        {LANGS.map((lang) => (
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

/* ─── Legal Tab ──────────────────────────────────────────────── */
export function LegalTab({ initialData }: { initialData?: Partial<LegalData> }) {
  const [data, setData] = useState<LegalData>({
    pages: initialData?.pages ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const updatePage = useCallback((id: string, field: keyof LegalPage, value: Record<string, string> | string) => {
    setData((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }))
  }, [])

  function addPage(slug = "", title = "") {
    const page = newPage(slug, title)
    setData((prev) => ({ ...prev, pages: [...prev.pages, page] }))
    setExpanded((prev) => new Set(prev).add(page.id))
  }

  function removePage(id: string) {
    setData((prev) => ({ ...prev, pages: prev.pages.filter((p) => p.id !== id) }))
  }

  async function handleSave() {
    setSaving(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "legal", value: data }),
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    } finally {
      setSaving(false)
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  const usedSlugs = new Set(data.pages.map((p) => p.slug))
  const availablePresets = PRESETS.filter((p) => !usedSlugs.has(p.slug))

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div
        className="rounded-lg p-5 flex flex-col gap-5"
        style={{
          background: "var(--surface-container-lowest)",
          boxShadow: "var(--shadow-ambient)",
          border: "1px solid var(--outline-variant)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3"
          style={{ borderBottom: "1px solid var(--outline-variant)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="size-8 rounded-md flex items-center justify-center"
              style={{ background: "var(--secondary)", borderRadius: "var(--radius-xs)" }}
            >
              <Scale className="size-4 text-white" />
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}
              >
                Legal Pages
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                Manage legal content like Data Protection, Terms &amp; Conditions, etc.
              </p>
            </div>
          </div>
        </div>

        {/* Quick add presets */}
        {availablePresets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] uppercase tracking-wide font-semibold self-center mr-1" style={{ color: "var(--on-surface-variant)" }}>
              Quick add:
            </span>
            {availablePresets.map((preset) => (
              <button
                key={preset.slug}
                onClick={() => addPage(preset.slug, preset.title)}
                className="text-[11px] px-2.5 py-1 rounded-full transition-colors hover:bg-black/5"
                style={{
                  border: "1px solid var(--outline-variant)",
                  color: "var(--secondary)",
                }}
              >
                + {preset.title}
              </button>
            ))}
          </div>
        )}

        {/* Pages list */}
        <div className="flex flex-col gap-3">
          {data.pages.length === 0 && (
            <div
              className="rounded-md p-8 text-center"
              style={{ border: "2px dashed var(--outline-variant)", color: "var(--on-surface-variant)" }}
            >
              <p className="text-sm mb-2">No legal pages yet.</p>
              <p className="text-xs">Use the quick add buttons above or add a custom page below.</p>
            </div>
          )}

          {data.pages.map((page) => {
            const isExpanded = expanded.has(page.id)
            return (
              <LegalPageCard
                key={page.id}
                page={page}
                isExpanded={isExpanded}
                onToggle={() => toggleExpand(page.id)}
                onRemove={() => removePage(page.id)}
                onUpdate={updatePage}
              />
            )
          })}
        </div>

        {/* Add custom page */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-xs w-full"
          onClick={() => addPage()}
        >
          <Plus className="size-4" />
          Add Custom Legal Page
        </Button>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="h-9 gap-2 text-xs text-white"
          style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
        >
          {saving ? "Saving\u2026" : "Save Changes"}
        </Button>
        {status === "success" && (
          <span className="text-xs font-medium text-green-600">&check; Saved successfully</span>
        )}
        {status === "error" && (
          <span className="text-xs font-medium" style={{ color: "var(--error)" }}>
            Failed to save
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── Individual Legal Page Card ─────────────────────────────── */
function LegalPageCard({ page, isExpanded, onToggle, onRemove, onUpdate }: {
  page: LegalPage
  isExpanded: boolean
  onToggle: () => void
  onRemove: () => void
  onUpdate: (id: string, field: keyof LegalPage, value: Record<string, string> | string) => void
}) {
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ border: "1px solid var(--outline-variant)" }}
    >
      {/* Collapsed header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.02]"
        style={{ background: "var(--surface-container-low)" }}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isExpanded ? (
            <ChevronUp className="size-4 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
          ) : (
            <ChevronDown className="size-4 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--primary)" }}>
              {page.title.en || "Untitled"}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              /legal/{page.slug || "..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onRemove}
            className="p-1.5 rounded transition-colors hover:bg-red-50 hover:text-red-600"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 py-4 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)" }}>
          {/* Slug */}
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--on-surface-variant)" }}>
              URL Slug
            </Label>
            <Input
              value={page.slug}
              onChange={(e) =>
                onUpdate(page.id, "slug",
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-|-$/g, ""),
                )
              }
              placeholder="e.g. data-protection"
              className="h-8 text-xs"
            />
          </div>

          {/* Title (translatable with tabs) */}
          <TranslatableField
            label="Title"
            value={page.title}
            onChange={(val) => onUpdate(page.id, "title", val)}
          />

          {/* Content (rich text with tabs) */}
          <RichTranslatableField
            label="Content"
            value={page.content}
            onChange={(val) => onUpdate(page.id, "content", val)}
          />
        </div>
      )}
    </div>
  )
}
