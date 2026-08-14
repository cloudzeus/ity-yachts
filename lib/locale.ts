/**
 * Where the language lives: in the URL.
 *
 * English is served unprefixed at `/fleet`, Greek at `/el/fleet`, German at
 * `/de/fleet`. Until now the language lived in localStorage, which meant all
 * three versions shared one address — so Google could only ever index one of
 * them, and two thirds of the translated site was invisible.
 *
 * No server-only imports here: the proxy, the server layout and the client
 * link wrapper all need these.
 */

export const LOCALES = ["en", "el", "de"] as const
export type Locale = (typeof LOCALES)[number]

/** English has no prefix, so its URLs stay exactly as they were. */
export const DEFAULT_LOCALE: Locale = "en"

export const LOCALE_LABELS: Record<Locale, string> = { en: "EN", el: "EL", de: "DE" }

/** The BCP 47 tags that go in hreflang and in <html lang>. */
export const HREFLANG: Record<Locale, string> = { en: "en", el: "el", de: "de" }

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}

/** Reads the locale out of a path, defaulting to English. */
export function localeFromPath(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0]
  return isLocale(first) ? first : DEFAULT_LOCALE
}

/** The path without its language prefix — always starting with a slash. */
export function stripLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  if (isLocale(segments[0])) segments.shift()
  return "/" + segments.join("/")
}

/**
 * The same path in a given language.
 *
 * Anything that is not an internal path — a full URL, a mailto, an anchor —
 * is returned untouched, so the link wrapper can pass everything through it.
 */
export function withLocale(pathname: string, locale: Locale): string {
  if (!pathname.startsWith("/")) return pathname
  const bare = stripLocale(pathname)
  if (locale === DEFAULT_LOCALE) return bare
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`
}
