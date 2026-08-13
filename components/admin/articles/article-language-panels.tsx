"use client"

import { useState } from "react"
import { ChevronRight, Globe, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

const LANGS = ["en", "el", "de"] as const
type Lang = (typeof LANGS)[number]

const META: Record<Lang, { flag: string; name: string }> = {
  en: { flag: "🇬🇧", name: "English" },
  el: { flag: "🇬🇷", name: "Ελληνικά" },
  de: { flag: "🇩🇪", name: "Deutsch" },
}

type I18n = Record<string, string>

/**
 * One panel per language, holding that language's whole article.
 *
 * Grouping by field instead put three languages side by side, which left each
 * of them a third of the width — an article body was being written into a box
 * a few centimetres wide. Nobody writes in three languages at once anyway;
 * they write one, then the next.
 */
export function ArticleLanguagePanels({
  title, onTitle,
  shortDesc, onShortDesc,
  description, onDescription,
}: {
  title: I18n
  onTitle: (v: I18n) => void
  shortDesc: I18n
  onShortDesc: (v: I18n) => void
  description: I18n
  onDescription: (v: I18n) => void
}) {
  // English open to begin with — it is the source the rest are written from.
  const [open, setOpen] = useState<Lang | null>("en")
  const [translating, setTranslating] = useState<Lang | null>(null)

  const filled = (l: Lang) =>
    [title[l], shortDesc[l], description[l]].filter((v) => v?.trim()).length

  /** Fill one language from the English — all three fields in one call. */
  const translateInto = async (lang: Lang) => {
    if (lang === "en") return
    const parts = [title.en ?? "", shortDesc.en ?? "", description.en ?? ""]
    if (!parts.some((p) => p.trim())) return

    setTranslating(lang)
    try {
      const results = await Promise.all(
        parts.map(async (text) => {
          if (!text.trim()) return ""
          const res = await fetch("/api/admin/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, languages: [lang] }),
          })
          if (!res.ok) return ""
          const json = await res.json()
          return json?.translations?.[lang] ?? ""
        })
      )
      const [t, s, d] = results
      if (t) onTitle({ ...title, [lang]: t })
      if (s) onShortDesc({ ...shortDesc, [lang]: s })
      if (d) onDescription({ ...description, [lang]: d })
      setOpen(lang)
    } finally {
      setTranslating(null)
    }
  }

  return (
    <div className="flex flex-col rounded-md border" style={{ borderColor: "var(--outline-variant)" }}>
      {LANGS.map((l, i) => {
        const isOpen = open === l
        const count = filled(l)

        return (
          <div key={l} style={{ borderTop: i ? "1px solid var(--outline-variant)" : undefined }}>
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ background: isOpen ? "var(--surface-container-low)" : undefined }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : l)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronRight
                  className="size-3.5 flex-shrink-0 transition-transform"
                  style={{ color: "var(--on-surface-variant)", transform: isOpen ? "rotate(90deg)" : "none" }}
                />
                <span aria-hidden="true">{META[l].flag}</span>
                <span className="text-xs font-semibold" style={{ color: "var(--on-surface)" }}>
                  {META[l].name}
                </span>
                {!isOpen && title[l]?.trim() && (
                  <span className="min-w-0 flex-1 truncate text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                    {title[l]}
                  </span>
                )}
              </button>

              <span
                className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
                style={{
                  background: count === 3 ? "rgba(79,122,70,0.13)" : "rgba(193,120,42,0.14)",
                  color: count === 3 ? "#3E6136" : "#8A5418",
                }}
                title={`${count} of 3 fields written`}
              >
                {count}/3
              </span>

              {l !== "en" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => translateInto(l)}
                  disabled={translating !== null || !title.en?.trim()}
                  className="h-6 flex-shrink-0 gap-1 px-1.5 text-[10px]"
                  style={{ color: "var(--primary)" }}
                  title={title.en?.trim()
                    ? `Fill ${META[l].name} from the English`
                    : "Write the English first"}
                >
                  {translating === l ? <Loader2 className="size-3 animate-spin" /> : <Globe className="size-3" />}
                  Translate
                </Button>
              )}
            </div>

            {isOpen && (
              <div className="flex flex-col gap-3 px-3 pb-4 pl-9">
                <Field label="Title">
                  <Input
                    value={title[l] ?? ""}
                    onChange={(e) => onTitle({ ...title, [l]: e.target.value })}
                    lang={l}
                    className="h-9 text-sm"
                    style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                  />
                </Field>

                <Field label="Short description" hint="One or two sentences, for listing cards">
                  <RichTextEditor
                    value={shortDesc[l] ?? ""}
                    onChange={(html) => onShortDesc({ ...shortDesc, [l]: html })}
                    compact
                    minHeight={64}
                    lang={l}
                    placeholder="What the reader gets, in a sentence or two"
                  />
                </Field>

                <Field label="Full description" hint="The article body">
                  <RichTextEditor
                    value={description[l] ?? ""}
                    onChange={(html) => onDescription({ ...description, [l]: html })}
                    minHeight={320}
                    lang={l}
                    placeholder="Write the article here"
                  />
                </Field>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
          {label}
        </Label>
        {hint && (
          <span className="text-[10px]" style={{ color: "var(--on-surface-variant)", opacity: 0.65 }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
