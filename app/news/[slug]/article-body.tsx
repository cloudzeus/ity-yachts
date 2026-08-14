"use client"

import Image from "next/image"
import Link from "@/components/locale-link"
import { useTranslations } from "@/lib/use-translations"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { removeGreekTonos } from "@/lib/greek-utils"

interface Article {
  slug: string
  title: Record<string, string>
  shortDesc: Record<string, string>
  description: Record<string, string>
  media: string | null
  mediaType: string | null
  gallery: string[]
  publishedAt: string | null
  readMinutes: number | null
  author: string
  category: { slug: string; name: Record<string, string>; color: string | null } | null
  tags: { slug: string; name: Record<string, string> }[]
}

/**
 * The article itself.
 *
 * A client component because the language can change without a reload, and an
 * article that stays in the language the page happened to load in is the bug
 * this site has had before.
 */
export function ArticleBody({ article }: { article: Article }) {
  const { t, locale } = useTranslations()
  const r = (v: Record<string, string>) => v?.[locale] || v?.en || ""

  const title = r(article.title)
  const body = r(article.description)
  const lead = r(article.shortDesc)

  /* The byline is set uppercase, and Greek capitals carry no accent. */
  const when = article.publishedAt
    ? removeGreekTonos(
        new Date(article.publishedAt).toLocaleDateString(
          locale === "el" ? "el-GR" : locale === "de" ? "de-DE" : "en-GB",
          { day: "numeric", month: "long", year: "numeric" }
        )
      )
    : null

  return (
    <>
      {/* Hero. The gradient closes on the page colour so the photograph settles
          into the page rather than ending on a hard edge. */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 460 }}>
        {article.media && (
          article.mediaType === "video" ? (
            <video src={article.media} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Image src={article.media} alt="" fill priority className="object-cover" sizes="100vw" />
          )
        )}
        <div
          className="absolute inset-0"
          style={{
            background: article.media
              ? "linear-gradient(to bottom, rgba(4,13,25,.55) 0%, rgba(4,13,25,.30) 40%, rgba(4,13,25,.62) 75%, var(--surface-page) 100%)"
              : "linear-gradient(158deg, var(--iyc-ionian-700), var(--iyc-ionian-900))",
          }}
        />

        <div className="relative mx-auto flex max-w-[820px] flex-col items-center px-6 pb-24 pt-32 text-center md:pt-36">
          {article.category && (
            <Link
              href={`/news?category=${article.category.slug}`}
              className="mb-5 inline-block rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ background: article.category.color ?? "var(--iyc-ionian-600)", color: "#ffffff" }}
            >
              {/* Greek capitals carry no accent, and the chip is set uppercase. */}
              {removeGreekTonos(r(article.category.name))}
            </Link>
          )}

          <h1
            className="text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.12] text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em", textWrap: "balance" }}
          >
            {title}
          </h1>

          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {article.author && <span>{article.author}</span>}
            {article.author && when && <span aria-hidden="true">·</span>}
            {when && <time>{when}</time>}
            {article.readMinutes ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{article.readMinutes} {removeGreekTonos(t("news.minRead", "min read"))}</span>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <Breadcrumbs maxWidth={760} items={[{ label: t("nav.news", "News"), href: "/news" }, { label: title }]} />

      <article className="relative mx-auto w-full max-w-[760px] px-6 pb-20">
        {lead && (
          <div
            className="iyc-prose iyc-prose--plain mb-10 text-[1.15rem] leading-relaxed"
            style={{ color: "var(--text-body)" }}
            dangerouslySetInnerHTML={{ __html: lead }}
          />
        )}

        {/* The body is authored in the admin's rich editor, which emits only
            h2/h3, p, lists, blockquote, links and images. */}
        <div
          className="iyc-prose"
          style={{ color: "var(--text-body)" }}
          dangerouslySetInnerHTML={{ __html: body }}
        />

        {article.tags.length > 0 && (
          <div
            className="mt-12 flex flex-wrap items-center gap-2 pt-8"
            style={{ borderTop: "1px solid var(--border-hairline)" }}
          >
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
              {t("news.tags", "Tagged")}
            </span>
            {article.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/news?tag=${tag.slug}`}
                className="rounded-full px-3 py-1 text-xs font-medium transition"
                style={{
                  background: "var(--iyc-ionian-50)",
                  color: "var(--iyc-ionian-700)",
                  border: "1px solid var(--iyc-ionian-100)",
                }}
              >
                {r(tag.name)}
              </Link>
            ))}
          </div>
        )}

        {article.gallery.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {article.gallery.map((url) =>
              /\.(mp4|webm|mov)$/i.test(url) ? (
                <video
                  key={url}
                  src={url}
                  controls
                  playsInline
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
              ) : (
                <div key={url} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                  <Image src={url} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                </div>
              )
            )}
          </div>
        )}

        <div className="mt-12">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--text-link)", fontFamily: "var(--font-display)" }}
          >
            <span aria-hidden="true">←</span>
            {t("news.backToAll", "All articles")}
          </Link>
        </div>
      </article>
    </>
  )
}
