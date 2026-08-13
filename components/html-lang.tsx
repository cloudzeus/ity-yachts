"use client"

import { useEffect } from "react"
import { useTranslations } from "@/lib/use-translations"

/**
 * Keeps `<html lang>` matching what the reader is actually reading.
 *
 * The document is served as `lang="en"` and the language is then switched in
 * the browser, so a reader on the Greek site was being served a page that
 * declared itself English. That misleads screen readers, browser translation
 * and search engines alike.
 *
 * This does not make the Greek and German pages indexable — that needs their
 * own URLs. It fixes the declaration for the reader in front of it.
 */
export function HtmlLang() {
  const { locale } = useTranslations()

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale
  }, [locale])

  return null
}
