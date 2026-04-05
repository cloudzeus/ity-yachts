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

/* ─── Reusable translatable field ──────────────────────────── */
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

/* ─── Collapsible section wrapper ──────────────────────────── */
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

/* ─── Main Editor ──────────────────────────────────────────── */

interface SkipperAcademyEditorProps {
  props: Record<string, unknown>
  onChange: (props: Record<string, unknown>) => void
}

export function SkipperAcademyEditor({ props, onChange }: SkipperAcademyEditorProps) {
  const [expanded, setExpanded] = useState<string | null>("valueProposition")

  function toggle(section: string) {
    setExpanded((prev) => (prev === section ? null : section))
  }

  function update(key: string, value: unknown) {
    onChange({ ...props, [key]: value })
  }

  const vp = (props.valueProposition || {}) as { headline?: T; subtext?: T; body?: T }
  const features = (props.features || []) as Array<{ icon: string; title: T; description: T }>
  const tp = (props.trainingProgram || {}) as { headline?: T; body?: T; curriculum?: T[]; audience?: T[] }
  const testimonials = (props.testimonials || []) as Array<{ name: string; location: T; content: T; rating: number }>
  const stats = (props.stats || []) as Array<{ value: T; label: T }>
  const cta = (props.cta || {}) as { headline?: T; body?: T; primaryButton?: T; primaryLink?: string; secondaryButton?: T; secondaryLink?: string }
  const blessing = (props.blessing || {}) as { quote?: T; subtitle?: T }

  return (
    <div className="flex flex-col gap-2">
      {/* ── Value Proposition ────────────────────────── */}
      <Section title="Value Proposition" expanded={expanded === "valueProposition"} onToggle={() => toggle("valueProposition")}>
        <TField label="Headline" value={vp.headline || { en: "", el: "", de: "" }} onChange={(v) => update("valueProposition", { ...vp, headline: v })} />
        <TField label="Subtext" value={vp.subtext || { en: "", el: "", de: "" }} onChange={(v) => update("valueProposition", { ...vp, subtext: v })} />
        <TField label="Body" value={vp.body || { en: "", el: "", de: "" }} onChange={(v) => update("valueProposition", { ...vp, body: v })} multiline />
      </Section>

      {/* ── Features ─────────────────────────────────── */}
      <Section title={`Features (${features.length})`} expanded={expanded === "features"} onToggle={() => toggle("features")}>
        {features.map((feat, i) => (
          <div key={i} className="rounded p-2 flex flex-col gap-2" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: "var(--primary)" }}>Feature {i + 1}</span>
              <Button
                size="sm" variant="ghost"
                className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                onClick={() => update("features", features.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px]">Icon (Lucide name)</Label>
              <Input
                value={feat.icon}
                onChange={(e) => { const f = [...features]; f[i] = { ...f[i], icon: e.target.value }; update("features", f) }}
                className="h-7 text-xs"
                style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                placeholder="Compass, Shield, Sailboat..."
              />
            </div>
            <TField label="Title" value={feat.title} onChange={(v) => { const f = [...features]; f[i] = { ...f[i], title: v }; update("features", f) }} />
            <TField label="Description" value={feat.description} onChange={(v) => { const f = [...features]; f[i] = { ...f[i], description: v }; update("features", f) }} multiline />
          </div>
        ))}
        <Button
          size="sm" variant="outline"
          className="h-7 text-xs gap-1"
          style={{ borderStyle: "dashed", borderColor: "var(--outline-variant)" }}
          onClick={() => update("features", [...features, { icon: "Anchor", title: { en: "", el: "", de: "" }, description: { en: "", el: "", de: "" } }])}
        >
          <Plus className="size-3" /> Add Feature
        </Button>
      </Section>

      {/* ── Training Program ─────────────────────────── */}
      <Section title="Training Program" expanded={expanded === "trainingProgram"} onToggle={() => toggle("trainingProgram")}>
        <TField label="Headline" value={tp.headline || { en: "", el: "", de: "" }} onChange={(v) => update("trainingProgram", { ...tp, headline: v })} />
        <TField label="Body" value={tp.body || { en: "", el: "", de: "" }} onChange={(v) => update("trainingProgram", { ...tp, body: v })} multiline />

        <span className="text-[10px] uppercase tracking-wide font-semibold mt-2" style={{ color: "var(--primary)" }}>
          Curriculum Items ({(tp.curriculum || []).length})
        </span>
        {(tp.curriculum || []).map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              <TField label={`Item ${i + 1}`} value={item} onChange={(v) => { const c = [...(tp.curriculum || [])]; c[i] = v; update("trainingProgram", { ...tp, curriculum: c }) }} />
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 mt-5 text-red-500" onClick={() => { const c = (tp.curriculum || []).filter((_, j) => j !== i); update("trainingProgram", { ...tp, curriculum: c }) }}>
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
        <Button
          size="sm" variant="outline" className="h-7 text-xs gap-1"
          style={{ borderStyle: "dashed", borderColor: "var(--outline-variant)" }}
          onClick={() => update("trainingProgram", { ...tp, curriculum: [...(tp.curriculum || []), { en: "", el: "", de: "" }] })}
        >
          <Plus className="size-3" /> Add Curriculum Item
        </Button>

        <span className="text-[10px] uppercase tracking-wide font-semibold mt-2" style={{ color: "var(--primary)" }}>
          Who Should Attend ({(tp.audience || []).length})
        </span>
        {(tp.audience || []).map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              <TField label={`Audience ${i + 1}`} value={item} onChange={(v) => { const a = [...(tp.audience || [])]; a[i] = v; update("trainingProgram", { ...tp, audience: a }) }} />
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 mt-5 text-red-500" onClick={() => { const a = (tp.audience || []).filter((_, j) => j !== i); update("trainingProgram", { ...tp, audience: a }) }}>
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
        <Button
          size="sm" variant="outline" className="h-7 text-xs gap-1"
          style={{ borderStyle: "dashed", borderColor: "var(--outline-variant)" }}
          onClick={() => update("trainingProgram", { ...tp, audience: [...(tp.audience || []), { en: "", el: "", de: "" }] })}
        >
          <Plus className="size-3" /> Add Audience Item
        </Button>
      </Section>

      {/* ── Testimonials ─────────────────────────────── */}
      <Section title={`Testimonials (${testimonials.length})`} expanded={expanded === "testimonials"} onToggle={() => toggle("testimonials")}>
        {testimonials.map((t, i) => (
          <div key={i} className="rounded p-2 flex flex-col gap-2" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: "var(--primary)" }}>Testimonial {i + 1}</span>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500" onClick={() => update("testimonials", testimonials.filter((_, j) => j !== i))}>
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-0.5">
                <Label className="text-[10px]">Name</Label>
                <Input value={t.name} onChange={(e) => { const ts = [...testimonials]; ts[i] = { ...ts[i], name: e.target.value }; update("testimonials", ts) }} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
              <div className="w-16 flex flex-col gap-0.5">
                <Label className="text-[10px]">Rating</Label>
                <Input type="number" min={1} max={5} value={t.rating} onChange={(e) => { const ts = [...testimonials]; ts[i] = { ...ts[i], rating: parseInt(e.target.value) || 5 }; update("testimonials", ts) }} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} />
              </div>
            </div>
            <TField label="Location" value={t.location} onChange={(v) => { const ts = [...testimonials]; ts[i] = { ...ts[i], location: v }; update("testimonials", ts) }} />
            <TField label="Content" value={t.content} onChange={(v) => { const ts = [...testimonials]; ts[i] = { ...ts[i], content: v }; update("testimonials", ts) }} multiline />
          </div>
        ))}
        <Button
          size="sm" variant="outline" className="h-7 text-xs gap-1"
          style={{ borderStyle: "dashed", borderColor: "var(--outline-variant)" }}
          onClick={() => update("testimonials", [...testimonials, { name: "", location: { en: "", el: "", de: "" }, content: { en: "", el: "", de: "" }, rating: 5 }])}
        >
          <Plus className="size-3" /> Add Testimonial
        </Button>
      </Section>

      {/* ── Quick Facts / Stats ──────────────────────── */}
      <Section title={`Quick Facts (${stats.length})`} expanded={expanded === "stats"} onToggle={() => toggle("stats")}>
        {stats.map((s, i) => (
          <div key={i} className="rounded p-2 flex flex-col gap-2" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: "var(--primary)" }}>Stat {i + 1}</span>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500" onClick={() => update("stats", stats.filter((_, j) => j !== i))}>
                <Trash2 className="size-3" />
              </Button>
            </div>
            <TField label="Value" value={s.value} onChange={(v) => { const st = [...stats]; st[i] = { ...st[i], value: v }; update("stats", st) }} />
            <TField label="Label" value={s.label} onChange={(v) => { const st = [...stats]; st[i] = { ...st[i], label: v }; update("stats", st) }} />
          </div>
        ))}
        <Button
          size="sm" variant="outline" className="h-7 text-xs gap-1"
          style={{ borderStyle: "dashed", borderColor: "var(--outline-variant)" }}
          onClick={() => update("stats", [...stats, { value: { en: "", el: "", de: "" }, label: { en: "", el: "", de: "" } }])}
        >
          <Plus className="size-3" /> Add Stat
        </Button>
      </Section>

      {/* ── CTA Section ──────────────────────────────── */}
      <Section title="CTA Section" expanded={expanded === "cta"} onToggle={() => toggle("cta")}>
        <TField label="Headline" value={cta.headline || { en: "", el: "", de: "" }} onChange={(v) => update("cta", { ...cta, headline: v })} />
        <TField label="Body" value={cta.body || { en: "", el: "", de: "" }} onChange={(v) => update("cta", { ...cta, body: v })} multiline />
        <TField label="Primary Button Text" value={cta.primaryButton || { en: "", el: "", de: "" }} onChange={(v) => update("cta", { ...cta, primaryButton: v })} />
        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px]">Primary Button Link</Label>
          <Input value={cta.primaryLink || ""} onChange={(e) => update("cta", { ...cta, primaryLink: e.target.value })} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} placeholder="/contact" />
        </div>
        <TField label="Secondary Button Text" value={cta.secondaryButton || { en: "", el: "", de: "" }} onChange={(v) => update("cta", { ...cta, secondaryButton: v })} />
        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px]">Secondary Button Link</Label>
          <Input value={cta.secondaryLink || ""} onChange={(e) => update("cta", { ...cta, secondaryLink: e.target.value })} className="h-7 text-xs" style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }} placeholder="/contact" />
        </div>
      </Section>

      {/* ── Blessing ─────────────────────────────────── */}
      <Section title="Maritime Blessing" expanded={expanded === "blessing"} onToggle={() => toggle("blessing")}>
        <TField label="Quote" value={blessing.quote || { en: "", el: "", de: "" }} onChange={(v) => update("blessing", { ...blessing, quote: v })} />
        <TField label="Subtitle" value={blessing.subtitle || { en: "", el: "", de: "" }} onChange={(v) => update("blessing", { ...blessing, subtitle: v })} />
      </Section>
    </div>
  )
}
