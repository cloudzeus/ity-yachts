"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, ExternalLink, ImagePlus, Loader2, Save, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

const LANGS = ["en", "el", "de"] as const
type Lang = (typeof LANGS)[number]

const LANG_META: Record<Lang, { flag: string; name: string }> = {
  en: { flag: "🇬🇧", name: "English" },
  el: { flag: "🇬🇷", name: "Ελληνικά" },
  de: { flag: "🇩🇪", name: "Deutsch" },
}

type Copy = Record<string, Record<string, string>>

/** The chapters, in the order they appear on the page. */
const CHAPTERS = [
  { n: 1, title: "1 · In Lefkada since 1979" },
  { n: 2, title: "2 · Greek hospitality, German thoroughness" },
  { n: 3, title: "3 · A family between two countries" },
  { n: 4, title: "4 · Not a faceless charter company (full-width band)" },
  { n: 5, title: "5 · We know the Ionian" },
  { n: 6, title: "6 · Experience shows in the details" },
  { n: 7, title: "7 · A tradition that keeps moving" },
] as const

/**
 * The "Our story" editor.
 *
 * One card per chapter, each holding its photograph and its words in all three
 * languages — the same accordion the article editor uses, for the same reason:
 * nobody writes three languages at once, so three columns just make each one
 * a third as wide.
 */
export function StoryEditor() {
  const [copy, setCopy] = useState<Copy>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [openKey, setOpenKey] = useState<string | null>("chapter-1")
  const [picking, setPicking] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/story")
      .then((r) => r.json())
      .then((d) => setCopy(d.copy ?? {}))
      .finally(() => setLoading(false))
  }, [])

  const get = useCallback((key: string, lang: string) => copy[key]?.[lang] ?? "", [copy])

  const set = useCallback((key: string, lang: string, value: string) => {
    setCopy((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), [lang]: value } }))
    setSaved(false)
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/story", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copy }),
      })
      if (res.ok) {
        setSaved(true)
        window.setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Our story</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The photographs and the words on the public story page. Every field is per language.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/about-us"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            View page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saved ? "Saved" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {/* ── The opening ─────────────────────────────────────────────── */}
        <Card
          id="hero"
          title="Opening"
          subtitle="Hero photograph, title and standfirst"
          open={openKey === "hero"}
          onToggle={() => setOpenKey(openKey === "hero" ? null : "hero")}
        >
          <PhotoField
            label="Hero photograph"
            url={copy["story.hero.image"]?.url ?? ""}
            onPick={() => setPicking("story.hero.image")}
            onClear={() => set("story.hero.image", "url", "")}
          />
          <PlainRow label="Eyebrow" k="story.eyebrow" get={get} set={set} />
          <PlainRow label="Title" k="story.title" get={get} set={set} />
          <PlainRow label="Subtitle" k="story.subtitle" get={get} set={set} />
          <LangBodies label="Standfirst" k="story.lead" get={get} set={set} />
        </Card>

        {/* ── Figures ─────────────────────────────────────────────────── */}
        <Card
          id="facts"
          title="The three figures"
          subtitle="1979 · 2 countries · 3 languages"
          open={openKey === "facts"}
          onToggle={() => setOpenKey(openKey === "facts" ? null : "facts")}
        >
          <p className="text-xs text-muted-foreground">
            The first figure is fixed at 1979. The other two take whatever you put in them.
          </p>
          <PlainRow label="Label under 1979" k="story.fact.1.label" get={get} set={set} />
          <PlainRow label="Second figure" k="story.fact.2.value" get={get} set={set} />
          <PlainRow label="Label under it" k="story.fact.2.label" get={get} set={set} />
          <PlainRow label="Third figure" k="story.fact.3.value" get={get} set={set} />
          <PlainRow label="Label under it" k="story.fact.3.label" get={get} set={set} />
        </Card>

        {/* ── Chapters ────────────────────────────────────────────────── */}
        {CHAPTERS.map((ch) => {
          const id = `chapter-${ch.n}`
          return (
            <Card
              key={id}
              id={id}
              title={ch.title}
              subtitle={copy[`story.${ch.n}.heading`]?.en ?? ""}
              open={openKey === id}
              onToggle={() => setOpenKey(openKey === id ? null : id)}
            >
              <PhotoField
                label="Photograph"
                url={copy[`story.${ch.n}.image`]?.url ?? ""}
                onPick={() => setPicking(`story.${ch.n}.image`)}
                onClear={() => set(`story.${ch.n}.image`, "url", "")}
              />
              <PlainRow label="Caption under the photograph" k={`story.${ch.n}.caption`} get={get} set={set} />
              <PlainRow label="Heading" k={`story.${ch.n}.heading`} get={get} set={set} />
              <LangBodies label="Text" k={`story.${ch.n}.body`} get={get} set={set} />
            </Card>
          )
        })}

        {/* ── Closing ─────────────────────────────────────────────────── */}
        <Card
          id="closing"
          title="Sailing with friends"
          subtitle="The closing band and its button"
          open={openKey === "closing"}
          onToggle={() => setOpenKey(openKey === "closing" ? null : "closing")}
        >
          <PhotoField
            label="Closing photograph"
            url={copy["story.closing.image"]?.url ?? ""}
            onPick={() => setPicking("story.closing.image")}
            onClear={() => set("story.closing.image", "url", "")}
          />
          <PlainRow label="Caption" k="story.closing.caption" get={get} set={set} />
          <PlainRow label="Heading" k="story.closing.heading" get={get} set={set} />
          <LangBodies label="Text" k="story.closing.body" get={get} set={set} />
          <PlainRow label="Welcome line" k="story.closing.welcome" get={get} set={set} />
          <PlainRow label="Button" k="story.closing.cta" get={get} set={set} />
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? "Saved" : "Save changes"}
        </Button>
      </div>

      <MediaPicker
        open={picking !== null}
        accept="image"
        onClose={() => setPicking(null)}
        onSelect={(media) => {
          const one = Array.isArray(media) ? media[0] : (media as PickedMedia)
          if (picking && one) set(picking, "url", one.url)
          setPicking(null)
        }}
      />
    </div>
  )
}

