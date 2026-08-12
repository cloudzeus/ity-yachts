"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, Languages, Check, EyeOff, Eye, Quote } from "lucide-react"

const LANGS = [
  { code: "en", label: "English" },
  { code: "el", label: "Ελληνικά" },
  { code: "de", label: "Deutsch" },
] as const
type Lang = (typeof LANGS)[number]["code"]

const CATEGORIES = [
  { value: "hero", label: "Hero headlines" },
  { value: "family", label: "Family & emotion" },
  { value: "heritage", label: "Heritage & trust" },
  { value: "action", label: "Action & service" },
] as const

const FIELDS = [
  { key: "heading", label: "Heading", rows: 2, hint: "The hook — the line that lands first" },
  { key: "subheading", label: "Subheading", rows: 2, hint: "The payoff that completes the thought" },
  { key: "subtext", label: "Subtext", rows: 3, hint: "Optional supporting line" },
] as const
type FieldKey = (typeof FIELDS)[number]["key"]

type Tri = Record<string, string>
interface Motto {
  id: string
  slug: string
  category: string
  heading: Tri
  subheading: Tri
  subtext: Tri
  isActive: boolean
  sortOrder: number
}

const EMPTY: Tri = { en: "", el: "", de: "" }

export function MottosClient({ initialData }: { initialData: Motto[] }) {
  const router = useRouter()
  const [mottos, setMottos] = useState<Motto[]>(initialData)
  const [selectedId, setSelectedId] = useState<string | null>(initialData[0]?.id ?? null)
  const [lang, setLang] = useState<Lang>("el")
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [translating, setTranslating] = useState<FieldKey | null>(null)
  const [filter, setFilter] = useState("")

  const selected = mottos.find((m) => m.id === selectedId) ?? null

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const visible = q
      ? mottos.filter((m) =>
          [m.slug, ...Object.values(m.heading), ...Object.values(m.subheading)]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : mottos
    return CATEGORIES.map((c) => ({
      ...c,
      items: visible.filter((m) => m.category === c.value),
    })).filter((g) => g.items.length > 0)
  }, [mottos, filter])

  function patchLocal(id: string, patch: Partial<Motto>) {
    setMottos((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  async function persist(id: string, patch: Partial<Motto>) {
    setSaving(true)
    try {
      await fetch(`/api/admin/mottos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  function editField(field: FieldKey, value: string) {
    if (!selected) return
    const next = { ...(selected[field] ?? EMPTY), [lang]: value }
    patchLocal(selected.id, { [field]: next } as Partial<Motto>)
  }

  /** Fill the two locales the editor is not looking at, from the one they are. */
  async function translateField(field: FieldKey) {
    if (!selected) return
    const source = (selected[field] ?? EMPTY)[lang]
    if (!source.trim()) return
    setTranslating(field)
    try {
      const targets = LANGS.map((l) => l.code).filter((c) => c !== lang)
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, languages: targets, sourceLang: lang }),
      })
      if (!res.ok) return
      const { translations } = await res.json()
      const next = { ...(selected[field] ?? EMPTY), ...translations }
      patchLocal(selected.id, { [field]: next } as Partial<Motto>)
      await persist(selected.id, { [field]: next } as Partial<Motto>)
    } finally {
      setTranslating(null)
    }
  }

  async function createMotto() {
    const res = await fetch("/api/admin/mottos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "hero", heading: { en: "New motto" } }),
    })
    if (!res.ok) return
    const motto = await res.json()
    setMottos((prev) => [...prev, motto])
    setSelectedId(motto.id)
    setLang("en")
    router.refresh()
  }

  async function removeMotto(id: string) {
    const m = mottos.find((x) => x.id === id)
    if (!confirm(`Delete "${m?.heading.en || m?.slug}"? Pages referencing it fall back to their own copy.`)) return
    await fetch(`/api/admin/mottos/${id}`, { method: "DELETE" })
    setMottos((prev) => prev.filter((x) => x.id !== id))
    if (selectedId === id) setSelectedId(null)
    router.refresh()
  }

  const missingCount = (m: Motto) =>
    LANGS.filter((l) => !(m.heading?.[l.code] ?? "").trim()).length

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="text-[1.5rem] font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
          >
            Mottos
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            {mottos.length} reusable lines · pick them in any hero
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search mottos…"
            className="h-9 w-56 rounded-md border px-3 text-xs"
            style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-lowest)" }}
          />
          <button
            type="button"
            onClick={createMotto}
            className="flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            <Plus className="size-3.5" /> New
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* List */}
        <div
          className="min-h-0 overflow-y-auto"
          style={{
            background: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          {grouped.length === 0 && (
            <p className="p-6 text-center text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Nothing matches “{filter}”.
            </p>
          )}
          {grouped.map((group) => (
            <div key={group.value}>
              <div
                className="sticky top-0 z-10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
              >
                {group.label}
                <span className="ml-1.5 font-normal opacity-70">{group.items.length}</span>
              </div>
              {group.items.map((m) => {
                const missing = missingCount(m)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors"
                    style={{
                      background: m.id === selectedId ? "var(--surface-container-low)" : "transparent",
                      borderLeft: `3px solid ${m.id === selectedId ? "var(--primary)" : "transparent"}`,
                      borderBottom: "1px solid var(--outline-variant)",
                      opacity: m.isActive ? 1 : 0.5,
                    }}
                  >
                    <span
                      className="line-clamp-2 text-xs font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      {m.heading?.[lang] || m.heading?.en || m.slug}
                    </span>
                    <span className="flex items-center gap-2">
                      {!m.isActive && (
                        <span className="text-[9px] font-bold uppercase" style={{ color: "var(--on-surface-variant)" }}>
                          Hidden
                        </span>
                      )}
                      {missing > 0 && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                          style={{ background: "rgba(193,120,42,0.14)", color: "#8A5418" }}
                        >
                          {missing} missing
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div
          className="flex min-h-0 flex-col overflow-hidden"
          style={{
            background: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          {!selected ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                Select a motto, or create one.
              </p>
            </div>
          ) : (
            <>
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                style={{ background: "var(--surface-container-low)" }}
              >
                <div className="min-w-0">
                  <code className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                    {selected.slug}
                  </code>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={selected.category}
                      onChange={(e) => {
                        patchLocal(selected.id, { category: e.target.value })
                        persist(selected.id, { category: e.target.value })
                      }}
                      className="h-7 rounded-md border px-2 text-xs"
                      style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-lowest)" }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        patchLocal(selected.id, { isActive: !selected.isActive })
                        persist(selected.id, { isActive: !selected.isActive })
                      }}
                      className="flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs"
                      style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
                    >
                      {selected.isActive ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      {selected.isActive ? "Visible" : "Hidden"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1" role="group" aria-label="Language">
                    {LANGS.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => setLang(l.code)}
                        aria-pressed={l.code === lang}
                        className="px-2.5 py-1 text-xs font-semibold transition-colors"
                        style={{
                          borderRadius: "var(--radius-xs)",
                          background: l.code === lang ? "var(--primary)" : "transparent",
                          color: l.code === lang ? "#fff" : "var(--on-surface-variant)",
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                    {saving ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" /> Saving
                      </span>
                    ) : savedAt ? (
                      <span className="flex items-center gap-1">
                        <Check className="size-3" /> Saved
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMotto(selected.id)}
                    aria-label="Delete motto"
                    className="rounded-md p-1.5"
                    style={{ color: "#B3261E" }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {FIELDS.map((f) => {
                  const value = (selected[f.key] ?? EMPTY)[lang] ?? ""
                  const filled = LANGS.filter((l) => ((selected[f.key] ?? EMPTY)[l.code] ?? "").trim())
                  return (
                    <div key={f.key} className="mb-6">
                      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                        <label className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                          {f.label}
                          <span className="ml-2 font-normal" style={{ color: "var(--on-surface-variant)" }}>
                            {f.hint}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => translateField(f.key)}
                          disabled={!value.trim() || translating === f.key}
                          className="flex items-center gap-1 text-[11px] font-semibold disabled:opacity-40"
                          style={{ color: "var(--secondary)" }}
                        >
                          {translating === f.key ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Languages className="size-3" />
                          )}
                          Translate to the other two
                        </button>
                      </div>
                      <textarea
                        value={value}
                        rows={f.rows}
                        onChange={(e) => editField(f.key, e.target.value)}
                        onBlur={() => persist(selected.id, { [f.key]: selected[f.key] } as Partial<Motto>)}
                        className="w-full resize-none rounded-md border px-3 py-2 text-sm"
                        style={{
                          borderColor: "var(--outline-variant)",
                          background: "var(--surface-container-lowest)",
                          color: "var(--primary)",
                        }}
                      />
                      <div className="mt-1 flex gap-2">
                        {LANGS.map((l) => (
                          <span
                            key={l.code}
                            className="text-[10px] font-semibold uppercase"
                            style={{
                              color: filled.some((x) => x.code === l.code)
                                ? "var(--secondary)"
                                : "var(--on-surface-variant)",
                              opacity: filled.some((x) => x.code === l.code) ? 1 : 0.45,
                            }}
                          >
                            {l.code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Preview — what the visitor reads, in the selected language */}
                <div
                  className="mt-2 rounded-lg p-6"
                  style={{ background: "var(--surface-container-low)" }}
                >
                  <div
                    className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    <Quote className="size-3" /> Preview · {LANGS.find((l) => l.code === lang)?.label}
                  </div>
                  <p
                    className="text-xl font-bold leading-tight"
                    style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
                  >
                    {(selected.heading ?? EMPTY)[lang] || "—"}
                  </p>
                  <p className="mt-1 text-base" style={{ color: "var(--on-surface-variant)" }}>
                    {(selected.subheading ?? EMPTY)[lang]}
                  </p>
                  {(selected.subtext ?? EMPTY)[lang] && (
                    <p className="mt-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      {(selected.subtext ?? EMPTY)[lang]}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
