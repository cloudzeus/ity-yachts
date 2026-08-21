"use client"

import { useState } from "react"
import { PlaneLanding, Loader2, Plus, Trash2, Languages, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"
import {
  asTransfers,
  readableSize,
  type Transfer,
  type TransfersSetting,
} from "@/lib/transfers"

/**
 * The transfer figures, editable by the office.
 *
 * The flights look after themselves — a weekly job reads them from the
 * airlines. These do not: a taxi fare from Preveza and a coach fare from
 * Athens are the office's own knowledge, they move, and a price that only a
 * developer can correct is a price that stays wrong.
 *
 * Three languages, tabbed, with a button that fills the other two from the
 * English — the same shape as every other translated field in this admin, so
 * nobody has to learn a second way of doing it here.
 */

const LOCALES = [
  { key: "en", label: "English" },
  { key: "el", label: "Ελληνικά" },
  { key: "de", label: "Deutsch" },
] as const
type Locale = (typeof LOCALES)[number]["key"]

const FIELDS = [
  { key: "from", label: "Coming from", hint: "Preveza (Aktion) airport" },
  { key: "duration", label: "How long", hint: "20 minutes" },
  { key: "cost", label: "What it costs", hint: "about €40 by taxi, up to 4 people" },
] as const

export function TransfersTab({ initialData }: { initialData: unknown }) {
  const [data, setData] = useState<TransfersSetting>(asTransfers(initialData))
  const [locale, setLocale] = useState<Locale>("en")
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [pickerOpen, setPickerOpen] = useState(false)

  const setItem = (i: number, patch: Partial<Transfer>) =>
    setData((d) => ({ ...d, items: d.items.map((t, n) => (n === i ? { ...t, ...patch } : t)) }))

  const setText = (i: number, field: (typeof FIELDS)[number]["key"], value: string) =>
    setItem(i, { [field]: { ...data.items[i][field], [locale]: value } } as Partial<Transfer>)

  async function save() {
    setSaving(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "transfers", value: data }),
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    } finally {
      setSaving(false)
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  /**
   * Fill Greek and German from the English, leaving anything already written.
   *
   * One call per field, the shape /api/admin/translate already speaks
   * everywhere else in this admin — a batch endpoint would have been fewer
   * requests and a second contract for the same job.
   */
  async function translate() {
    setTranslating(true)
    try {
      const next = structuredClone(data)
      for (let i = 0; i < next.items.length; i++) {
        for (const f of FIELDS) {
          const source = next.items[i][f.key].en?.trim()
          const missing = (["el", "de"] as const).filter((l) => !next.items[i][f.key][l]?.trim())
          if (!source || !missing.length) continue
          const res = await fetch("/api/admin/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: source, languages: missing }),
          })
          if (!res.ok) continue
          const { translations } = await res.json()
          for (const l of missing) {
            if (translations?.[l]) next.items[i][f.key][l] = translations[l]
          }
        }
      }
      setData(next)
    } finally {
      setTranslating(false)
    }
  }

  const addRow = () =>
    setData((d) => ({
      ...d,
      items: [
        ...d.items,
        {
          fromKey: `transfer-${d.items.length + 1}`,
          from: { en: "", el: "", de: "" },
          duration: { en: "", el: "", de: "" },
          cost: { en: "", el: "", de: "" },
          emphasis: "secondary",
        },
      ],
    }))

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
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          <div
            className="size-8 rounded-md flex items-center justify-center"
            style={{ background: "var(--secondary)", borderRadius: "var(--radius-xs)" }}
          >
            <PlaneLanding className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>
              Getting here — transfers
            </p>
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Shown under the flight timetable on /getting-here. The flights themselves come from
              the airlines once a week and need no editing.
            </p>
          </div>
        </div>

        {/* Language tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded-md" style={{ background: "var(--surface-container)" }}>
            {LOCALES.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLocale(l.key)}
                className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
                style={{
                  background: locale === l.key ? "var(--surface-container-lowest)" : "transparent",
                  color: locale === l.key ? "var(--primary)" : "var(--on-surface-variant)",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={translate} disabled={translating}>
            {translating ? <Loader2 className="size-3.5 animate-spin" /> : <Languages className="size-3.5" />}
            Fill Greek & German from English
          </Button>
        </div>

        {data.items.map((item, i) => (
          <div
            key={item.fromKey || i}
            className="rounded-md p-4 flex flex-col gap-3"
            style={{ border: "1px solid var(--outline-variant)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                {item.from.en || `Transfer ${i + 1}`}
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  <input
                    type="checkbox"
                    checked={item.emphasis === "primary"}
                    onChange={(e) => setItem(i, { emphasis: e.target.checked ? "primary" : "secondary" })}
                  />
                  {/* Only one should carry it; the page reads better with a
                      single card in the brand blue. */}
                  Highlight
                </label>
                <button
                  type="button"
                  onClick={() => setData((d) => ({ ...d, items: d.items.filter((_, n) => n !== i) }))}
                  aria-label={`Remove ${item.from.en || `transfer ${i + 1}`}`}
                  className="p-1.5 rounded transition-colors hover:bg-[var(--surface-container)]"
                >
                  <Trash2 className="size-3.5" style={{ color: "var(--error)" }} />
                </button>
              </div>
            </div>

            {FIELDS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                  {f.label}
                </label>
                <input
                  value={item[f.key][locale] ?? ""}
                  onChange={(e) => setText(i, f.key, e.target.value)}
                  placeholder={locale === "en" ? f.hint : ""}
                  className="h-9 px-3 rounded text-sm"
                  style={{
                    background: "var(--surface-container-lowest)",
                    border: "1px solid var(--outline-variant)",
                    color: "var(--on-surface)",
                  }}
                />
              </div>
            ))}
          </div>
        ))}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-3.5" />
            Add a transfer
          </Button>

          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Prices confirmed
            </label>
            <input
              type="date"
              value={data.updated}
              onChange={(e) => setData((d) => ({ ...d, updated: e.target.value }))}
              className="h-9 px-3 rounded text-sm"
              style={{
                background: "var(--surface-container-lowest)",
                border: "1px solid var(--outline-variant)",
                color: "var(--on-surface)",
              }}
            />
          </div>
        </div>

        {/* ── The printable sheet ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 pt-4" style={{ borderTop: "1px solid var(--outline-variant)" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>
              Flight overview (PDF)
            </p>
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Your own sheet, offered as a download on the Getting Here page and on Contact. The
              timetable on the page is always current; this is the version people print, forward
              and open without a signal. Leave it empty and no download is shown.
            </p>
          </div>

          {data.brochure ? (
            <div
              className="flex items-center gap-3 rounded-md p-3"
              style={{ border: "1px solid var(--outline-variant)" }}
            >
              <FileText className="size-5 shrink-0" style={{ color: "var(--primary)" }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium" style={{ color: "var(--on-surface)" }}>
                  {data.brochure.name}
                </p>
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  {readableSize(data.brochure.size) ?? "—"}
                  {data.brochure.updated ? ` · updated ${data.brochure.updated}` : ""}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                Replace
              </Button>
              <button
                type="button"
                onClick={() => setData((d) => ({ ...d, brochure: null }))}
                aria-label="Remove the PDF"
                className="p-1.5 rounded transition-colors hover:bg-[var(--surface-container)]"
              >
                <X className="size-3.5" style={{ color: "var(--error)" }} />
              </button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <FileText className="size-3.5" />
              Choose or upload a PDF
            </Button>
          )}

          {data.brochure && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                What the link says ({LOCALES.find((l) => l.key === locale)?.label})
              </label>
              <input
                value={data.brochure.label[locale] ?? ""}
                onChange={(e) =>
                  setData((d) =>
                    d.brochure
                      ? { ...d, brochure: { ...d.brochure, label: { ...d.brochure.label, [locale]: e.target.value } } }
                      : d
                  )
                }
                placeholder={locale === "en" ? "Flight overview 2027" : ""}
                className="h-9 px-3 rounded text-sm"
                style={{
                  background: "var(--surface-container-lowest)",
                  border: "1px solid var(--outline-variant)",
                  color: "var(--on-surface)",
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid var(--outline-variant)" }}>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Save
          </Button>
          {status === "success" && (
            <span className="text-xs" style={{ color: "var(--success, #16a34a)" }}>Saved</span>
          )}
          {status === "error" && (
            <span className="text-xs" style={{ color: "var(--error)" }}>Could not save</span>
          )}
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        accept="document"
        onSelect={(picked) => {
          const file = (Array.isArray(picked) ? picked[0] : picked) as PickedMedia | undefined
          if (!file) return
          setData((d) => ({
            ...d,
            brochure: {
              url: file.url,
              name: file.name,
              size: file.size,
              /* Kept if the office has already worded it; only the file changed. */
              label: d.brochure?.label ?? { en: "", el: "", de: "" },
              updated: new Date().toISOString().slice(0, 10),
            },
          }))
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
