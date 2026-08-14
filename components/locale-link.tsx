"use client"

import NextLink from "next/link"
import { forwardRef, type ComponentProps } from "react"
import { withLocale } from "@/lib/locale"
import { useTranslations } from "@/lib/use-translations"

type Props = ComponentProps<typeof NextLink>

/**
 * A Link that keeps the reader in the language they are reading.
 *
 * Every internal href in this codebase is written unprefixed — `/fleet`,
 * `/news/…` — which is right for English and wrong for everyone else: a Greek
 * reader clicking one would land back in English without being told why.
 * This adds the prefix at render time, so the hrefs stay readable in the
 * source and correct in the page.
 *
 * The locale comes from the translation context, which the server resolved
 * from the request. Not from usePathname: the proxy rewrites `/el/fleet` to
 * `/fleet`, so the path the router reports is the wrong place to look.
 *
 * Anything that is not an internal path — an absolute URL, a mailto, a bare
 * anchor — passes through untouched.
 */
export const LocaleLink = forwardRef<HTMLAnchorElement, Props>(function LocaleLink(
  { href, ...rest },
  ref
) {
  const { locale } = useTranslations()

  const localized =
    typeof href === "string" && href.startsWith("/") ? withLocale(href, locale) : href

  return <NextLink ref={ref} href={localized} {...rest} />
})

export default LocaleLink
