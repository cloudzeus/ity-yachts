"use client"

import { useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MediaPicker, PickedMedia } from "@/components/admin/media-picker"
import { ImageIcon, Play, X, Upload } from "lucide-react"

export interface HeroSectionData {
  mediaUrl: string
  mediaType: "image" | "video"
  overSubheading: Record<string, string> // { en, el, de }
  heading: Record<string, string>    // { en, el, de }
  subheading: Record<string, string> // { en, el, de }
  buttonText: Record<string, string> // { en, el, de }
  buttonLink: string
}

const EMPTY_HERO: HeroSectionData = {
  mediaUrl: "",
  mediaType: "image",
  overSubheading: { en: "", el: "", de: "" },
  heading: { en: "", el: "", de: "" },
  subheading: { en: "", el: "", de: "" },
  buttonText: { en: "", el: "", de: "" },
  buttonLink: "",
}

const LANGS = ["en", "el", "de"] as const
const LANG_LABELS: Record<string, string> = { en: "EN", el: "EL", de: "DE" }

interface HeroSectionPanelProps {
  data: HeroSectionData | null
  onChange: (data: HeroSectionData) => void
}

export function HeroSectionPanel({ data, onChange }: HeroSectionPanelProps) {
  const hero = data ?? EMPTY_HERO
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [translatingField, setTranslatingField] = useState<string | null>(null)

  function update(patch: Partial<HeroSectionData>) {
    onChange({ ...hero, ...patch })
  }

  function updateTranslatable(
    field: "overSubheading" | "heading" | "subheading" | "buttonText",
    lang: string,
    value: string
  ) {
    onChange({ ...hero, [field]: { ...hero[field], [lang]: value } })
  }

  async function translateField(field: "overSubheading" | "heading" | "subheading" | "buttonText") {
    const en = hero[field].en
    if (!en) return
    setTranslatingField(field)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: en, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        onChange({
          ...hero,
          [field]: {
            ...hero[field],
            el: json.translations.el || hero[field].el,
            de: json.translations.de || hero[field].de,
          },
        })
      }
    } catch (err) {
      console.error("[HeroSectionPanel translate]", err)
    } finally {
      setTranslatingField(null)
    }
  }

  async function translateAll() {
    setTranslatingField("all")
    try {
      const fields = ["overSubheading", "heading", "subheading", "buttonText"] as const
      const texts = fields.map((f) => hero[f].en).filter(Boolean)
      if (texts.length === 0) return

      // Translate all fields at once by batching
      const results = await Promise.all(
        fields
          .filter((f) => hero[f].en)
          .map(async (f) => {
            const res = await fetch("/api/admin/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: hero[f].en, languages: ["el", "de"] }),
            })
            if (res.ok) {
              const json = await res.json()
              return { field: f, translations: json.translations }
            }
            return null
          })
      )

      const updated = { ...hero }
      for (const r of results) {
        if (r) {
          updated[r.field] = {
            ...updated[r.field],
            el: r.translations.el || updated[r.field].el,
            de: r.translations.de || updated[r.field].de,
          }
        }
      }
      onChange(updated)
    } catch (err) {
      console.error("[HeroSectionPanel translateAll]", err)
    } finally {
      setTranslatingField(null)
    }
  }

  function handleMediaSelect(media: PickedMedia | PickedMedia[]) {
    const m = Array.isArray(media) ? media[0] : media
    if (!m) return
    const isVideo = m.mimeType.startsWith("video/")
    update({ mediaUrl: m.url, mediaType: isVideo ? "video" : "image" })
    setMediaPickerOpen(false)
  }

  function removeMedia() {
    update({ mediaUrl: "", mediaType: "image" })
  }

  const enabled = !!data

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-wide font-semibold"
          style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}
        >
          Hero Section
        </span>
        <div className="flex items-center gap-2">
          {enabled && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 text-[10px] px-2"
              style={{ color: "var(--primary)" }}
              onClick={translateAll}
              disabled={translatingField !== null}
            >
              {translatingField === "all" ? "Translating\u2026" : "Translate All via DeepSeek"}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-5 text-[10px] px-2"
            style={{ color: enabled ? "var(--error)" : "var(--secondary)" }}
            onClick={() => {
              if (enabled) {
                onChange(null as unknown as HeroSectionData)
              } else {
                onChange(EMPTY_HERO)
              }
            }}
          >
            {enabled ? "Remove" : "+ Enable"}
          </Button>
        </div>
      </div>

      {!enabled && (
        <div
          className="rounded-md p-4 text-center text-xs"
          style={{
            border: "2px dashed var(--outline-variant)",
            color: "var(--on-surface-variant)",
          }}
        >
          No hero section configured. Click &ldquo;+ Enable&rdquo; to add one.
        </div>
      )}

      {enabled && (
        <div className="flex flex-col gap-4">
          {/* Background media */}
          <div className="flex flex-col gap-1.5">
            <span
              className="text-[10px] uppercase tracking-wide font-medium"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Background Image / Video
            </span>
            {hero.mediaUrl ? (
              <div className="relative rounded-md overflow-hidden" style={{ border: "1px solid var(--outline-variant)" }}>
                {hero.mediaType === "video" ? (
                  <div className="flex items-center justify-center h-28 bg-black/80">
                    <Play className="size-8 text-white/60" />
                    <span className="text-xs text-white/60 ml-2 truncate max-w-[200px]">
                      {hero.mediaUrl.split("/").pop()}
                    </span>
                  </div>
                ) : (
                  <div className="relative h-28">
                    <Image
                      src={hero.mediaUrl}
                      alt="Hero background"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    onClick={() => setMediaPickerOpen(true)}
                    className="flex items-center justify-center h-6 w-6 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <Upload className="size-3" />
                  </button>
                  <button
                    onClick={removeMedia}
                    className="flex items-center justify-center h-6 w-6 rounded bg-black/60 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setMediaPickerOpen(true)}
                className="flex flex-col items-center justify-center gap-2 h-28 rounded-md transition-colors hover:bg-[var(--surface-container-high)]"
                style={{
                  border: "2px dashed var(--outline-variant)",
                  color: "var(--on-surface-variant)",
                }}
              >
                <ImageIcon className="size-5" />
                <span className="text-[10px] uppercase tracking-wide font-medium">
                  Choose Media
                </span>
              </button>
            )}
          </div>

          {/* Over Subheading */}
          <TranslatableField
            label="Over Subheading"
            field="overSubheading"
            values={hero.overSubheading}
            onChange={updateTranslatable}
            onTranslate={translateField}
            translating={translatingField === "overSubheading"}
          />

          {/* Heading */}
          <TranslatableField
            label="Heading"
            field="heading"
            values={hero.heading}
            onChange={updateTranslatable}
            onTranslate={translateField}
            translating={translatingField === "heading"}
          />

          {/* Subheading */}
          <TranslatableField
            label="Subheading"
            field="subheading"
            values={hero.subheading}
            onChange={updateTranslatable}
            onTranslate={translateField}
            translating={translatingField === "subheading"}
            multiline
          />

          {/* Button text */}
          <TranslatableField
            label="Button Text"
            field="buttonText"
            values={hero.buttonText}
            onChange={updateTranslatable}
            onTranslate={translateField}
            translating={translatingField === "buttonText"}
          />

          {/* Button link */}
          <div className="flex flex-col gap-1">
            <span
              className="text-[10px] uppercase tracking-wide font-medium"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Button Link
            </span>
            <Input
              value={hero.buttonLink}
              onChange={(e) => update({ buttonLink: e.target.value })}
              placeholder="/contact or https://..."
              className="h-7 text-xs"
              style={{
                background: "var(--surface-container-lowest)",
                borderColor: "var(--outline-variant)",
              }}
            />
          </div>
        </div>
      )}

      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        accept="all"
      />
    </div>
  )
}

/* ─── Translatable Field Sub-component ─────────────────────────────────── */

function TranslatableField({
  label,
  field,
  values,
  onChange,
  onTranslate,
  translating,
  multiline,
}: {
  label: string
  field: "overSubheading" | "heading" | "subheading" | "buttonText"
  values: Record<string, string>
  onChange: (field: "overSubheading" | "heading" | "subheading" | "buttonText", lang: string, value: string) => void
  onTranslate: (field: "overSubheading" | "heading" | "subheading" | "buttonText") => void
  translating: boolean
  multiline?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-wide font-medium"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {label}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 text-[10px] px-2"
          style={{ color: "var(--primary)" }}
          onClick={() => onTranslate(field)}
          disabled={translating || !values.en}
        >
          {translating ? "Translating\u2026" : "DeepSeek"}
        </Button>
      </div>
      <div className="flex gap-2">
        {LANGS.map((lang) => (
          <div key={lang} className="flex flex-col gap-0.5 flex-1">
            <span
              className="text-[10px] uppercase tracking-wide"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {LANG_LABELS[lang]}
            </span>
            {multiline ? (
              <Textarea
                value={values[lang] || ""}
                onChange={(e) => onChange(field, lang, e.target.value)}
                placeholder={lang === "en" ? `${label} (English)` : ""}
                className="text-xs min-h-[56px] resize-none"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              />
            ) : (
              <Input
                value={values[lang] || ""}
                onChange={(e) => onChange(field, lang, e.target.value)}
                placeholder={lang === "en" ? `${label} (English)` : ""}
                className="h-7 text-xs"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
