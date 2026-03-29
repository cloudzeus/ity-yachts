"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Pencil, Languages, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { DataTable, type ColumnDef, type ActionItem } from "@/components/ui/data-table"

type SiteTranslation = {
  id: string
  key: string
  namespace: string
  en: string
  el: string
  de: string
}

const LANGS = ["en", "el", "de"] as const
const LANG_LABELS: Record<string, string> = { en: "English", el: "Greek", de: "German" }
const LANG_FLAGS: Record<string, string> = { en: "🇬🇧", el: "🇬🇷", de: "🇩🇪" }

export function TranslationsClient({ initialData }: { initialData: SiteTranslation[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialData)
  const [search, setSearch] = useState("")
  const [nsFilter, setNsFilter] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<SiteTranslation | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [translatingRowId, setTranslatingRowId] = useState<string | null>(null)

  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [form, setForm] = useState({ key: "", namespace: "common", en: "", el: "", de: "" })
  const [activeLang, setActiveLang] = useState<typeof LANGS[number]>("en")

  const namespaces = [...new Set(items.map((i) => i.namespace))].sort()

  // Filter + sort + paginate
  const filtered = useMemo(() => {
    let result = items.filter((i) => {
      if (nsFilter && i.namespace !== nsFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return i.key.toLowerCase().includes(q) || i.en.toLowerCase().includes(q)
      }
      return true
    })

    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[sortCol] || ""
        const bVal = (b as any)[sortCol] || ""
        const cmp = String(aVal).localeCompare(String(bVal))
        return sortDir === "desc" ? -cmp : cmp
      })
    }

    return result
  }, [items, nsFilter, search, sortCol, sortDir])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const openEdit = useCallback((item: SiteTranslation) => {
    setEditItem(item)
    setForm({ key: item.key, namespace: item.namespace, en: item.en, el: item.el, de: item.de })
    setActiveLang("en")
  }, [])

  const openAdd = useCallback(() => {
    setEditItem(null)
    setForm({ key: "", namespace: "common", en: "", el: "", de: "" })
    setActiveLang("en")
    setShowAdd(true)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      if (editItem) {
        await fetch(`/api/admin/site-translations/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      } else {
        await fetch("/api/admin/site-translations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      router.refresh()
      setEditItem(null)
      setShowAdd(false)
      const res = await fetch("/api/admin/site-translations")
      setItems(await res.json())
    } finally {
      setSaving(false)
    }
  }, [editItem, form, router])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this translation key?")) return
    await fetch(`/api/admin/site-translations/${id}`, { method: "DELETE" })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const handleAutoTranslate = useCallback(async () => {
    if (!form.en) return
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: form.en, languages: ["el", "de"] }),
      })
      const data = await res.json()
      if (data.translations) {
        setForm((prev) => ({
          ...prev,
          el: data.translations.el || prev.el,
          de: data.translations.de || prev.de,
        }))
      }
    } finally {
      setTranslating(false)
    }
  }, [form.en])

  const handleRowTranslate = useCallback(async (item: SiteTranslation) => {
    if (!item.en) return
    setTranslatingRowId(item.id)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: item.en, languages: ["el", "de"] }),
      })
      const data = await res.json()
      if (data.translations) {
        const el = data.translations.el || item.el
        const de = data.translations.de || item.de
        await fetch(`/api/admin/site-translations/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ el, de }),
        })
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, el, de } : i))
        )
      }
    } finally {
      setTranslatingRowId(null)
    }
  }, [])

  const handleSeed = useCallback(async () => {
    setSeeding(true)
    try {
      const res = await fetch("/api/admin/site-translations/seed", { method: "POST" })
      const data = await res.json()
      alert(`Seeded: ${data.created} created, ${data.skipped} skipped`)
      const updated = await fetch("/api/admin/site-translations")
      setItems(await updated.json())
    } finally {
      setSeeding(false)
    }
  }, [])

  const handleBatchTranslate = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      const item = items.find((i) => i.id === id)
      if (item && item.en) await handleRowTranslate(item)
    }
  }, [items, handleRowTranslate])

  const columns: ColumnDef<SiteTranslation>[] = [
    {
      key: "key",
      header: "Key",
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs" style={{ color: "var(--primary)" }}>{row.key}</span>
      ),
    },
    {
      key: "namespace",
      header: "Namespace",
      sortable: true,
      cell: (row) => (
        <span
          className="inline-flex px-2 py-0.5 text-xs font-medium"
          style={{ background: "var(--surface-container)", borderRadius: "var(--radius-xs)", color: "var(--on-surface-variant)" }}
        >
          {row.namespace}
        </span>
      ),
    },
    {
      key: "en",
      header: "🇬🇧 English",
      sortable: true,
      cell: (row) => (
        <span className="block max-w-[220px] truncate" title={row.en}>{row.en}</span>
      ),
    },
    {
      key: "el",
      header: "🇬🇷 Greek",
      sortable: true,
      cell: (row) => (
        <span
          className="block max-w-[220px] truncate"
          style={{ color: row.el ? "var(--on-surface)" : "var(--outline)" }}
          title={row.el}
        >
          {row.el || "—"}
        </span>
      ),
    },
    {
      key: "de",
      header: "🇩🇪 German",
      sortable: true,
      cell: (row) => (
        <span
          className="block max-w-[220px] truncate"
          style={{ color: row.de ? "var(--on-surface)" : "var(--outline)" }}
          title={row.de}
        >
          {row.de || "—"}
        </span>
      ),
    },
    {
      key: "translate",
      header: "AI",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          disabled={translatingRowId === row.id || !row.en}
          onClick={(e) => { e.stopPropagation(); handleRowTranslate(row) }}
          title="Translate with DeepSeek"
        >
          {translatingRowId === row.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--secondary-light)" }} />
          )}
        </Button>
      ),
    },
  ]

  const rowActions = useCallback(
    (row: SiteTranslation): ActionItem[] => [
      { label: "Edit", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => openEdit(row) },
      { label: "Translate", icon: <Sparkles className="h-3.5 w-3.5" />, onClick: () => handleRowTranslate(row) },
      { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => handleDelete(row.id), variant: "destructive" as const, separator: true },
    ],
    [openEdit, handleRowTranslate, handleDelete]
  )

  const batchActions = useCallback(
    (ids: string[]): ActionItem[] => [
      { label: "Translate All", icon: <Sparkles className="h-3.5 w-3.5" />, onClick: () => handleBatchTranslate(ids) },
    ],
    [handleBatchTranslate]
  )

  const isDialogOpen = !!editItem || showAdd

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
          >
            Site Translations
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Manage all frontend text in English, Greek, and German
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
              {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
              Seed Defaults
            </Button>
          )}
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Translation
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        tableKey="site-translations"
        data={paged}
        columns={columns}
        searchPlaceholder="Search keys or text..."
        pagination={{ page, pageSize, total: filtered.length }}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={(q) => { setSearch(q); setPage(1) }}
        onSortChange={(col, dir) => { setSortCol(col); setSortDir(dir) }}
        rowActions={rowActions}
        batchActions={batchActions}
        toolbar={
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setNsFilter(null); setPage(1) }}
              className="px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                borderRadius: "var(--radius-xs)",
                background: !nsFilter ? "var(--primary)" : "var(--surface-container)",
                color: !nsFilter ? "var(--on-primary)" : "var(--on-surface-variant)",
              }}
            >
              All
            </button>
            {namespaces.map((ns) => (
              <button
                key={ns}
                onClick={() => { setNsFilter(ns); setPage(1) }}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  borderRadius: "var(--radius-xs)",
                  background: nsFilter === ns ? "var(--primary)" : "var(--surface-container)",
                  color: nsFilter === ns ? "var(--on-primary)" : "var(--on-surface-variant)",
                }}
              >
                {ns}
              </button>
            ))}
          </div>
        }
      />

      {/* Edit / Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={() => { setEditItem(null); setShowAdd(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Translation" : "Add Translation"}</DialogTitle>
            <DialogDescription>
              {editItem ? `Editing: ${editItem.key}` : "Add a new translatable text key"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Key</Label>
                <Input
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="header.startPlanning"
                  className="font-mono text-xs"
                  disabled={!!editItem}
                />
              </div>
              <div>
                <Label>Namespace</Label>
                <Input
                  value={form.namespace}
                  onChange={(e) => setForm({ ...form, namespace: e.target.value })}
                  placeholder="common"
                />
              </div>
            </div>

            {/* Language tabs */}
            <div className="flex items-center gap-1">
              {LANGS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    borderRadius: "var(--radius-xs)",
                    background: activeLang === lang ? "var(--primary)" : "var(--surface-container)",
                    color: activeLang === lang ? "var(--on-primary)" : "var(--on-surface-variant)",
                  }}
                >
                  {LANG_FLAGS[lang]} {LANG_LABELS[lang]}
                  {lang !== "en" && !form[lang] && (
                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={handleAutoTranslate}
                disabled={translating || !form.en}
              >
                {translating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                Auto-translate
              </Button>
            </div>

            <div>
              <Label>{LANG_FLAGS[activeLang]} {LANG_LABELS[activeLang]} text</Label>
              <textarea
                value={form[activeLang]}
                onChange={(e) => setForm({ ...form, [activeLang]: e.target.value })}
                placeholder={`Enter ${LANG_LABELS[activeLang]} translation...`}
                rows={3}
                className="mt-1 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1"
                style={{
                  borderColor: "var(--outline-variant)",
                  color: "var(--on-surface)",
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEditItem(null); setShowAdd(false) }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.key || !form.en}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editItem ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
