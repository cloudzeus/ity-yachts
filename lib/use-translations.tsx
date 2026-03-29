"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

type Locale = "en" | "el" | "de"

interface TranslationContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, fallback?: string) => string
  ready: boolean
}

const TranslationContext = createContext<TranslationContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (_key, fallback) => fallback || "",
  ready: false,
})

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [dict, setDict] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("iyc-locale") as Locale | null
    if (saved && ["en", "el", "de"].includes(saved)) {
      setLocaleState(saved)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setReady(false)

    fetch(`/api/translations?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setDict(data)
          setReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })

    return () => { cancelled = true }
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("iyc-locale", l)
  }, [])

  // Only use saved locale after mount to avoid hydration mismatch
  const activeLocale = mounted ? locale : "en"

  const safeT = useCallback(
    (key: string, fallback?: string) => {
      if (!mounted) return fallback || key
      return dict[key] || fallback || key
    },
    [dict, mounted]
  )

  return (
    <TranslationContext.Provider value={{ locale: activeLocale, setLocale, t: safeT, ready: ready && mounted }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslations() {
  return useContext(TranslationContext)
}
