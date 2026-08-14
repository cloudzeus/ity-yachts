"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { removeGreekTonos } from "@/lib/greek-utils"
import { DEFAULT_LOCALE, withLocale, type Locale } from "@/lib/locale"

export type { Locale }

interface TranslationContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, fallback?: string) => string
  /** t() for uppercase text — strips Greek accent marks (τόνος) */
  tUpper: (key: string, fallback?: string) => string
  ready: boolean
}

const TranslationContext = createContext<TranslationContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (_key, fallback) => fallback || "",
  tUpper: (_key, fallback) => fallback || "",
  ready: false,
})

/**
 * The language, decided on the server and carried in the URL.
 *
 * This used to start as English on every render, restore a saved locale from
 * localStorage after mount, then fetch the dictionary. Three consequences:
 * the server always rendered English, so that is what crawlers saw; the page
 * visibly flipped language after hydration; and all three languages shared one
 * address, so only one could ever be indexed.
 *
 * Now the layout resolves both from the request and passes them in, so the
 * first paint is already correct, `ready` is true immediately, and changing
 * language is a navigation to a different URL.
 */
export function TranslationProvider({
  children,
  locale,
  dictionary,
}: {
  children: ReactNode
  locale: Locale
  dictionary: Record<string, string>
}) {
  const pathname = usePathname()

  /* A full load, not router.push. The locale and the dictionary are resolved
     in the root layout, and Next keeps that layout mounted across a client
     navigation — so pushing /de/fleet changed the address bar and left the
     page in Greek. Changing language is rare and a reload is honest about
     what it is: a different document, in a different language.
     usePathname reports the rewritten path — `/fleet`, never `/el/fleet` —
     so the prefix is added from the target locale rather than swapped. */
  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return
      window.location.href = withLocale(pathname || "/", next)
    },
    [locale, pathname]
  )

  const t = useCallback(
    (key: string, fallback?: string) => dictionary[key] || fallback || key,
    [dictionary]
  )

  const tUpper = useCallback(
    (key: string, fallback?: string) => removeGreekTonos(t(key, fallback)),
    [t]
  )

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t, tUpper, ready: true }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslations() {
  return useContext(TranslationContext)
}
