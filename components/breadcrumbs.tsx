"use client"

import Link from "next/link"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"

export interface Crumb {
  /** Already resolved to the reader's language by the caller. */
  label: string
  href?: string
}

/**
 * The trail from the homepage to here.
 *
 * BreadcrumbList markup has been on these pages for a while, but markup
 * describing a trail no reader can see is the same mistake as FAQ schema
 * without visible answers. This is the visible half.
 *
 * It sits below the hero rather than above it: these pages open full-bleed,
 * and a strip of chrome between the header and the image would break the one
 * thing the design is doing well.
 */
export function Breadcrumbs({
  items,
  tone = "light",
  /* Matches the column it sits above — an article rail is narrower than a
     full-width page, and a trail that starts left of the text reads as debris. */
  maxWidth = 1180,
  /* The gutter of the column below, so the trail starts on the same line as
     the text it belongs to rather than hanging off its left edge. */
  gutter = "px-6",
  /* Some pages already open their content section with generous top padding;
     stacking this on top of that leaves a hole rather than a breath. */
  spacing = "pt-12 pb-10 md:pt-16 md:pb-12",
}: {
  items: Crumb[]
  tone?: "light" | "dark"
  maxWidth?: number
  gutter?: string
  spacing?: string
}) {
  const { t } = useTranslations()
  const muted = tone === "dark" ? "rgba(255,255,255,0.62)" : "var(--text-subtle)"
  const strong = tone === "dark" ? "rgba(255,255,255,0.88)" : "var(--text-heading)"

  const trail: Crumb[] = [{ label: t("nav.home", "Home"), href: "/" }, ...items]

  return (
    <nav
      aria-label={t("nav.breadcrumb", "Breadcrumb")}
      className={`mx-auto w-full ${gutter} ${spacing}`}
      style={{ maxWidth }}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] font-medium uppercase tracking-[0.12em]">
        {trail.map((c, i) => {
          const last = i === trail.length - 1
          return (
            <li key={`${c.href ?? c.label}-${i}`} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" style={{ color: muted, opacity: 0.55 }}>
                  /
                </span>
              )}
              {last || !c.href ? (
                /* The current page is a location, not a destination — marked
                   as current rather than rendered as a link to itself. */
                <span
                  aria-current="page"
                  /* Page titles here run to sixty characters. The full text
                     stays in the accessibility tree and in the schema; the row
                     just stops eating the layout. */
                  title={c.label}
                  className="block max-w-[22ch] overflow-hidden text-ellipsis whitespace-nowrap sm:max-w-[36ch]"
                  style={{ color: strong }}
                >
                  {removeGreekTonos(c.label)}
                </span>
              ) : (
                <Link href={c.href} style={{ color: muted }} className="transition-opacity hover:opacity-70">
                  {removeGreekTonos(c.label)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
