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

  /* One row is open at a time and all three languages are edited together.
     Cell-by-cell editing meant a save per language and a box too small to
     translate a sentence in. */
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({ en: "", el: "", de: "" })
  const [savingRow, setSavingRow] = useState(false)
  const firstFieldRef = useRef<HTMLTextAreaElement>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Sort
  // Default to the work: what still needs translating comes first.
  const [sortMode, setSortMode] = useState<"missing" | "key">("missing")
  const [statusFilter, setStatusFilter] = useState<"all" | "untranslated" | "complete">("all")

  const [form, setForm] = useState({ key: "", namespace: "common", en: "", el: "", de: "" })
  const [activeLang, setActiveLang] = useState<typeof LANGS[number]>("en")

  /* Namespaces with their counts. There are more than twenty of them, which is
     why a row of pills ran off the side of the screen and pushed the status
     filter out of reach — this belongs in a select. */
  const namespaces = useMemo(() => {
    const counts = new Map<string, number>()
    for (const i of items) counts.set(i.namespace, (counts.get(i.namespace) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  /* Missing is counted per language, because "56 missing" never said which. */
  const gaps = useMemo(
    () => ({
      el: items.filter((i) => !i.el?.trim()).length,
      de: items.filter((i) => !i.de?.trim()).length,
    }),
    [items]
  )

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

    /* Work first. Sorting a 515-row list alphabetically buries the handful of
       rows that actually need someone — the ones with a gap rise to the top,
       the emptier the higher, and finished rows sink. Alphabetical is still
       available for hunting down a specific key. */
    const gapsOf = (t: SiteTranslation) =>
      (t.el?.trim() ? 0 : 1) + (t.de?.trim() ? 0 : 1) + (t.en?.trim() ? 0 : 1)

    result = [...result].sort((a, b) => {
      if (sortMode === "missing") {
        const d = gapsOf(b) - gapsOf(a)
        if (d) return d
      }
      return a.key.localeCompare(b.key)
    })

    return result
  }, [items, nsFilter, search, sortMode, statusFilter])

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

  // Put the caret in the first field as soon as a row opens.
  useEffect(() => {
    if (openId && firstFieldRef.current) firstFieldRef.current.focus()
  }, [openId])

  // ── Row editing ──
  const openRow = useCallback((item: SiteTranslation) => {
    if (openId === item.id) { setOpenId(null); return }
    setOpenId(item.id)
    setDraft({ en: item.en ?? "", el: item.el ?? "", de: item.de ?? "" })
  }, [openId])

  const closeRow = useCallback(() => setOpenId(null), [])

  const saveRow = useCallback(async () => {
    if (!openId) return
    setSavingRow(true)
    try {
      await fetch(`/api/admin/site-translations/${openId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ en: draft.en, el: draft.el, de: draft.de }),
      })
      setItems((prev) => prev.map((i) => (i.id === openId ? { ...i, ...draft } : i)))
      setOpenId(null)
    } finally {
      setSavingRow(false)
    }
  }, [openId, draft])

  /**
   * Translate one language of the open row from its English, into the draft.
   *
   * It fills the box rather than saving: the point of opening a row is to read
   * what comes back and correct it before it is committed.
   */
  const [translatingLang, setTranslatingLang] = useState<string | null>(null)

  const translateInto = useCallback(async (lang: "el" | "de") => {
    const source = draft.en?.trim()
    if (!source) return
    setTranslatingLang(lang)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, languages: [lang] }),
      })
      const data = await res.json()
      const value = data?.translations?.[lang]
      if (value) setDraft((d) => ({ ...d, [lang]: value }))
    } finally {
      setTranslatingLang(null)
    }
  }, [draft.en])

  /* Enter belongs to the text — a translation can run to several lines. Save is
     the modifier chord, Escape abandons. */
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveRow() }
    if (e.key === "Escape") closeRow()
  }, [saveRow, closeRow])

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
    if (!confirm("Translate all missing labels AND content (pages, hero sections, page components, locations, itineraries, staff, reviews) with AI assistance?\n\nThis may take a few minutes.")) return
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
            {/* Which language is short, not just how many rows are incomplete. */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              <span className="tabular-nums">{items.length} keys</span>
              {([["🇬🇷", "Greek", gaps.el], ["🇩🇪", "German", gaps.de]] as const).map(([flag, name, n]) => (
                <span key={name} className="inline-flex items-center gap-1.5 tabular-nums">
                  <span aria-hidden="true">{flag}</span>
                  {n === 0 ? (
                    <span style={{ color: "var(--primary)" }}>{name} complete</span>
                  ) : (
                    <span style={{ color: "#C1782A" }}>{n} {name} missing</span>
                  )}
                </span>
              ))}
              {untranslatedCount === 0 && items.length > 0 && (
                <span style={{ color: "var(--primary)" }}>· nothing outstanding</span>
              )}
            </div>
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

        {/* Search · namespace · status. Wraps rather than overflowing: the
            status filter used to be pushed off the right edge by the pills and
            could not be reached at all. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2" style={{ color: "var(--on-surface-variant)" }} />
            <Input
              placeholder="Search keys or text…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 text-sm"
              style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
            />
          </div>

          <select
            value={nsFilter ?? ""}
            onChange={(e) => setNsFilter(e.target.value || null)}
            className="h-9 rounded-md border px-2.5 text-xs font-medium"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: nsFilter ? "var(--primary)" : "var(--outline-variant)",
              color: "var(--on-surface)",
              maxWidth: 260,
            }}
          >
            <option value="">All groups ({items.length})</option>
            {namespaces.map(([ns, n]) => (
              <option key={ns} value={ns}>{ns} ({n})</option>
            ))}
          </select>

          <div
            className="flex items-center overflow-hidden rounded-md border"
            style={{ borderColor: "var(--outline-variant)" }}
          >
            {([
              { value: "all" as const, label: "All" },
              { value: "untranslated" as const, label: `Missing ${untranslatedCount}` },
              { value: "complete" as const, label: "Done" },
            ]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className="h-9 px-3 text-xs font-medium transition-colors"
                style={{
                  background: statusFilter === value
                    ? (value === "untranslated" ? "#C1782A" : "var(--primary)")
                    : "transparent",
                  color: statusFilter === value ? "#fff" : "var(--on-surface-variant)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {(nsFilter || search || statusFilter !== "all") && (
            <button
              onClick={() => { setNsFilter(null); setSearch(""); setStatusFilter("all") }}
              className="h-9 px-2.5 text-xs font-medium underline underline-offset-2"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Clear
            </button>
          )}

          {/* The sortable column headers went with the table, so the choice
              lives here now. */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as "missing" | "key")}
            className="h-9 rounded-md border px-2.5 text-xs font-medium"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
              color: "var(--on-surface)",
            }}
          >
            <option value="missing">Needs work first</option>
            <option value="key">A → Z by key</option>
          </select>

          <span className="ml-auto text-xs tabular-nums" style={{ color: "var(--on-surface-variant)" }}>
            {filtered.length} shown
          </span>
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
        <ul className="flex flex-col">
          {paged.length === 0 ? (
            <li className="px-4 py-14 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
              No translations found
            </li>
          ) : (
            paged.map((item, i) => {
              const isOpen = openId === item.id
              const missing = LANGS.filter((l) => !item[l]?.trim())

              return (
                <li
                  key={item.id}
                  className="group"
                  style={{
                    borderTop: i ? "1px solid var(--outline-variant)" : undefined,
                    background: isOpen ? "var(--surface-container-low)" : undefined,
                  }}
                >
                  {/* Collapsed header — scannable, one line per key */}
                  <div className="flex items-center gap-2 px-4 py-2.5">
                    <button
                      onClick={() => openRow(item)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      aria-expanded={isOpen}
                    >
                      <ChevronRight
                        className="size-3.5 flex-shrink-0 transition-transform"
                        style={{
                          color: "var(--on-surface-variant)",
                          transform: isOpen ? "rotate(90deg)" : "none",
                        }}
                      />
                      <code
                        className="flex-shrink-0 font-mono text-[11px]"
                        style={{ color: "var(--primary)" }}
                      >
                        {item.key}
                      </code>
                      {/* A glance at the English, so the key alone is not all
                          there is to go on when scanning. */}
                      {!isOpen && item.en && (
                        <span
                          className="min-w-0 flex-1 truncate text-[11px]"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {item.en}
                        </span>
                      )}
                    </button>

                    {/* Which languages are done, at a glance */}
                    <span className="flex flex-shrink-0 items-center gap-1">
                      {LANGS.map((l) => {
                        const has = Boolean(item[l]?.trim())
                        return (
                          <span
                            key={l}
                            title={`${LANG_LABELS[l]}: ${has ? "done" : "missing"}`}
                            className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase"
                            style={{
                              background: has ? "rgba(79,122,70,0.13)" : "rgba(193,120,42,0.14)",
                              color: has ? "#3E6136" : "#8A5418",
                            }}
                          >
                            {l}
                          </span>
                        )
                      })}
                    </span>

                    <span
                      title={item.namespace}
                      className="hidden max-w-[150px] flex-shrink-0 truncate rounded px-1.5 py-0.5 text-[10px] font-medium sm:block"
                      style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
                    >
                      {item.namespace}
                    </span>

                    <button
                      onClick={() => handleRowTranslate(item)}
                      disabled={translatingRowId === item.id || !item.en || !missing.length}
                      className="flex-shrink-0 rounded p-1 transition hover:bg-black/[0.06] disabled:opacity-25"
                      title={missing.length ? "Fill the missing languages from the English" : "Nothing missing"}
                    >
                      {translatingRowId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--secondary)" }} />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--secondary-light)" }} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-shrink-0 rounded p-1 opacity-0 transition hover:bg-red-50 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>

                  {/* Expanded — room to actually write in */}
                  {isOpen && (
                    <div className="px-4 pb-4 pl-10">
                      <div className="flex flex-col gap-3">
                        {LANGS.map((l, idx) => {
                          const empty = !draft[l]?.trim()
                          return (
                            <div key={l} className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span aria-hidden="true" className="text-xs">{LANG_FLAGS[l]}</span>
                                <span
                                  className="text-[10px] font-semibold uppercase tracking-wider"
                                  style={{ color: "var(--on-surface-variant)" }}
                                >
                                  {LANG_LABELS[l]}
                                </span>
                                {empty && (
                                  <span className="text-[10px]" style={{ color: "#C1782A" }}>· missing</span>
                                )}

                                {/* Fills this box from the English so it can be
                                    read and corrected before saving — it does
                                    not write to the database on its own. */}
                                {l !== "en" && (
                                  <button
                                    onClick={() => translateInto(l as "el" | "de")}
                                    disabled={!draft.en?.trim() || translatingLang !== null}
                                    className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition hover:bg-black/[0.06] disabled:opacity-30"
                                    style={{ color: "var(--secondary)" }}
                                    title={draft.en?.trim()
                                      ? `Translate the English into ${LANG_LABELS[l]}`
                                      : "Write the English first"}
                                  >
                                    {translatingLang === l
                                      ? <Loader2 className="size-3 animate-spin" />
                                      : <Sparkles className="size-3" />}
                                    Translate
                                  </button>
                                )}

                                <span
                                  className="ml-auto text-[10px] tabular-nums"
                                  style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}
                                >
                                  {draft[l]?.length ?? 0}
                                </span>
                              </div>
                              <textarea
                                ref={idx === 0 ? firstFieldRef : undefined}
                                value={draft[l] ?? ""}
                                onChange={(e) => setDraft({ ...draft, [l]: e.target.value })}
                                onKeyDown={handleEditKeyDown}
                                rows={3}
                                spellCheck
                                lang={l}
                                className="w-full resize-y rounded-md border px-3 py-2 text-sm leading-relaxed outline-none focus:border-[var(--primary)]"
                                style={{
                                  borderColor: empty ? "rgba(193,120,42,.45)" : "var(--outline-variant)",
                                  color: "var(--on-surface)",
                                  background: "var(--surface-container-lowest)",
                                  minHeight: 76,
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" className="h-7 gap-1 text-xs" onClick={saveRow} disabled={savingRow}>
                          {savingRow ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                          Save all three
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={closeRow} disabled={savingRow}>
                          <X className="size-3" /> Cancel
                        </Button>
                        <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                          ⌘↵ saves · Esc closes · Enter is a new line
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              )
            })
          )}
        </ul>
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
