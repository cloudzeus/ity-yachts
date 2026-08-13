"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import {
  ALLOW_ALL, CATEGORIES, CONSENT_COOKIE, Consent, DENY_ALL, makeConsent,
  readConsent, writeConsent, clearCategoryCookies, type Category,
} from "@/lib/consent"

interface ConsentValue {
  /** null until the visitor has chosen — nothing optional may run before then. */
  consent: Consent | null
  /** True once the browser has taken over from the server-rendered markup. */
  ready: boolean
  allows: (category: Category) => boolean
  acceptAll: () => void
  rejectAll: () => void
  save: (choice: Omit<Consent, "v" | "at">) => void
  /** Reopen the dialog — the "withdraw at any time" route. */
  openPreferences: () => void
  preferencesOpen: boolean
  closePreferences: () => void
}

const Ctx = createContext<ConsentValue>({
  consent: null,
  ready: false,
  allows: () => false,
  acceptAll: () => {},
  rejectAll: () => {},
  save: () => {},
  openPreferences: () => {},
  preferencesOpen: false,
  closePreferences: () => {},
})

/** Any control anywhere can reopen the dialog by firing this. */
export const OPEN_CONSENT = "iyc:open-consent"
const CONSENT_CHANGED = "iyc:consent-changed"

export function openConsentPreferences() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_CONSENT))
}

/* ── The cookie as an external store ────────────────────────────────────
   The consent cookie is state that lives outside React, so this is what
   useSyncExternalStore is for. It gives a server snapshot that is honestly
   "nothing chosen yet" and a client snapshot read from the document, without
   an effect that sets state on mount. */

const subscribe = (onChange: () => void) => {
  window.addEventListener(CONSENT_CHANGED, onChange)
  // Another tab may have answered the banner while this one sat open.
  window.addEventListener("focus", onChange)
  return () => {
    window.removeEventListener(CONSENT_CHANGED, onChange)
    window.removeEventListener("focus", onChange)
  }
}

/** The raw cookie value: a string, so repeated reads are reference-stable. */
const getSnapshot = () =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`)) ?? ""

const getServerSnapshot = () => ""

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  /* During hydration React uses the server snapshot, then re-renders with the
     real cookie. That is one frame in which a returning visitor's choice is
     not yet known — handled in the banner with a delayed reveal rather than
     with a mount flag here, so nothing flashes and no state is set on mount. */
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  const consent = useMemo(() => (raw ? readConsent() : null), [raw])

  const openPreferences = useCallback(() => setPreferencesOpen(true), [])
  const closePreferences = useCallback(() => setPreferencesOpen(false), [])

  useEffect(() => {
    window.addEventListener(OPEN_CONSENT, openPreferences)
    return () => window.removeEventListener(OPEN_CONSENT, openPreferences)
  }, [openPreferences])

  const commit = useCallback((choice: Omit<Consent, "v" | "at">) => {
    const next = makeConsent(choice)
    writeConsent(next)

    /* Anything switched off has its cookies cleared straight away. A banner
       that records "no" and leaves the cookie behind is worse than none. */
    for (const c of CATEGORIES) {
      if (c !== "necessary" && !next[c]) clearCategoryCookies(c)
    }

    setPreferencesOpen(false)
    window.dispatchEvent(new Event(CONSENT_CHANGED))
  }, [])

  const value = useMemo<ConsentValue>(() => ({
    consent,
    ready: true,
    allows: (category) => (category === "necessary" ? true : Boolean(consent?.[category])),
    acceptAll: () => commit(ALLOW_ALL),
    rejectAll: () => commit(DENY_ALL),
    save: commit,
    openPreferences,
    preferencesOpen,
    closePreferences,
  }), [consent, commit, openPreferences, preferencesOpen, closePreferences])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useConsent = () => useContext(Ctx)
