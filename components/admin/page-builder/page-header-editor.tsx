"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronRight } from "lucide-react"

const LANGS = ["en", "el", "de"] as const
const LANG_LABELS: Record<string, string> = { en: "EN", el: "EL", de: "DE" }

type T = Record<string, string>

function TField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  multiline?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--on-surface-variant)" }}>
        {label}
      </span>
      <div className="flex gap-2">
        {LANGS.map((lang) => (
          <div key={lang} className="flex flex-col gap-0.5 flex-1">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>
              {LANG_LABELS[lang]}
            </span>
            {multiline ? (
              <Textarea
                value={value[lang] || ""}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className="text-xs min-h-[56px] resize-none"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            ) : (
              <Input
                value={value[lang] || ""}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className="h-7 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--outline-variant)" }}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-black/5 transition-colors"
        style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}
      >
        {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        {title}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-3 border-t" style={{ borderColor: "var(--outline-variant)" }}>
          {children}
        </div>
      )}
    </div>
  )
}

interface PageHeaderEditorProps {
  props: Record<string, unknown>
  onChange: (props: Record<string, unknown>) => void
}

/**
 * Generic page header / hero editor.
 * Used for fleet, locations, itineraries, news pages.
 * Manages: hero badge, title, subtitle — all trilingual (EN / EL / DE).
 */
export function PageHeaderEditor({ props, onChange }: PageHeaderEditorProps) {
  const [expanded, setExpanded] = useState<string | null>("hero")

  function toggle(s: string) {
    setExpanded((prev) => (prev === s ? null : s))
  }

  function update(key: string, value: unknown) {
    onChange({ ...props, [key]: value })
  }

  const hero = (props.hero || {}) as { badge?: T; title?: T; subtitle?: T }
  const empty: T = { en: "", el: "", de: "" }

  return (
    <div className="flex flex-col gap-2">
      <Section title="Hero / Page Header" expanded={expanded === "hero"} onToggle={() => toggle("hero")}>
        <TField
          label="Badge text (small label above title)"
          value={hero.badge || empty}
          onChange={(v) => update("hero", { ...hero, badge: v })}
        />
        <TField
          label="Page Title"
          value={hero.title || empty}
          onChange={(v) => update("hero", { ...hero, title: v })}
        />
        <TField
          label="Subtitle / Description"
          value={hero.subtitle || empty}
          onChange={(v) => update("hero", { ...hero, subtitle: v })}
          multiline
        />
      </Section>
    </div>
  )
}
