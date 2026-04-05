"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, Trash2, Loader2, Sparkles, ScanSearch, Eraser, Globe,
  Languages, ChevronLeft, ChevronRight, Check, X, Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"

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
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [bulkTranslating, setBulkTranslating] = useState(false)
  const [cleaningUp, setCleaningUp] = useState(false)
  const [scanResult, setScanResult] = useState<{
    totalInCode: number
    totalInDb: number
    orphaned: { id: string; key: string; en: string }[]
    missing: string[]
    created?: number
    untranslated: number
    filesScanned: number
  } | null>(null)
  const [translatingRowId, setTranslatingRowId] = useState<string | null>(null)

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: string; lang: string } | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [savingCell, setSavingCell] = useState(false)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Sort
  const [sortCol, setSortCol] = useState<string>("key")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [statusFilter, setStatusFilter] = useState<"all" | "untranslated" | "complete">("all")

  const [form, setForm] = useState({ key: "", namespace: "common", en: "", el: "", de: "" })
  const [activeLang, setActiveLang] = useState<typeof LANGS[number]>("en")

  const namespaces = [...new Set(items.map((i) => i.namespace))].sort()

  // Filter + sort
  const filtered = useMemo(() => {
    let result = items.filter((i) => {
      if (nsFilter && i.namespace !== nsFilter) return false
      if (statusFilter === "untranslated" && i.el && i.de) return false
      if (statusFilter === "complete" && (!i.el || !i.de)) return false
      if (search) {
        const q = search.toLowerCase()
        return i.key.toLowerCase().includes(q) || i.en.toLowerCase().includes(q) || i.el.toLowerCase().includes(q) || i.de.toLowerCase().includes(q)
      }
      return true
    })

    if (sortCol) {
      result = [...result].sort((a, b) => {
        const aVal = (a as Record<string, string>)[sortCol] || ""
        const bVal = (b as Record<string, string>)[sortCol] || ""
        const cmp = aVal.localeCompare(bVal)
        return sortDir === "desc" ? -cmp : cmp
      })
    }

    return result
  }, [items, nsFilter, search, sortCol, sortDir, statusFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, nsFilter, statusFilter])

  // Stats
  const untranslatedCount = items.filter((i) => !i.el || !i.de).length
  const completeCount = items.filter((i) => i.en && i.el && i.de).length

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingCell])

  // ── Inline edit handlers ──
  const startEdit = useCallback((item: SiteTranslation, lang: string) => {
    setEditingCell({ id: item.id, lang })
    setEditingValue((item as Record<string, string>)[lang] || "")
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingCell(null)
    setEditingValue("")
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editingCell) return
    setSavingCell(true)
    try {
      await fetch(`/api/admin/site-translations/${editingCell.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editingCell.lang]: editingValue }),
      })
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingCell.id ? { ...i, [editingCell.lang]: editingValue } : i
        )
      )
      setEditingCell(null)
      setEditingValue("")
    } finally {
      setSavingCell(false)
    }
  }, [editingCell, editingValue])

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit() }
    if (e.key === "Escape") cancelEdit()
  }, [saveEdit, cancelEdit])

  // ── Other handlers ──
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await fetch("/api/admin/site-translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      router.refresh()
      setShowAdd(false)
      const res = await fetch("/api/admin/site-translations")
      setItems(await res.json())
    } finally {
      setSaving(false)
    }
  }, [form, router])

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

  const handleScan = useCallback(async () => {
    setScanning(true)
    setScanResult(null)
    try {
      const res = await fetch("/api/admin/site-translations/scan", { method: "POST" })
      const data = await res.json()
      setScanResult(data)
      if (data.created > 0) {
        const updated = await fetch("/api/admin/site-translations")
        setItems(await updated.json())
      }
    } finally {
      setScanning(false)
    }
  }, [])

  const handleCleanup = useCallback(async () => {
    if (!scanResult?.orphaned.length) return
    const count = scanResult.orphaned.length
    if (!confirm(`Delete ${count} orphaned translation${count !== 1 ? "s" : ""}? This cannot be undone.`)) return
    setCleaningUp(true)
    try {
      const ids = scanResult.orphaned.map((o) => o.id)
      const res = await fetch("/api/admin/site-translations/cleanup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (data.deleted) {
        setItems((prev) => prev.filter((i) => !ids.includes(i.id)))
        setScanResult((prev) => prev ? { ...prev, orphaned: [] } : prev)
      }
    } finally {
      setCleaningUp(false)
    }
  }, [scanResult])

  const handleTranslateAll = useCallback(async () => {
    if (!confirm("Translate all missing labels AND content (pages, locations, itineraries, staff, reviews) with DeepSeek?\n\nThis may take a few minutes.")) return
    setBulkTranslating(true)
    try {
      const res = await fetch("/api/admin/site-translations/translate-all", { method: "POST" })
      const data = await res.json()
      const lines = [
        `Labels: ${data.labels?.translated ?? data.translated} translated, ${data.labels?.failed ?? data.failed} failed`,
        data.content ? `Content: ${data.content.translated} translated, ${data.content.failed} failed` : null,
        data.errors?.length ? `\nFailed: ${data.errors.join(", ")}` : null,
      ].filter(Boolean)
      alert(lines.join("\n"))
      const updated = await fetch("/api/admin/site-translations")
      setItems(await updated.json())
    } finally {
      setBulkTranslating(false)
    }
  }, [])

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortCol(col)
      setSortDir("asc")
    }
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Header — fixed */}
      <div className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--on-surface)" }}
            >
              Site Translations
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              {items.length} keys · <span style={{ color: "var(--primary)" }}>{completeCount} translated</span> · <span style={{ color: untranslatedCount > 0 ? "var(--warning, #e8a800)" : "var(--on-surface-variant)" }}>{untranslatedCount} missing</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.length === 0 && (
              <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
                {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                Seed Defaults
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning}>
              {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}
              Scan Site
            </Button>
            <Button variant="outline" size="sm" onClick={handleTranslateAll} disabled={bulkTranslating}>
              {bulkTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
              Translate All
            </Button>
            <Button size="sm" onClick={() => { setForm({ key: "", namespace: "common", en: "", el: "", de: "" }); setActiveLang("en"); setShowAdd(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        {/* Search + namespace filter */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--on-surface-variant)" }} />
            <Input
              placeholder="Search keys or text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
              style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setNsFilter(null)}
              className="px-2.5 py-1 text-xs font-medium rounded transition-colors"
              style={{
                background: !nsFilter ? "var(--primary)" : "var(--surface-container)",
                color: !nsFilter ? "var(--on-primary)" : "var(--on-surface-variant)",
              }}
            >
              All
            </button>
            {namespaces.map((ns) => (
              <button
                key={ns}
                onClick={() => setNsFilter(ns)}
                className="px-2.5 py-1 text-xs font-medium rounded transition-colors"
                style={{
                  background: nsFilter === ns ? "var(--primary)" : "var(--surface-container)",
                  color: nsFilter === ns ? "var(--on-primary)" : "var(--on-surface-variant)",
                }}
              >
                {ns}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-2 pl-2" style={{ borderLeft: "1px solid var(--outline-variant)" }}>
            {([
              { value: "all" as const, label: "All" },
              { value: "untranslated" as const, label: `Missing (${untranslatedCount})` },
              { value: "complete" as const, label: "Complete" },
            ]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className="px-2.5 py-1 text-xs font-medium rounded transition-colors"
                style={{
                  background: statusFilter === value ? (value === "untranslated" ? "#e8a800" : "var(--primary)") : "var(--surface-container)",
                  color: statusFilter === value ? "#fff" : "var(--on-surface-variant)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Results */}
      {scanResult && (
        <div
          className="flex-shrink-0 mb-4 space-y-3 rounded-md border p-4"
          style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-lowest)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "var(--on-surface)", fontFamily: "var(--font-display)" }}>
              Scan Results
            </h2>
            <button onClick={() => setScanResult(null)} className="text-xs hover:underline" style={{ color: "var(--on-surface-variant)" }}>
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Files scanned", value: scanResult.filesScanned },
              { label: "Keys in code", value: scanResult.totalInCode },
              { label: "Keys in DB", value: scanResult.totalInDb },
              { label: "Untranslated", value: scanResult.untranslated, warn: scanResult.untranslated > 0 },
            ].map(({ label, value, warn }) => (
              <div key={label} className="rounded-md p-3" style={{ background: "var(--surface-container-low)" }}>
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{label}</p>
                <p className="text-lg font-bold" style={{ color: warn ? "var(--warning)" : "var(--on-surface)" }}>{value}</p>
              </div>
            ))}
          </div>

          {scanResult.orphaned.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium" style={{ color: "var(--error)" }}>
                  {scanResult.orphaned.length} orphaned (in DB but not in code)
                </p>
                <Button variant="outline" size="sm" onClick={handleCleanup} disabled={cleaningUp} className="border-red-200 text-red-600 hover:bg-red-50">
                  {cleaningUp ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Eraser className="mr-1.5 h-3.5 w-3.5" />}
                  Delete Orphaned
                </Button>
              </div>
            </div>
          )}

          {scanResult.missing.length > 0 && (
            <p className="text-xs font-medium" style={{ color: "var(--secondary)" }}>
              {scanResult.missing.length} missing key{scanResult.missing.length !== 1 ? "s" : ""} found
              {scanResult.created ? ` — ${scanResult.created} auto-created` : ""}
            </p>
          )}

          {scanResult.orphaned.length === 0 && scanResult.missing.length === 0 && (
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              All clean — code and database keys are in sync.
            </p>
          )}
        </div>
      )}

      {/* Table — scrollable area */}
      <div
        className="flex-1 min-h-0 overflow-auto rounded-lg border"
        style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-lowest)" }}
      >
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "220px" }} />
            <col style={{ width: "80px" }} />
            <col />
            <col />
            <col />
            <col style={{ width: "80px" }} />
          </colgroup>
          <thead className="sticky top-0 z-10" style={{ background: "var(--surface-container-low)" }}>
            <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              {[
                { key: "key", label: "Key" },
                { key: "namespace", label: "NS" },
                { key: "en", label: "🇬🇧 English" },
                { key: "el", label: "🇬🇷 Greek" },
                { key: "de", label: "🇩🇪 German" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:bg-black/[0.03]"
                  style={{ color: "var(--on-surface-variant)" }}
                  onClick={() => handleSort(key)}
                >
                  {label}
                  {sortCol === key && (
                    <span className="ml-1 text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
              <th className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  No translations found
                </td>
              </tr>
            ) : (
              paged.map((item, i) => (
                <tr
                  key={item.id}
                  className="group transition-colors hover:bg-black/[0.02]"
                  style={{ borderBottom: i < paged.length - 1 ? "1px solid var(--outline-variant)" : undefined }}
                >
                  {/* Key */}
                  <td className="px-3 py-2">
                    <code className="text-xs font-mono break-all" style={{ color: "var(--primary)" }}>{item.key}</code>
                  </td>

                  {/* Namespace */}
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded"
                      style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
                    >
                      {item.namespace}
                    </span>
                  </td>

                  {/* EN / EL / DE — inline editable */}
                  {(["en", "el", "de"] as const).map((lang) => {
                    const isEditing = editingCell?.id === item.id && editingCell?.lang === lang
                    const value = item[lang]

                    return (
                      <td key={lang} className="px-3 py-1.5">
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            <textarea
                              ref={editInputRef}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              rows={2}
                              className="w-full resize-none rounded border px-2 py-1.5 text-xs outline-none focus:ring-2"
                              style={{
                                borderColor: "var(--primary)",
                                color: "var(--on-surface)",
                                background: "var(--surface-container-lowest)",
                              }}
                            />
                            <div className="flex items-center gap-1">
                              <button
                                onClick={saveEdit}
                                disabled={savingCell}
                                className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-white transition"
                                style={{ background: "var(--primary)" }}
                              >
                                {savingCell ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition"
                                style={{ color: "var(--on-surface-variant)", background: "var(--surface-container)" }}
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item, lang)}
                            className="block w-full text-left rounded px-1.5 py-1 text-xs transition hover:bg-black/[0.04] cursor-text min-h-[28px]"
                            style={{ color: value ? "var(--on-surface)" : "var(--outline)" }}
                            title="Click to edit"
                          >
                            {value || (
                              <span className="italic opacity-50" style={{ color: lang !== "en" ? "#e8a800" : undefined }}>
                                {lang === "en" ? "empty — click to add" : "⚠ missing — click to add"}
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                    )
                  })}

                  {/* Actions */}
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => handleRowTranslate(item)}
                        disabled={translatingRowId === item.id || !item.en}
                        className="rounded p-1 transition hover:bg-black/[0.06] disabled:opacity-30"
                        title="AI Translate"
                      >
                        {translatingRowId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--secondary)" }} />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--secondary-light)" }} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded p-1 transition hover:bg-red-50 opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — fixed at bottom */}
      <div className="flex-shrink-0 flex items-center justify-between pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="h-7 rounded border px-1.5 text-xs"
            style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface)", background: "var(--surface-container-lowest)" }}
          >
            {[25, 50, 100, 200].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded p-1.5 transition hover:bg-black/[0.05] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" style={{ color: "var(--on-surface-variant)" }} />
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 7) pageNum = i + 1
              else if (page <= 4) pageNum = i + 1
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i
              else pageNum = page - 3 + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className="min-w-[28px] h-7 rounded px-1.5 text-xs font-medium transition"
                  style={{
                    background: pageNum === page ? "var(--primary)" : "transparent",
                    color: pageNum === page ? "var(--on-primary)" : "var(--on-surface-variant)",
                  }}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="rounded p-1.5 transition hover:bg-black/[0.05] disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" style={{ color: "var(--on-surface-variant)" }} />
            </button>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Translation</DialogTitle>
            <DialogDescription>Add a new translatable text key</DialogDescription>
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
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  style={{
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
                style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.key || !form.en}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
