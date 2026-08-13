"use client"

import Link from "next/link"
import { useTranslations } from "@/lib/use-translations"
import { NewsCard } from "@/components/news/news-card"
import type { NewsCard as Card } from "@/lib/news"

/**
 * The article list, with its category filter.
 *
 * The filter is links rather than state, so a filtered view has its own URL —
 * it can be shared, bookmarked and indexed, and the back button behaves.
 */
export function NewsListClient({
  articles,
  categories,
  activeCategory,
  activeTag,
}: {
  articles: Card[]
  categories: { slug: string; name: Record<string, string>; color: string | null; count: number }[]
  activeCategory: string | null
  activeTag: string | null
}) {
  const { t, locale } = useTranslations()
  const r = (v: Record<string, string>) => v?.[locale] || v?.en || ""

  const filtered = Boolean(activeCategory || activeTag)
  const activeTagName = activeTag
    ? articles.flatMap((a) => a.tags).find((x) => x.slug === activeTag)
    : null

  return (
    <>
      {/* A masthead rail rather than a row of pills: the sections of a
          magazine, set in the display face, each carrying its own colour and
          a superscript count. The active one is marked by a rule beneath it. */}
      {categories.length > 0 && (
        <nav
          className="-mx-6 mb-16 overflow-x-auto px-6 md:mb-20"
          style={{ borderBottom: "1px solid var(--border-hairline)", scrollbarWidth: "none" }}
          aria-label={t("news.filter.all", "Everything")}
        >
          <ul className="flex min-w-max items-end gap-7 pb-0 sm:gap-9">
            <Section
              href="/news"
              active={!activeCategory && !activeTag}
              label={t("news.filter.all", "Everything")}
            />
            {categories.map((c) => (
              <Section
                key={c.slug}
                href={`/news?category=${c.slug}`}
                active={activeCategory === c.slug}
                label={r(c.name)}
                color={c.color}
                count={c.count}
              />
            ))}
          </ul>
        </nav>
      )}

      {/* A tag arrives from an article rather than this bar, so say what is
          being filtered and offer the way back out. */}
      {activeTag && (
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <span>{t("news.filter.taggedWith", "Tagged")}</span>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "var(--iyc-ionian-50)", color: "var(--iyc-ionian-700)" }}
          >
            {activeTagName ? r(activeTagName.name) : activeTag}
          </span>
          <Link href="/news" className="underline underline-offset-2" style={{ color: "var(--text-link)" }}>
            {t("news.filter.clear", "Show everything")}
          </Link>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg" style={{ color: "var(--text-heading)", fontFamily: "var(--font-display)" }}>
            {filtered
              ? t("news.emptyFiltered", "Nothing here yet under that heading")
              : t("news.empty", "Nothing published yet")}
          </p>
          {filtered && (
            <Link
              href="/news"
              className="mt-4 inline-block text-sm underline underline-offset-2"
              style={{ color: "var(--text-link)" }}
            >
              {t("news.filter.clear", "Show everything")}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
          {articles.map((a, i) => (
            <NewsCard key={a.id} article={a} priority={i < 3} />
          ))}
        </div>
      )}
    </>
  )
}

function Section({
  href, active, label, color, count,
}: {
  href: string
  active: boolean
  label: string
  color?: string | null
  count?: number
}) {
  const accent = color ?? "var(--iyc-ionian-600)"
  return (
    <li className="relative">
      <Link
        href={href}
        scroll={false}
        aria-current={active ? "page" : undefined}
        className="group flex items-start gap-1 whitespace-nowrap pb-4 pt-1 transition-colors"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.0625rem",
          fontWeight: active ? 600 : 300,
          color: active ? "var(--text-heading)" : "var(--text-muted)",
        }}
      >
        {label}
        {count !== undefined && (
          <sup
            className="mt-0.5 text-[0.7rem] font-semibold tabular-nums transition-opacity"
            style={{ color: accent, opacity: active ? 1 : 0.72 }}
          >
            {count}
          </sup>
        )}
      </Link>

      {/* The rule sits on the nav's own hairline, so the active section reads
          as a tab cut out of it rather than a separate decoration. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-1px] left-0 right-0 origin-left transition-transform duration-300"
        style={{
          height: 2,
          background: accent,
          transform: active ? "scaleX(1)" : "scaleX(0)",
        }}
      />
    </li>
  )
}
