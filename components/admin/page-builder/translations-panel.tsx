"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TranslationsPanelProps {
  translations: Record<string, string>
  onTranslationsChange: (translations: Record<string, string>) => void
}

export function TranslationsPanel({ translations, onTranslationsChange }: TranslationsPanelProps) {
  const [translating, setTranslating] = useState(false)

  const update = (code: string, value: string) => {
    onTranslationsChange({ ...translations, [code]: value })
  }

  async function handleTranslate() {
    const en = translations.en
    if (!en) return
    setTranslating(true)
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: en, languages: ["el", "de"] }),
      })
      if (res.ok) {
        const json = await res.json()
        onTranslationsChange({ ...translations, el: json.translations.el || "", de: json.translations.de || "" })
      }
    } catch (err) {
      console.error("[TranslationsPanel translate]", err)
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>
          Page Name
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 text-[10px] px-2"
          style={{ color: "var(--primary)" }}
          onClick={handleTranslate}
          disabled={translating || !translations.en}
        >
          {translating ? "Translating…" : "Translate via DeepSeek"}
        </Button>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EN</span>
          <Input
            value={translations.en || ""}
            onChange={(e) => update("en", e.target.value)}
            placeholder="About Us"
            className="h-7 text-xs"
            style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>EL</span>
          <Input
            value={translations.el || ""}
            onChange={(e) => update("el", e.target.value)}
            placeholder="Σχετικά με εμάς"
            className="h-7 text-xs"
            style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>DE</span>
          <Input
            value={translations.de || ""}
            onChange={(e) => update("de", e.target.value)}
            placeholder="Über uns"
            className="h-7 text-xs"
            style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
          />
        </div>
      </div>
    </div>
  )
}