/* ── pieces ──────────────────────────────────────────────────────────── */

function Card({
  id, title, subtitle, open, onToggle, children,
}: {
  id: string
  title: string
  subtitle?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50"
      >
        <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
        </span>
      </button>
      {open && (
        <div id={`${id}-body`} className="space-y-6 border-t px-5 py-5">
          {children}
        </div>
      )}
    </section>
  )
}

function PhotoField({
  label, url, onPick, onClear,
}: {
  label: string
  url: string
  onPick: () => void
  onClear: () => void
}) {
  return (
    <div>
      <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex items-start gap-4">
        <div className="relative h-28 w-44 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
          {url ? (
            <Image src={url} alt="" fill sizes="176px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-muted-foreground">No photo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onPick}>
            <ImagePlus className="mr-2 h-4 w-4" />
            {url ? "Change photo" : "Choose photo"}
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/** One short input per language, on one row. */
function PlainRow({
  label, k, get, set,
}: {
  label: string
  k: string
  get: (key: string, lang: string) => string
  set: (key: string, lang: string, value: string) => void
}) {
  return (
    <div>
      <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {LANGS.map((l) => (
          <div key={l}>
            <span className="mb-1 block text-[11px] text-muted-foreground">
              {LANG_META[l].flag} {LANG_META[l].name}
            </span>
            <Input value={get(k, l)} onChange={(e) => set(k, l, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Long copy, one language at a time.
 *
 * A rich text editor needs the full width, so the three languages are tabs
 * rather than columns — and each tab says whether it has anything in it.
 */
function LangBodies({
  label, k, get, set,
}: {
  label: string
  k: string
  get: (key: string, lang: string) => string
  set: (key: string, lang: string, value: string) => void
}) {
  const [lang, setLang] = useState<Lang>("en")
  const [translating, setTranslating] = useState<Lang | null>(null)

  const translateInto = async (target: Lang) => {
    const source = get(k, "en")
    if (!source.trim() || target === "en") return
    setTranslating(target)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, languages: [target] }),
      })
      const data = await res.json()
      const out = data.translations?.[target]
      if (out) set(k, target, out)
    } finally {
      setTranslating(null)
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
        {lang !== "en" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Fill this language from the English"
            onClick={() => translateInto(lang)}
            disabled={translating !== null || !get(k, "en").trim()}
          >
            {translating === lang ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-3.5 w-3.5" />
            )}
            Translate from English
          </Button>
        )}
      </div>

      <div className="mb-3 flex gap-1">
        {LANGS.map((l) => {
          const has = get(k, l).replace(/<[^>]*>/g, "").trim().length > 0
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                lang === l ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
              }`}
            >
              {LANG_META[l].flag} {LANG_META[l].name}
              <span className={`ml-1.5 ${has ? "opacity-60" : "opacity-100 text-amber-500"}`}>
                {has ? "✓" : "•"}
              </span>
            </button>
          )
        })}
      </div>

      <RichTextEditor value={get(k, lang)} onChange={(v) => set(k, lang, v)} />
    </div>
  )
}
