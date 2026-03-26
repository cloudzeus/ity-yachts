"use client"

import { Input } from "@/components/ui/input"

const REQUIRED_LANGUAGES = [
  { code: "el", name: "Greek (Ελληνικά)" },
  { code: "en", name: "English" },
  { code: "de", name: "German (Deutsch)" },
]

interface TranslationsPanelProps {
  translations: Record<string, string>
  onTranslationsChange: (translations: Record<string, string>) => void
}

export function TranslationsPanel({ translations, onTranslationsChange }: TranslationsPanelProps) {
  const updateTranslation = (code: string, value: string) => {
    onTranslationsChange({ ...translations, [code]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xs font-semibold mb-3" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>
          Translations
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--on-surface-variant)" }}>
          Page name translations for Greek, English, and German
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {REQUIRED_LANGUAGES.map((lang) => (
          <div key={lang.code} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>
              {lang.name}
            </label>
            <Input
              value={translations[lang.code] || ""}
              onChange={(e) => updateTranslation(lang.code, e.target.value)}
              placeholder={`Enter ${lang.name}...`}
              className="text-sm h-8"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
