"use client"

import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

/**
 * Renders the correct locale string from a { en, el, de } translations object.
 * Works inside server-rendered pages by reading the client-side locale.
 */
export function LocaleText({
  translations,
  tKey,
  fallback = "",
  html = false,
  plain = false,
  uppercase = false,
  className,
  style,
}: {
  translations?: Record<string, string> | null | undefined
  /** Look up a site translation key (same as t() in client components) */
  tKey?: string
  fallback?: string
  /** Render as dangerouslySetInnerHTML for rich text content */
  html?: boolean
  /**
   * Strip HTML tags. For fields written in the rich editor but shown in a
   * summary slot — a clamped card line wants text, not markup.
   */
  plain?: boolean
  /** Strip Greek accents for CSS uppercase contexts */
  uppercase?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const { locale, t } = useTranslations()
  const strip = (s: string) => {
    const stripped = plain ? s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : s
    return uppercase ? removeGreekTonos(stripped) : stripped
  }
  if (tKey) {
    const text = strip(t(tKey, fallback))
    if (html) {
      return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: text }} />
    }
    return <>{text}</>
  }
  if (!translations) return <>{strip(fallback)}</>
  const text = strip(translations[locale] || translations.en || fallback)
  if (html) {
    return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: text }} />
  }
  return <>{text}</>
}

/**
 * Hook-free helper for use inside existing client components
 * that already have access to `locale`.
 */
export function getLocaleText(
  translations: Record<string, string> | null | undefined,
  locale: string,
  fallback = ""
): string {
  if (!translations) return fallback
  return translations[locale] || translations.en || fallback
}

export { removeGreekTonos } from "@/lib/greek-utils"

/**
 * Uppercase text with proper Greek typography — removes accents (τόνος)
 * before converting to uppercase, so you get ΕΛΛΑΔΑ not ΈΛΛΑΔΑ.
 *
 * Usage: <GreekUppercase>Ελλάδα</GreekUppercase> → ΕΛΛΑΔΑ
 *        <GreekUppercase as="h1" className="text-3xl">...</GreekUppercase>
 */
export function GreekUppercase({
  children,
  as: Tag = "span",
  className,
  style,
}: {
  children: string
  as?: keyof React.JSX.IntrinsicElements
  className?: string
  style?: React.CSSProperties
}) {
  const upper = removeGreekTonos(children).toUpperCase()
  return <Tag className={className} style={style}>{upper}</Tag>
}
