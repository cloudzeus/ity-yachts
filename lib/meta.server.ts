import "server-only"
import { getDictionary, getLocale } from "@/lib/translations.server"
import type { Locale } from "@/lib/locale"

/**
 * The strings a page's metadata is built from, in the page's own language.
 *
 * Titles and descriptions were written in English and read in English on every
 * version of the site, so /de/fleet went out announcing itself as "Charter
 * Fleet Lefkada". The page was indexable but could not compete for a German
 * query, which made the language routing half a fix.
 *
 * `m()` reads a translated interface string; `localized()` reads a translated
 * field off a database record. Both fall back to English rather than showing
 * a key or an empty tag.
 */
export async function metaStrings(): Promise<{
  locale: Locale
  m: (key: string, fallback: string) => string
}> {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return { locale, m: (key, fallback) => dict[key]?.trim() || fallback }
}

/** A `{ en, el, de }` field, read for this page's language. */
export function localized(value: unknown, locale: Locale, fallback = ""): string {
  const o = (value ?? {}) as Record<string, string>
  return (o[locale] || o.en || o.el || o.de || fallback).trim()
}
