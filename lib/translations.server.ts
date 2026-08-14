import "server-only"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/locale"

/**
 * The dictionary for one language, loaded on the server.
 *
 * It used to be fetched in the browser after mount, which meant the HTML that
 * search engines and answer engines read was always English — whatever the
 * reader had chosen. Loading it here puts the right language in the markup
 * itself, and saves the round trip.
 *
 * Only the active language is sent. Switching is a navigation now, so a second
 * dictionary would be weight nobody uses.
 */
export async function getLocale(): Promise<Locale> {
  const h = await headers()
  const value = h.get("x-iyc-locale")
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export async function getDictionary(locale: Locale): Promise<Record<string, string>> {
  const rows = await db.siteTranslation.findMany({ select: { key: true, en: true, el: true, de: true } })

  const dict: Record<string, string> = {}
  for (const row of rows) {
    // An untranslated key falls back to English rather than showing the key.
    dict[row.key] = (row[locale] || row.en || row.key).trim() || row.key
  }
  return dict
}
