"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageSection } from "@/types/page"
import { createSection, deleteSection, moveSection } from "@/lib/page-builder"
import { SectionEditor } from "@/components/admin/page-builder/section-editor"
import { MetaPanel } from "@/components/admin/page-builder/meta-panel"
import { TranslationsPanel } from "@/components/admin/page-builder/translations-panel"
import Link from "next/link"

interface Page {
  id: string
  name: string
  slug: string
  status: string
  content: any
  translations?: Record<string, string>
  metaTitle?: string
  metaDesc?: string
  metaKeywords?: string
  metaOgTitle?: string
  metaOgDesc?: string
  metaOgImage?: string
  metaRobots?: string
  metaCanonical?: string
}

interface EditorClientProps {
  page: Page
}

export function EditorClient({ page: initialPage }: EditorClientProps) {
  const router = useRouter()
  const [page, setPage] = useState(initialPage)
  const [sections, setSections] = useState<PageSection[]>(Array.isArray(page.content) ? page.content : [])
  const [name, setName] = useState(page.name)
  const [slug, setSlug] = useState(page.slug)
  const [slugOverridden, setSlugOverridden] = useState(false)
  const [translations, setTranslations] = useState<Record<string, string>>(page.translations || {})
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-generate slug from name
  function handleNameChange(val: string) {
    setName(val)
    if (!slugOverridden) {
      const newSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      setSlug(newSlug)
    }
  }

  function handleSlugChange(val: string) {
    setSlug(val)
    setSlugOverridden(true)
  }

  // Auto-save on change
  const autoSave = useCallback(async () => {
    if (!name || !slug) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          content: sections,
          translations,
          metaTitle: page.metaTitle,
          metaDesc: page.metaDesc,
          metaKeywords: page.metaKeywords,
          metaOgTitle: page.metaOgTitle,
          metaOgDesc: page.metaOgDesc,
          metaOgImage: page.metaOgImage,
          metaRobots: page.metaRobots,
          metaCanonical: page.metaCanonical,
        }),
      })
      if (res.ok) {
        setLastSaved(new Date())
      }
    } catch (err) {
      console.error("[autoSave]", err)
    } finally {
      setSaving(false)
    }
  }, [page.id, name, slug, sections, translations, page])

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      autoSave()
    }, 1000)

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    }
  }, [name, slug, sections, translations, autoSave])

  async function publish() {
    setSaving(true)
    try {
      await fetch(`/api/admin/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "published",
        }),
      })
      setPage({ ...page, status: "published" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Top Bar */}
      <div
        className="flex items-center justify-between gap-4 px-6 py-4 border-b"
        style={{ borderColor: "var(--outline-variant)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/admin/pages">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <ChevronLeft className="size-4" />
            </Button>
          </Link>
          <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Pages</span>
          <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>/</span>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Page name"
            className="h-8 text-sm flex-1 min-w-0"
            style={{ background: "transparent", border: "none", padding: "0" }}
          />
          <span className="text-xs px-2 py-1 rounded" style={{ background: page.status === "published" ? "rgba(45,106,79,0.1)" : "rgba(117,117,117,0.1)", color: page.status === "published" ? "#2D6A4F" : "#626262" }}>
            {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lastSaved && <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Saved</span>}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => autoSave()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Draft"}
          </Button>
          {page.status === "draft" && (
            <Button
              size="sm"
              className="h-8 text-xs text-white"
              style={{ background: "var(--gradient-ocean)" }}
              onClick={publish}
              disabled={saving}
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex flex-1 overflow-hidden gap-4 p-6" style={{ background: "var(--surface-container-lowest)" }}>
        {/* Builder */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          {/* Page info card */}
          <div
            className="rounded-lg p-4 flex flex-col gap-4"
            style={{
              background: "var(--surface-container-low)",
              border: "1px solid var(--outline-variant)",
              boxShadow: "var(--shadow-ambient)",
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>
                Page Slug
              </label>
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="page-slug"
                className="text-sm"
              />
            </div>

            <div className="border-t" style={{ borderColor: "var(--outline-variant)" }}></div>

            <TranslationsPanel
              translations={translations}
              onTranslationsChange={setTranslations}
            />
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-3">
            {sections.length === 0 ? (
              <div
                className="rounded-lg p-8 text-center"
                style={{
                  background: "var(--surface-container-low)",
                  border: "2px dashed var(--outline-variant)",
                  minHeight: "200px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p className="text-sm mb-3" style={{ color: "var(--on-surface-variant)" }}>
                  No sections yet
                </p>
                <Button
                  size="sm"
                  className="h-8 gap-2 text-xs text-white"
                  style={{ background: "var(--gradient-ocean)" }}
                  onClick={() => setSections([...sections, createSection()])}
                >
                  <Plus className="size-4" />
                  Add Section
                </Button>
              </div>
            ) : (
              sections.map((section, idx) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  onUpdate={(updated) => {
                    const newSections = [...sections]
                    newSections[idx] = updated
                    setSections(newSections)
                  }}
                  onDelete={() => setSections(deleteSection(sections, section.id))}
                  onMoveUp={() => setSections(moveSection(sections, section.id, "up"))}
                  onMoveDown={() => setSections(moveSection(sections, section.id, "down"))}
                />
              ))
            )}
          </div>

          {/* Add section button */}
          {sections.length > 0 && (
            <Button
              size="sm"
              className="w-full h-9 gap-2 text-white"
              style={{ background: "var(--gradient-ocean)" }}
              onClick={() => setSections([...sections, createSection()])}
            >
              <Plus className="size-4" />
              Add Section
            </Button>
          )}
        </div>

        {/* SEO Panel */}
        <div
          className="w-72 rounded-lg p-4 overflow-y-auto"
          style={{
            background: "var(--surface-container-low)",
            border: "1px solid var(--outline-variant)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <MetaPanel
            pageId={page.id}
            slug={slug}
            content={sections}
            metas={{
              metaTitle: page.metaTitle,
              metaDesc: page.metaDesc,
              metaKeywords: page.metaKeywords,
              metaOgTitle: page.metaOgTitle,
              metaOgDesc: page.metaOgDesc,
              metaOgImage: page.metaOgImage,
              metaRobots: page.metaRobots,
              metaCanonical: page.metaCanonical,
            }}
            onMetasChange={(metas) => {
              setPage({ ...page, ...metas })
              // Auto-save metas
              if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
              autoSaveRef.current = setTimeout(async () => {
                try {
                  await fetch(`/api/admin/pages/${page.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(metas),
                  })
                  setLastSaved(new Date())
                } catch (err) {
                  console.error("[save metas]", err)
                }
              }, 1000)
            }}
          />
        </div>
      </div>
    </div>
  )
}
