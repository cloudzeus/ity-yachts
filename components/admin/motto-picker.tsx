"use client"

import { useEffect, useState } from "react"
import { Quote, Loader2, ChevronDown } from "lucide-react"

/**
 * Drops a saved motto into whatever copy fields a panel owns.
 *
 * It fills all three languages at once and then gets out of the way: the
 * fields stay editable afterwards, so a motto is a starting point rather than
 * a binding. Nothing stores which motto was used — pasting the words is the
 * whole contract, which keeps the hero independent of a motto later deleted.
 */

type Tri = Record<string, string>
interface Motto {
  id: string
  slug: string
  category: string
  heading: Tri
  subheading: Tri
  subtext: Tri
  isActive: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero headlines",
  family: "Family & emotion",
  heritage: "Heritage & trust",
  action: "Action & service",
}

export function MottoPicker({
  onApply,
  label = "Use a motto",
}: {
  /** Receives all three locales for each part; apply whichever the panel has. */
  onApply: (m: { heading: Tri; subheading: Tri; subtext: Tri }) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [mottos, setMottos] = useState<Motto[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || mottos) return
    setLoading(true)
    fetch("/api/admin/mottos")
      .then((r) => (r.ok ? r.json() : { mottos: [] }))
      .then((d) => setMottos((d.mottos ?? []).filter((m: Motto) => m.isActive)))
      .finally(() => setLoading(false))
  }, [open, mottos])

  const grouped = (mottos ?? []).reduce<Record<string, Motto[]>>((acc, m) => {
    ;(acc[m.category] ??= []).push(m)
    return acc
  }, {})

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors hover:underline"
        style={{ color: "var(--secondary)" }}
      >
        <Quote className="size-3" />
        {label}
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute right-0 z-50 mt-2 max-h-96 w-[420px] overflow-y-auto p-2"
            style={{
              background: "var(--surface-container-lowest)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-ambient)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            {loading && (
              <p className="flex items-center justify-center gap-2 p-4 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                <Loader2 className="size-3 animate-spin" /> Loading…
              </p>
            )}

            {!loading && mottos?.length === 0 && (
              <p className="p-4 text-center text-xs" style={{ color: "var(--on-surface-variant)" }}>
                No mottos yet. Create them under CMS → Mottos.
              </p>
            )}

            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="mb-1">
                <div
                  className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </div>
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onApply({ heading: m.heading, subheading: m.subheading, subtext: m.subtext })
                      setOpen(false)
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--surface-container-low)]"
                  >
                    <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                      {m.heading?.el || m.heading?.en || m.slug}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                      {m.subheading?.el || m.subheading?.en}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
