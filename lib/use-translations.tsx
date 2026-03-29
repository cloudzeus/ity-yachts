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

  useEffect(() => {
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

  const t = useCallback(
    (key: string, fallback?: string) => dict[key] || fallback || key,
    [dict]
  )

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t, ready }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslations() {
  return useContext(TranslationContext)
}
