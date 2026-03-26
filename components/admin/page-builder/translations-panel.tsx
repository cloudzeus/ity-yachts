"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

const COMMON_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
]

interface TranslationsPanelProps {
  translations: Record<string, string>
  onTranslationsChange: (translations: Record<string, string>) => void
}

export function TranslationsPanel({ translations, onTranslationsChange }: TranslationsPanelProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const languages = Object.keys(translations)

  const addLanguage = (code: string) => {
    if (!languages.includes(code)) {
      onTranslationsChange({ ...translations, [code]: "" })
    }
    setShowLanguageMenu(false)
  }

  const removeLanguage = (code: string) => {
    const updated = { ...translations }
    delete updated[code]
    onTranslationsChange(updated)
  }

  const updateTranslation = (code: string, value: string) => {
    onTranslationsChange({ ...translations, [code]: value })
  }

  const availableLanguages = COMMON_LANGUAGES.filter((lang) => !languages.includes(lang.code))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xs font-semibold mb-3" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>
          Translations
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--on-surface-variant)" }}>
          Add page name translations for different languages
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {languages.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--on-surface-variant)" }}>
            No translations yet
          </p>
        ) : (
          languages.map((code) => {
            const lang = COMMON_LANGUAGES.find((l) => l.code === code)
            return (
              <div key={code} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: "var(--on-surface)" }}>
                    {lang?.name || code} ({code})
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => removeLanguage(code)}
                  >
                    <Trash2 className="size-3" style={{ color: "var(--error)" }} />
                  </Button>
                </div>
                <Input
                  value={translations[code]}
                  onChange={(e) => updateTranslation(code, e.target.value)}
                  placeholder={`Enter ${lang?.name || "translation"}...`}
                  className="text-sm h-8"
                />
              </div>
            )
          })
        )}
      </div>

      {availableLanguages.length > 0 && (
        <div className="relative">
          <Button
            size="sm"
            className="w-full h-8 gap-2 text-xs text-white"
            style={{ background: "var(--gradient-ocean)" }}
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <Plus className="size-3" />
            Add Language
          </Button>

          {showLanguageMenu && (
            <div
              className="absolute top-full left-0 right-0 mt-2 rounded-lg border z-10 max-h-40 overflow-y-auto"
              style={{
                background: "var(--surface)",
                borderColor: "var(--outline-variant)",
              }}
            >
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                  style={{ color: "var(--on-surface)" }}
                  onClick={() => addLanguage(lang.code)}
                >
                  {lang.name} ({lang.code})
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
