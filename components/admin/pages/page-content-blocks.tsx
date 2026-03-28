"use client"

import { useState, useEffect, useCallback } from "react"
import { MoreHorizontal, Languages, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageSection } from "@/types/page"

interface TextComponent {
  id: string
  key: string
  translations: Record<string, string>
}

interface PageContentBlocksProps {
  pageId: string
}

const TYPE_COLORS: Record<string, { bg: string; label: string }> = {
  h1:        { bg: "rgb(0,99,169)",    label: "H1" },
  h2:        { bg: "rgb(0,119,182)",   label: "H2" },
  h3:        { bg: "rgb(0,180,216)",   label: "H3" },
  h4:        { bg: "rgb(0,150,199)",   label: "H4" },
  h5:        { bg: "rgb(72,202,228)",  label: "H5" },
  h6:        { bg: "rgb(144,224,239)", label: "H6" },
  paragraph: { bg: "rgb(124,58,237)",  label: "P"  },
  richtext:  { bg: "rgb(147,51,234)",  label: "RT" },
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

interface FlatBlock {
  id: string
  type: string
  content: string
  sectionName: string
}

function extractBlocks(sections: PageSection[]): FlatBlock[] {
  const blocks: FlatBlock[] = []
  for (let si = 0; si < sections.length; si++) {
    const section = sections[si]
    const sectionName = section.name || `Section ${si + 1}`
    for (const area of section.areas) {
      for (const block of area.blocks) {
        if (["h1", "h2", "h3", "h4", "h5", "h6", "paragraph", "richtext"].includes(block.type)) {
          blocks.push({ id: block.id, type: block.type, content: (block as any).content || "", sectionName })
        }
      }
    }
  }
  return blocks
}

export function PageContentBlocks({ pageId }: PageContentBlocksProps) {
  const [sections, setSections] = useState<PageSection[]>([])
  const [textComponents, setTextComponents] = useState<TextComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingBlock, setEditingBlock] = useState<FlatBlock | null>(null)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`)
      if (!res.ok) {
        setError(`Failed to load (${res.status})`)
        return
      }
      const json = await res.json()
      const pageSections = Array.isArray(json.page?.content) ? json.page.content : []
      const pageTextComponents = json.page?.textComponents || []
      setSections(pageSections)
      setTextComponents(pageTextComponents)
      setError(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const blocks = extractBlocks(sections)

  function openBlock(block: FlatBlock) {
    const existing = textComponents.find((tc) => tc.key === block.id)
    setTranslations({
      en: existing?.translations?.en ?? stripHtml(block.content),
      el: existing?.translations?.el ?? "",
      de: existing?.translations?.de ?? "",
    })
    setEditingBlock(block)
  }

  async function handleTranslate() {
    if (!translations.en) return
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: translations.en, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        setTranslations((prev) => ({ ...prev, el: json.translations.el || "", de: json.translations.de || "" }))
      }
    } finally {
      setTranslating(false)
    }
  }

  async function handleSave() {
    if (!editingBlock) return
    setSaving(true)
    try {
      const existing = textComponents.find((tc) => tc.key === editingBlock.id)
      if (existing) {
        await fetch(`/api/admin/pages/${pageId}/text-components/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations }),
        })
      } else {
        await fetch(`/api/admin/pages/${pageId}/text-components`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: editingBlock.id, translations }),
        })
      }
      setEditingBlock(null)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteBlock(block: FlatBlock) {
    // Remove translations if they exist
    const existing = textComponents.find((tc) => tc.key === block.id)
    if (existing) {
      await fetch(`/api/admin/pages/${pageId}/text-components/${existing.id}`, { method: "DELETE" })
    }
    // Remove the block from page content
    const updated = sections.map((s) => ({
      ...s,
      areas: s.areas.map((a) => ({
        ...a,
        blocks: a.blocks.filter((b) => b.id !== block.id),
      })),
    }))
    await fetch(`/api/admin/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: updated }),
    })
    fetchData()
  }

  if (loading) {
    return <p className="text-[11px] py-2 text-center" style={{ color: "var(--on-surface-variant)" }}>Loading…</p>
  }

  if (error) {
    return <p className="text-[11px] py-2 text-center" style={{ color: "var(--error)" }}>Error: {error}</p>
  }

  if (blocks.length === 0) {
    return (
      <p className="text-[11px] py-2 text-center" style={{ color: "var(--on-surface-variant)" }}>
        No text blocks in this page yet
      </p>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {blocks.map((block, i) => {
          const meta = TYPE_COLORS[block.type] ?? { bg: "#999", label: "?" }
          const tc = textComponents.find((t) => t.key === block.id)
          const hasEl = !!tc?.translations?.el
          const hasDe = !!tc?.translations?.de
          const preview = stripHtml(block.content)

          return (
            <div
              key={block.id}
              className="group flex items-center gap-1.5 pl-1 pr-0.5 py-0.5 rounded cursor-grab active:cursor-grabbing"
              style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)", maxWidth: 280 }}
            >
              <GripVertical className="size-3 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />

              {/* Number */}
              <span className="text-[11px] font-bold flex-shrink-0" style={{ color: "var(--on-surface-variant)" }}>
                {i + 1}
              </span>

              {/* Type badge */}
              <span
                className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded flex-shrink-0 leading-none"
                style={{ background: meta.bg }}
              >
                {meta.label}
              </span>

              {/* Preview */}
              <span className="text-xs truncate flex-1 min-w-0" style={{ color: "var(--on-surface)" }} title={preview || "Empty"}>
                {preview ? (preview.length > 140 ? preview.slice(0, 140) + "…" : preview) : "Empty"}
              </span>

              {/* Section label */}
              <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 leading-none" style={{ background: "rgba(0,0,0,0.05)", color: "var(--on-surface-variant)" }}>
                {block.sectionName}
              </span>

              {/* Translation status dots */}
              <div className="flex gap-0.5 flex-shrink-0">
                <span className="size-1.5 rounded-full" style={{ background: "rgb(46,125,50)" }} title="EN" />
                <span className="size-1.5 rounded-full" style={{ background: hasEl ? "rgb(46,125,50)" : "rgb(200,200,200)" }} title="EL" />
                <span className="size-1.5 rounded-full" style={{ background: hasDe ? "rgb(46,125,50)" : "rgb(200,200,200)" }} title="DE" />
              </div>

              {/* Dropdown actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-0.5 rounded hover:bg-black/5 flex-shrink-0">
                    <MoreHorizontal className="size-3" style={{ color: "var(--on-surface-variant)" }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuItem className="text-xs gap-2" onClick={() => openBlock(block)}>
                    <Languages className="size-3" />
                    Translations
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs gap-2 text-red-600" onClick={() => handleDeleteBlock(block)}>
                    <Trash2 className="size-3" />
                    Delete component
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      <Dialog open={!!editingBlock} onOpenChange={(open) => { if (!open) setEditingBlock(null) }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ background: "var(--surface-container-lowest)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              Translations — {editingBlock && TYPE_COLORS[editingBlock.type]?.label}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--on-surface-variant)" }}>
              Edit translations for this content block
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {(["en", "el", "de"] as const).map((lang) => (
              <div key={lang} className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
                  {lang === "en" ? "English" : lang === "el" ? "Greek (Ελληνικά)" : "German (Deutsch)"}
                </Label>
                <Textarea
                  value={translations[lang] || ""}
                  onChange={(e) => setTranslations((prev) => ({ ...prev, [lang]: e.target.value }))}
                  className="text-xs min-h-16"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
            ))}

            <Button
              variant="outline"
              onClick={handleTranslate}
              disabled={translating || !translations.en}
              className="w-full h-8 text-xs"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              {translating ? "Translating…" : "Translate via DeepSeek"}
            </Button>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingBlock(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="h-7 text-xs text-white"
                style={{ background: "var(--gradient-ocean)", borderRadius: "var(--radius-xs)" }}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
