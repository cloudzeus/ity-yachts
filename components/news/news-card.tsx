"use client"

import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "@/lib/use-translations"
import { removeGreekTonos } from "@/lib/greek-utils"
import type { NewsCard as Card } from "@/lib/news"

/**
 * The short description is written in a rich editor now, so it arrives as
 * HTML. A card wants a clamped line of text, not markup — strip it rather
 * than rendering a paragraph inside a paragraph.
 */
function plain(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function NewsCard({ article, priority = false }: { article: Card; priority?: boolean }) {
  const { locale, t } = useTranslations()
  const r = (v: Record<string, string>) => v?.[locale] || v?.en || ""

  const title = r(article.title)
  const summary = plain(r(article.shortDesc))
  /* The meta line is set uppercase, and Greek capitals carry no accent —
     "7 ΑΥΓΟΎΣΤΟΥ" is a typographic error, not a style choice. */
  const when = article.publishedAt
    ? removeGreekTonos(
        new Date(article.publishedAt).toLocaleDateString(
          locale === "el" ? "el-GR" : locale === "de" ? "de-DE" : "en-GB",
          { day: "numeric", month: "long", year: "numeric" }
        )
      )
    : null

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl transition-transform"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(var(--lift-hover))"
        e.currentTarget.style.boxShadow = "var(--shadow-md)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "var(--shadow-sm)"
      }}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
        {article.media ? (
          // next/image cannot decode video, so a video hero needs a <video>.
          article.mediaType === "video" ? (
            <video
              src={article.media}
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <Image
              src={article.media}
              alt={title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )
        ) : null}

        {article.category && (
          <span
            className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: article.category.color ?? "var(--iyc-ionian-700)",
              color: "#ffffff",
            }}
          >
            {/* Greek capitals carry no accent, and the badge is set uppercase. */}
            {removeGreekTonos(r(article.category.name))}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
          {when && <time>{when}</time>}
          {article.readMinutes ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{article.readMinutes} {removeGreekTonos(t("news.minRead", "min read"))}</span>
            </>
          ) : null}
        </div>

        <h2
          className="mb-3 text-xl leading-snug"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-heading)" }}
        >
          {title}
        </h2>

        {summary && (
          <p className="mb-5 line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {summary}
          </p>
        )}

        <span
          className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "var(--text-link)", fontFamily: "var(--font-display)" }}
        >
          {t("news.read", "Read")}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}
