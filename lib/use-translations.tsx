"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { removeGreekTonos } from "@/lib/greek-utils"

type Locale = "en" | "el" | "de"

type AllDicts = Record<Locale, Record<string, string>>

interface TranslationContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, fallback?: string) => string
  /** t() for uppercase text — strips Greek accent marks (τόνος) */
  tUpper: (key: string, fallback?: string) => string
  ready: boolean
}

const TranslationContext = createContext<TranslationContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (_key, fallback) => fallback || "",
  tUpper: (_key, fallback) => fallback || "",
  ready: false,
})

const EMPTY_DICTS: AllDicts = { en: {}, el: {}, de: {} }

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [dicts, setDicts] = useState<AllDicts>(EMPTY_DICTS)
  const [ready, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dictsRef = useRef<AllDicts>(EMPTY_DICTS)
  const localeRef = useRef<Locale>("en")

  // Keep refs in sync for stable callback
  dictsRef.current = dicts
  localeRef.current = mounted ? locale : "en"

  // On mount: restore saved locale + fetch all translations once
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("iyc-locale") as Locale | null
    if (saved && ["en", "el", "de"].includes(saved)) {
      setLocaleState(saved)
    }

    fetch("/api/translations")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.en) {
          setDicts(data)
          dictsRef.current = data
        }
        setReady(true)
      })
      .catch(() => {
        setReady(true)
      })
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("iyc-locale", l)
  }, [])

  const activeLocale = mounted ? locale : "en"

  // t() uses the current locale and dicts — no stale closures
  const t = useCallback(
    (key: string, fallback?: string) => {
      if (!mounted) return fallback || key
      const dict = dicts[activeLocale] || dicts.en || {}
      return dict[key] || fallback || key
    },
    [dicts, activeLocale, mounted]
  )

  // tUpper() — same as t() but strips Greek accent marks for uppercase text
  const tUpper = useCallback(
    (key: string, fallback?: string) => removeGreekTonos(t(key, fallback)),
    [t]
  )

  return (
    <TranslationContext.Provider
      value={{
        locale: activeLocale,
        setLocale,
        t,
        tUpper,
        ready: ready && mounted,
      }}
    >
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslations() {
  return useContext(TranslationContext)
}
