"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"

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

function SField({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  textarea?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label className="text-[10px]">{label}</Label>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs min-h-[56px] resize-none"
          style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          placeholder={placeholder}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs"
          style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

/* ─── Types ────────────────────────────────────────────────── */

interface Office {
  id: string
  label: string
  flag: string
  person: string
  address: string
  country: string
  phone: string
  mobile: string
  email: string
  hours: string
  mapUrl: string
}

interface Stat {
  num: string
  label: T
}

interface ContactContentEditorProps {
  props: Record<string, unknown>
  onChange: (props: Record<string, unknown>) => void
}

/* ─── Main Editor ──────────────────────────────────────────── */

export function ContactContentEditor({ props, onChange }: ContactContentEditorProps) {
  const [expanded, setExpanded] = useState<string | null>("hero")

  function toggle(s: string) {
    setExpanded((prev) => (prev === s ? null : s))
  }

  function update(key: string, value: unknown) {
    onChange({ ...props, [key]: value })
  }

  const hero = (props.hero || {}) as {
    badge?: T; title?: T; titleAccent?: T; subtitle?: T
  }
  const stats = (props.stats || []) as Stat[]
  const offices = (props.offices || []) as Office[]
  const familyBadge = (props.familyBadge || {}) as { title?: T; description?: T }
  const cta = (props.cta || {}) as {
    title?: T; description?: T
    primaryBtn?: T; primaryLink?: string
    secondaryBtn?: T; secondaryLink?: string
  }

  const empty: T = { en: "", el: "", de: "" }

  return (
    <div className="flex flex-col gap-2">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Section title="Hero Section" expanded={expanded === "hero"} onToggle={() => toggle("hero")}>
        <TField label="Badge" value={hero.badge || empty} onChange={(v) => update("hero", { ...hero, badge: v })} />
        <TField label="Title" value={hero.title || empty} onChange={(v) => update("hero", { ...hero, title: v })} />
        <TField label="Title Accent (gradient line)" value={hero.titleAccent || empty} onChange={(v) => update("hero", { ...hero, titleAccent: v })} />
        <TField label="Subtitle" value={hero.subtitle || empty} onChange={(v) => update("hero", { ...hero, subtitle: v })} multiline />
      </Section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <Section title={`Hero Stats (${stats.length})`} expanded={expanded === "stats"} onToggle={() => toggle("stats")}>
        {stats.map((s, i) => (
          <div key={i} className="rounded p-2 flex flex-col gap-2" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: "var(--primary)" }}>Stat {i + 1}</span>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500"
                onClick={() => update("stats", stats.filter((_, j) => j !== i))}>
                <Trash2 className="size-3" />
              </Button>
            </div>
            <SField label="Number / Value (e.g. 45+)" value={s.num}
              onChange={(v) => { const st = [...stats]; st[i] = { ...st[i], num: v }; update("stats", st) }}
              placeholder="45+" />
            <TField label="Label" value={s.label || empty}
              onChange={(v) => { const st = [...stats]; st[i] = { ...st[i], label: v }; update("stats", st) }} />
          </div>
        ))}
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          style={{ borderStyle: "dashed", borderColor: "var(--outline-variant)" }}
          onClick={() => update("stats", [...stats, { num: "", label: { en: "", el: "", de: "" } }])}>
          <Plus className="size-3" /> Add Stat
        </Button>
      </Section>

      {/* ── Offices ──────────────────────────────────────────── */}
      <Section title={`Offices (${offices.length})`} expanded={expanded === "offices"} onToggle={() => toggle("offices")}>
        {offices.map((o, i) => (
          <div key={i} className="rounded p-2 flex flex-col gap-2" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: "var(--primary)" }}>{o.label || `Office ${i + 1}`}</span>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500"
                onClick={() => update("offices", offices.filter((_, j) => j !== i))}>
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SField label="Label (e.g. Munich Office)" value={o.label}
                onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], label: v }; update("offices", ofs) }} />
              <SField label="Flag emoji" value={o.flag}
                onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], flag: v }; update("offices", ofs) }}
                placeholder="🇩🇪" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SField label="Contact person" value={o.person}
                onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], person: v }; update("offices", ofs) }} />
              <SField label="Country" value={o.country}
                onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], country: v }; update("offices", ofs) }} />
            </div>
            <SField label="Address" value={o.address}
              onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], address: v }; update("offices", ofs) }}
              placeholder="Mozartstr. 8, D-80336 München" />
            <div className="grid grid-cols-2 gap-2">
              <SField label="Phone" value={o.phone}
                onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], phone: v }; update("offices", ofs) }}
                placeholder="+49 160 99279870" />
              <SField label="Mobile (optional)" value={o.mobile}
                onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], mobile: v }; update("offices", ofs) }} />
            </div>
            <SField label="Email" value={o.email}
              onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], email: v }; update("offices", ofs) }}
              placeholder="info@iyc.de" />
            <SField label="Office Hours" value={o.hours}
              onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], hours: v }; update("offices", ofs) }}
              placeholder="Mon – Fri: 09:00 – 18:00 CET" />
            <SField label="Google Maps Embed URL" value={o.mapUrl}
              onChange={(v) => { const ofs = [...offices]; ofs[i] = { ...ofs[i], mapUrl: v }; update("offices", ofs) }}
              placeholder="https://www.google.com/maps/embed?pb=..." />
          </div>
        ))}
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          style={{ borderStyle: "dashed", borderColor: "var(--outline-variant)" }}
          onClick={() => update("offices", [...offices, {
            id: `office-${Date.now()}`, label: "", flag: "", person: "",
            address: "", country: "", phone: "", mobile: "", email: "", hours: "", mapUrl: ""
          }])}>
          <Plus className="size-3" /> Add Office
        </Button>
      </Section>

      {/* ── Family Badge ─────────────────────────────────────── */}
      <Section title="Family Badge" expanded={expanded === "familyBadge"} onToggle={() => toggle("familyBadge")}>
        <TField label="Title" value={familyBadge.title || empty}
          onChange={(v) => update("familyBadge", { ...familyBadge, title: v })} />
        <TField label="Description" value={familyBadge.description || empty}
          onChange={(v) => update("familyBadge", { ...familyBadge, description: v })} multiline />
      </Section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <Section title="CTA Banner" expanded={expanded === "cta"} onToggle={() => toggle("cta")}>
        <TField label="Title" value={cta.title || empty} onChange={(v) => update("cta", { ...cta, title: v })} />
        <TField label="Description" value={cta.description || empty} onChange={(v) => update("cta", { ...cta, description: v })} multiline />
        <TField label="Primary Button" value={cta.primaryBtn || empty} onChange={(v) => update("cta", { ...cta, primaryBtn: v })} />
        <SField label="Primary Button Link" value={cta.primaryLink || ""} onChange={(v) => update("cta", { ...cta, primaryLink: v })} placeholder="/fleet" />
        <TField label="Secondary Button" value={cta.secondaryBtn || empty} onChange={(v) => update("cta", { ...cta, secondaryBtn: v })} />
        <SField label="Secondary Button Link" value={cta.secondaryLink || ""} onChange={(v) => update("cta", { ...cta, secondaryLink: v })} placeholder="/locations" />
      </Section>

    </div>
  )
}
