"use client"

import { useTranslations } from "@/lib/use-translations"
import { NewsCard } from "@/components/news/news-card"
import type { NewsCard as Card } from "@/lib/news"

/** The tail of an article: others in the same category. */
export function RelatedNews({ articles }: { articles: Card[] }) {
  const { t } = useTranslations()
  if (articles.length === 0) return null

  return (
    <section className="relative w-full" style={{ background: "var(--surface-sunken)" }}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-20">
        <h2 className="section-heading mb-10" style={{ color: "var(--text-heading)" }}>
          {t("news.related", "Keep reading")}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <NewsCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </section>
  )
}
