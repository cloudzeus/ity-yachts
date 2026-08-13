"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { TaxonomyRow } from "@/lib/taxonomy"

/**
 * Category and tag pickers, fed from the managed taxonomy.
 *
 * Retired entries are hidden unless this article already carries one — taking
 * a category out of circulation should not silently strip it from the pieces
 * that were filed under it.
 */
export function ArticleTaxonomyFields({
  categoryId,
  onCategoryChange,
  tagIds,
  onTagsChange,
}: {
  categoryId: string
  onCategoryChange: (id: string) => void
  tagIds: string[]
  onTagsChange: (ids: string[]) => void
}) {
  const [categories, setCategories] = useState<TaxonomyRow[]>([])
  const [tags, setTags] = useState<TaxonomyRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/taxonomy/categories").then((r) => (r.ok ? r.json() : { items: [] })),
      fetch("/api/admin/taxonomy/tags").then((r) => (r.ok ? r.json() : { items: [] })),
    ])
      .then(([c, t]) => { setCategories(c.items ?? []); setTags(t.items ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const label = (r: TaxonomyRow) => r.name.en || r.name.el || r.name.de || r.slug
  const visible = (r: TaxonomyRow, selected: boolean) => r.status === "active" || selected

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs" style={{ color: "var(--on-surface-variant)" }}>
        <Loader2 className="size-3 animate-spin" /> Loading categories…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
          Category
        </Label>
        <select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-8 rounded-md border px-2 text-xs"
          style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
        >
          <option value="">— none —</option>
          {categories.filter((c) => visible(c, c.id === categoryId)).map((c) => (
            <option key={c.id} value={c.id}>
              {label(c)}{c.status !== "active" ? " (retired)" : ""}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
            None yet — add them on the Categories tab.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
          Tags {tagIds.length > 0 && <span className="tabular-nums">· {tagIds.length}</span>}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.filter((t) => visible(t, tagIds.includes(t.id))).map((t) => {
            const on = tagIds.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTagsChange(on ? tagIds.filter((x) => x !== t.id) : [...tagIds, t.id])}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition"
                style={{
                  background: on ? "var(--primary)" : "var(--surface-container)",
                  color: on ? "var(--on-primary)" : "var(--on-surface-variant)",
                  border: "1px solid " + (on ? "var(--primary)" : "var(--outline-variant)"),
                }}
              >
                {on && <Check className="size-3" />}
                {label(t)}
              </button>
            )
          })}
          {tags.length === 0 && (
            <p className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
              None yet — add them on the Tags tab.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
