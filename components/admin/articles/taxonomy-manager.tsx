"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GripVertical, Loader2, Plus, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { slugify, type Taxonomy, type TaxonomyRow } from "@/lib/taxonomy"

const LANGS = ["en", "el", "de"] as const

/**
 * Categories and tags, ordered by dragging.
 *
 * The order is sent as the whole list rather than a pair of swapped indices:
 * a drag can move a row across many positions, and rewriting the list is the
 * only version that cannot fall out of step with what is on screen.
 */
export function TaxonomyManager({ type }: { type: Taxonomy }) {
  const [rows, setRows] = useState<TaxonomyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState<Record<string, string>>({ en: "", el: "", de: "" })

  const dragId = useRef<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/taxonomy/${type}`)
      const json = await res.json()
      setRows(json.items ?? [])
    } catch {
      setError("Could not load")
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => { load() }, [load])

  const persistOrder = async (next: TaxonomyRow[]) => {
    setSaving(true)
    try {
      await fetch(`/api/admin/taxonomy/${type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((r) => r.id) }),
      })
    } finally {
      setSaving(false)
    }
  }

  const drop = (targetId: string) => {
    const from = rows.findIndex((r) => r.id === dragId.current)
    const to = rows.findIndex((r) => r.id === targetId)
    dragId.current = null
    setOverId(null)
    if (from === -1 || to === -1 || from === to) return
    const next = [...rows]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setRows(next)          // optimistic: the row lands where it was dropped
    persistOrder(next)
  }

  const create = async () => {
    const label = (newName.en || newName.el || newName.de || "").trim()
    if (!label) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/taxonomy/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Could not create"); return }
      setRows((r) => [...r, { ...json.item, articleCount: 0 }])
      setNewName({ en: "", el: "", de: "" })
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/taxonomy/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft }),
      })
      const json = await res.json()
      if (res.ok) setRows((r) => r.map((x) => (x.id === id ? { ...x, ...json.item } : x)))
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (row: TaxonomyRow) => {
    const status = row.status === "active" ? "retired" : "active"
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status } : x)))
    await fetch(`/api/admin/taxonomy/${type}/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  const remove = async (row: TaxonomyRow) => {
    const inUse = row.articleCount ?? 0
    const question = inUse
      ? `“${row.name.en || row.name.el}” is on ${inUse} article${inUse === 1 ? "" : "s"}. It will be retired rather than deleted, so those articles keep it. Continue?`
      : `Delete “${row.name.en || row.name.el}”?`
    if (!confirm(question)) return

    const res = await fetch(`/api/admin/taxonomy/${type}/${row.id}`, { method: "DELETE" })
    const json = await res.json().catch(() => ({}))
    if (json.retired) setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status: "retired" } : x)))
    else setRows((r) => r.filter((x) => x.id !== row.id))
  }

  const noun = type === "categories" ? "category" : "tag"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
          {rows.length} {rows.length === 1 ? noun : type} · drag to reorder
          {saving && <span className="ml-2 inline-flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> saving</span>}
        </p>
        <Button size="sm" className="h-7 text-xs" onClick={() => setAdding((v) => !v)}>
          <Plus className="mr-1 size-3" /> New {noun}
        </Button>
      </div>

      {adding && (
        <div className="rounded-md border p-3" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-lowest)" }}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {LANGS.map((l) => (
              <div key={l} className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>{l}</Label>
                <Input
                  value={newName[l] ?? ""}
                  onChange={(e) => setNewName({ ...newName, [l]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") create() }}
                  className="h-7 text-xs"
                  style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                />
              </div>
            ))}
          </div>
          {/* The slug is what the public URL is built from; show it before it is fixed. */}
          <p className="mt-2 text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
            URL: <code>/news/{type === "categories" ? "category" : "tag"}/{slugify(newName.en || newName.el || newName.de || "")}</code>
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs" onClick={create} disabled={saving}>Add</Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs" style={{ color: "#C1782A" }}>{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs" style={{ color: "var(--on-surface-variant)" }}>
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-xs" style={{ color: "var(--on-surface-variant)" }}>
          Nothing here yet
        </p>
      ) : (
        <ul className="flex flex-col rounded-md border" style={{ borderColor: "var(--outline-variant)" }}>
          {rows.map((row, i) => {
            const isEditing = editing === row.id
            return (
              <li
                key={row.id}
                draggable={!isEditing}
                onDragStart={() => { dragId.current = row.id }}
                onDragOver={(e) => { e.preventDefault(); setOverId(row.id) }}
                onDragLeave={() => setOverId((v) => (v === row.id ? null : v))}
                onDrop={(e) => { e.preventDefault(); drop(row.id) }}
                className="flex items-center gap-3 px-3 py-2"
                style={{
                  borderTop: i ? "1px solid var(--outline-variant)" : undefined,
                  background: overId === row.id ? "var(--surface-container)" : "transparent",
                  opacity: row.status === "active" ? 1 : 0.5,
                }}
              >
                <GripVertical
                  className="size-4 flex-shrink-0 cursor-grab active:cursor-grabbing"
                  style={{ color: "var(--on-surface-variant)", opacity: 0.6 }}
                />

                {row.color && (
                  <span className="size-2.5 flex-shrink-0 rounded-full" style={{ background: row.color }} />
                )}

                {isEditing ? (
                  <div className="flex flex-1 flex-wrap gap-2">
                    {LANGS.map((l) => (
                      <Input
                        key={l}
                        value={draft[l] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [l]: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(row.id); if (e.key === "Escape") setEditing(null) }}
                        placeholder={l.toUpperCase()}
                        className="h-7 min-w-[110px] flex-1 text-xs"
                        style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                      />
                    ))}
                    <Button size="sm" className="h-7 px-2" onClick={() => saveEdit(row.id)}><Check className="size-3" /></Button>
                    <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setEditing(null)}><X className="size-3" /></Button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditing(row.id); setDraft({ ...row.name }) }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>
                      {row.name.en || row.name.el || row.name.de}
                    </span>
                    <span className="ml-2 text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                      {[row.name.el, row.name.de].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                )}

                {!isEditing && (
                  <>
                    <span
                      className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] tabular-nums"
                      style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
                      title={`${row.articleCount ?? 0} article(s)`}
                    >
                      {row.articleCount ?? 0}
                    </span>
                    <button
                      onClick={() => toggleStatus(row)}
                      className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      style={{
                        background: row.status === "active" ? "rgba(79,122,70,0.14)" : "var(--surface-container)",
                        color: row.status === "active" ? "#3E6136" : "var(--on-surface-variant)",
                      }}
                      title="Retired items stay on their articles but disappear from the pickers"
                    >
                      {row.status === "active" ? "Active" : "Retired"}
                    </button>
                    <button onClick={() => remove(row)} className="flex-shrink-0 p-1" title="Delete">
                      <Trash2 className="size-3.5" style={{ color: "#B3261E", opacity: 0.75 }} />
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
